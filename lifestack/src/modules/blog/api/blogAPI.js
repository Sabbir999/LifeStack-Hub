import {
  ref,
  get,
  update,
  push,
  onValue,
  set,
} from "firebase/database";

import { db } from "../../../firebase-config";
import { DB_PATHS } from "../../../services/paths";

const BLOG_KEY = DB_PATHS.BLOG || "blogPosts";
const SHARED_BLOG_KEY = "sharedBlogPosts";
const VIEWS_KEY = "blogPostViews";
const now = () => Date.now();

const getPostsPath = (userId) => `${DB_PATHS.USERS}/${userId}/${BLOG_KEY}`;

const getPostPath = (userId, postId) =>
  `${getPostsPath(userId)}/${postId}`;

const getSharedBlogPostPath = (shareId) =>
  `${SHARED_BLOG_KEY}/${shareId}`;

const getViewsPath = (userId, postId) => `${VIEWS_KEY}/${userId}/${postId}`;

const withViewCount = (post, viewsSnapshot) => ({
  ...post,
  uniqueViewCount: Number(post.uniqueViewCount || 0) + (viewsSnapshot?.size ?? 0),
});

const getOrCreateVisitorId = () => {
  const storageKey = "lifestack_blog_visitor_id";

  try {
    const existingVisitorId = localStorage.getItem(storageKey);

    if (existingVisitorId) {
      return existingVisitorId;
    }

    const visitorId = `visitor_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    localStorage.setItem(storageKey, visitorId);

    return visitorId;
  } catch {
    return null;
  }
};

const listenToRef = (pathRef, callback, errorMessage) => {
  return onValue(
    pathRef,
    callback,
    (error) => console.error(errorMessage, error)
  );
};

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createShareId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePost = (postData = {}) => {
  const title = postData.title?.trim() || "";
  const status = postData.status || "draft";
  const visibility = postData.visibility || "private";
  const slug = slugify(postData.slug || title);

  return {
    title,
    slug,
    excerpt: postData.excerpt?.trim() || "",
    content: postData.content || "",
    coverImageUrl: postData.coverImageUrl?.trim() || "",
    coverColor: postData.coverColor || "blue",
    category: postData.category?.trim() || "Update",
    tags: normalizeTags(postData.tags),
    status,
    visibility,
    featured: Boolean(postData.featured),

    authorName: postData.authorName?.trim() || "",
    authorTitle: postData.authorTitle?.trim() || "",
    authorBio: postData.authorBio?.trim() || "",
    authorImageUrl: postData.authorImageUrl?.trim() || "",

    uniqueViewCount: Number(postData.uniqueViewCount || 0),
    lastViewedAt: postData.lastViewedAt || null,
  };
};

const shouldCreatePublicSharedPost = (post) => {
  return (
    post.status === "published" &&
    (post.visibility === "public" || post.visibility === "unlisted")
  );
};

const savePostAndSharedCopy = async (postPath, post, { creating = false } = {}) => {
  const changes = creating
    ? { [postPath]: post }
    : Object.fromEntries(
        Object.entries(post).map(([field, value]) => [`${postPath}/${field}`, value])
      );

  if (shouldCreatePublicSharedPost(post)) {
    const sharedPath = getSharedBlogPostPath(post.shareId);
    for (const [field, value] of Object.entries({ ...post, sharedAt: now() })) {
      changes[`${sharedPath}/${field}`] = value;
    }
  } else if (!creating) {
    changes[getSharedBlogPostPath(post.shareId)] = null;
  }

  // Commit visibility and the anonymous copy together.
  await update(ref(db), changes);
};

export const blogAPI = {
  createPost: async (userId, postData) => {
    const postId = push(ref(db, getPostsPath(userId))).key;

    if (!postId) {
      throw new Error("Unable to create blog post id.");
    }

    const normalizedPost = normalizePost(postData);

    const postWithId = {
      ...normalizedPost,
      id: postId,
      shareId: createShareId(),
      createdBy: userId,
      createdAt: now(),
      updatedAt: now(),
      publishedAt: normalizedPost.status === "published" ? now() : null,
    };

    await savePostAndSharedCopy(getPostPath(userId, postId), postWithId, {
      creating: true,
    });

    return postWithId;
  },

  getPosts: (userId, callback) => {
    let posts;
    let views;

    const emit = () => {
      if (!posts || !views) return;

      const entries = Object.entries(posts.val() || {});
      const data = Object.fromEntries(
        entries.map(([postId, post]) => [postId, withViewCount(post, views.child(postId))])
      );
      callback({ val: () => posts.exists() ? data : null });
    };

    const stopPosts = listenToRef(ref(db, getPostsPath(userId)), (snapshot) => {
      posts = snapshot;
      emit();
    }, "Blog posts listener error:");

    const stopViews = onValue(ref(db, `${VIEWS_KEY}/${userId}`), (snapshot) => {
      views = snapshot;
      emit();
    }, (error) => {
      console.error("Blog views listener error:", error);
      views = { child: () => null };
      emit();
    });

    return () => {
      stopPosts();
      stopViews();
    };
  },

  getPost: async (userId, postId) => {
    const post = (await get(ref(db, getPostPath(userId, postId)))).val();
    if (!post) return { val: () => null };

    const views = await get(ref(db, getViewsPath(userId, postId)));
    return { val: () => withViewCount(post, views) };
  },

  updatePost: async (userId, postId, updates) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val();

    if (!existingPost) {
      throw new Error("Blog post not found.");
    }

    const normalizedPost = normalizePost({
      ...existingPost,
      ...updates,
    });

    const nextPublishedAt =
      normalizedPost.status === "published"
        ? existingPost.publishedAt || now()
        : updates.publishedAt ?? existingPost.publishedAt ?? null;

    const updatedPost = {
      ...normalizedPost,
      id: existingPost.id || postId,
      shareId: existingPost.shareId || createShareId(),
      createdBy: existingPost.createdBy || userId,
      createdAt: existingPost.createdAt || now(),
      updatedAt: now(),
      publishedAt: nextPublishedAt,
    };

    await savePostAndSharedCopy(getPostPath(userId, postId), updatedPost);

    return postId;
  },

  deletePost: async (userId, postId) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val();

    const changes = {
      [getPostPath(userId, postId)]: null,
      [getViewsPath(userId, postId)]: null,
    };
    if (existingPost?.shareId) {
      changes[getSharedBlogPostPath(existingPost.shareId)] = null;
    }

    await update(ref(db), changes);
    return postId;
  },

  publishPost: (userId, postId) =>
    blogAPI.updatePost(userId, postId, { status: "published", visibility: "public" }),

  unpublishPost: (userId, postId) =>
    blogAPI.updatePost(userId, postId, { status: "draft", visibility: "private" }),

  recordUniqueSharedPostView: async (shareId, sharedPost) => {
    const visitorId = getOrCreateVisitorId();
    const viewsPath = getViewsPath(sharedPost.createdBy, sharedPost.id);
    let visitorKey;
    let writeError;

    if (visitorId && !Object.hasOwn(sharedPost.viewers || {}, visitorId)) {
      const message = new TextEncoder().encode(JSON.stringify([shareId, visitorId]));
      const digest = await crypto.subtle.digest("SHA-256", message);
      visitorKey = Array.from(
        new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")
      ).join("");

      try {
        await set(ref(db, `${viewsPath}/${visitorKey}`), true);
      } catch (error) {
        // A repeat visit cannot overwrite the marker. Check whether it exists.
        writeError = error;
      }
    }

    const views = await get(ref(db, viewsPath));
    if (writeError && !views.hasChild(visitorKey)) throw writeError;

    return { uniqueViewCount: withViewCount(sharedPost, views).uniqueViewCount };
  },

  getSharedPostByShareIdOnce: async (shareId) => {
    const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL?.replace(
      /\/$/,
      ""
    );

    if (!databaseURL) {
      throw new Error("Firebase database URL is missing.");
    }

    const response = await fetch(
      `${databaseURL}/${getSharedBlogPostPath(shareId)}.json`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Failed to load shared blog post: ${response.status}`);
    }

    const data = await response.json();

    return {
      val: () => data,
    };
  },
};

export default blogAPI;