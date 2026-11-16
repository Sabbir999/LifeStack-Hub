const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

initializeApp();

const isShareable = (post) =>
  post?.status === "published" &&
  (post.visibility === "public" || post.visibility === "unlisted");

const isKey = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);

const viewCount = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : 0;

exports.recordBlogView = onCall(async (request) => {
  const { shareId, visitorId } = request.data || {};

  if (!isKey(shareId) || !isKey(visitorId) || !visitorId.startsWith("visitor_")) {
    throw new HttpsError("invalid-argument", "Invalid share or visitor ID.");
  }

  const db = getDatabase();
  const sharedSnapshot = await db.ref(`sharedBlogPosts/${shareId}`).get();
  const sharedPost = sharedSnapshot.val();

  if (
    !isShareable(sharedPost) ||
    !isKey(sharedPost.createdBy) ||
    !isKey(sharedPost.id)
  ) {
    throw new HttpsError("not-found", "This post is private or unavailable.");
  }

  const postRef = db.ref(
    `users/${sharedPost.createdBy}/blogPosts/${sharedPost.id}`
  );
  const viewedAt = Date.now();

  const result = await postRef.transaction((post) => {
    // A transaction may initially receive null before reading server data.
    if (post === null) return null;

    if (
      !isShareable(post) ||
      post.shareId !== shareId ||
      post.createdBy !== sharedPost.createdBy
    ) {
      return undefined;
    }

    const viewers = post.viewers || sharedPost.viewers || {};
    const count = Math.max(
      viewCount(post.uniqueViewCount),
      viewCount(sharedPost.uniqueViewCount)
    );

    if (Object.hasOwn(viewers, visitorId)) {
      return { ...post, viewers, uniqueViewCount: count };
    }

    return {
      ...post,
      viewers: { ...viewers, [visitorId]: { viewedAt } },
      uniqueViewCount: count + 1,
      lastViewedAt: viewedAt,
    };
  });

  if (!result.committed || !result.snapshot.exists()) {
    throw new HttpsError("not-found", "This post is private or unavailable.");
  }

  return {
    uniqueViewCount: result.snapshot.child("uniqueViewCount").val(),
    lastViewedAt: result.snapshot.child("lastViewedAt").val(),
  };
});