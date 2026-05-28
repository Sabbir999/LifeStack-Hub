import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  off,
} from "firebase/database";

import { db } from "../../../firebase-config";
import { DB_PATHS } from "../../../services/paths";

const BLOG_KEY = DB_PATHS.BLOG || "blogPosts";
const SHARED_BLOG_KEY = "sharedBlogPosts";
const now = () => Date.now();

const getPostsPath = (userId) => `${DB_PATHS.USERS}/${userId}/${BLOG_KEY}`;

const getPostPath = (userId, postId) =>
  `${getPostsPath(userId)}/${postId}`;

const getSharedBlogPostPath = (shareId) =>
  `${SHARED_BLOG_KEY}/${shareId}`;

const listenToRef = (pathRef, callback, errorMessage) => {
  const unsubscribe = onValue(
    pathRef,
    callback,
    (error) => console.error(errorMessage, error)
  );

  return () => off(pathRef, "value", unsubscribe);
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
    category: postData.category || "Update",
    tags: normalizeTags(postData.tags),
    status,
    visibility,
    featured: Boolean(postData.featured),

    authorName: postData.authorName?.trim() || "",
    authorTitle: postData.authorTitle?.trim() || "",
    authorBio: postData.authorBio?.trim() || "",
    authorImageUrl: postData.authorImageUrl?.trim() || "",
  };
};

const shouldCreatePublicSharedPost = (post) => {
  return (
    post.status === "published" &&
    (post.visibility === "public" || post.visibility === "unlisted")
  );
};

const syncSharedBlogPost = async (post) => {
  if (!post.shareId) {
    return;
  }

  const sharedRef = ref(db, getSharedBlogPostPath(post.shareId));

  try {
    if (!shouldCreatePublicSharedPost(post)) {
      await remove(sharedRef);
      return;
    }

    await set(sharedRef, {
      ...post,
      sharedAt: now(),
    });
  } catch (error) {
    console.error("Shared blog sync failed:", error);
  }
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

    await set(ref(db, getPostPath(userId, postId)), postWithId);
    await syncSharedBlogPost(postWithId);

    return postWithId;
  },

  getPosts: (userId, callback) =>
    listenToRef(
      ref(db, getPostsPath(userId)),
      callback,
      "Blog posts listener error:"
    ),

  getPost: (userId, postId) => get(ref(db, getPostPath(userId, postId))),

  updatePost: async (userId, postId, updates) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val() || {};

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

    await update(postRef, updatedPost);
    await syncSharedBlogPost(updatedPost);

    return postId;
  },

  deletePost: async (userId, postId) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val();

    if (existingPost?.shareId) {
      await remove(ref(db, getSharedBlogPostPath(existingPost.shareId)));
    }

    await remove(postRef);

    return postId;
  },

  publishPost: async (userId, postId) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val() || {};

    const updatedPost = {
      ...existingPost,
      id: existingPost.id || postId,
      shareId: existingPost.shareId || createShareId(),
      status: "published",
      visibility: "public",
      publishedAt: existingPost.publishedAt || now(),
      updatedAt: now(),
    };

    await update(postRef, updatedPost);
    await syncSharedBlogPost(updatedPost);

    return postId;
  },

  unpublishPost: async (userId, postId) => {
    const postRef = ref(db, getPostPath(userId, postId));
    const snapshot = await get(postRef);
    const existingPost = snapshot.val() || {};

    const updatedPost = {
      ...existingPost,
      status: "draft",
      visibility: "private",
      updatedAt: now(),
    };

    await update(postRef, updatedPost);

    if (existingPost.shareId) {
      await remove(ref(db, getSharedBlogPostPath(existingPost.shareId)));
    }

    return postId;
  },

  getSharedPostByShareIdOnce: async (shareId) => {
    return get(ref(db, getSharedBlogPostPath(shareId)));
  },
};

export default blogAPI;