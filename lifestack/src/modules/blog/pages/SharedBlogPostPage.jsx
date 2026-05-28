import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";

import { blogAPI } from "../api/blogAPI";

const formatDate = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

export default function SharedBlogPostPage() {
  const { userId, shareId } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [coverImageError, setCoverImageError] = useState(false);

  useEffect(() => {
    if (!userId || !shareId) {
      setLoading(false);
      setLoadError("Invalid share link.");
      return;
    }

    setLoading(true);
    setLoadError("");

    blogAPI
      .getSharedPostByShareIdOnce(shareId)
      .then((snapshot) => {
        const sharedPost = snapshot.val();

        if (
          sharedPost &&
          sharedPost.shareId === shareId &&
          sharedPost.status === "published" &&
          (sharedPost.visibility === "public" ||
            sharedPost.visibility === "unlisted")
        ) {
          setPost(sharedPost);
          return;
        }

        setPost(null);
      })
      .catch((error) => {
        console.error("Shared blog load error:", error);

        setLoadError(
          "Could not load this post. Please try opening the link in your browser."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Loading post...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load post
          </h1>

          <p className="mt-2 text-gray-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Post not available
          </h1>

          <p className="mt-2 text-gray-600">
            This post is private, unpublished, or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const showCoverImage = post.coverImageUrl && !coverImageError;

  return (
    <main className="min-h-screen bg-gray-50">
      <article className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">LifeStack Hub Blog</p>
          <p className="mt-1 text-xs text-gray-500">
            Shared from LifeStack Hub
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {showCoverImage && (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              onError={() => setCoverImageError(true)}
              className="max-h-[420px] w-full object-cover"
            />
          )}

          <div className="p-6 md:p-10">
            <div className="mb-4 flex flex-wrap gap-2">
              {post.category && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  {post.category}
                </span>
              )}

              {post.publishedAt && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                  {formatDate(post.publishedAt)}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>

            <div className="mt-3 space-y-1 text-gray-500">
              {post.publishedAt && (
                <p>Published {formatDate(post.publishedAt)}</p>
              )}

              {post.authorName && (
                <p>
                  By{" "}
                  <span className="font-semibold text-gray-700">
                    {post.authorName}
                  </span>
                  {post.authorTitle ? ` · ${post.authorTitle}` : ""}
                </p>
              )}
            </div>

            {post.excerpt && (
              <p className="mt-6 text-xl leading-8 text-gray-700">
                {post.excerpt}
              </p>
            )}

            {post.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="blog-editor mt-8 max-w-none leading-8 text-gray-800"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  post.content || "<p>No content yet.</p>"
                ),
              }}
            />
          </div>
        </div>
      </article>
    </main>
  );
}