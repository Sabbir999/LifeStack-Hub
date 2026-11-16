import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Edit, Share2, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";

import { useAuth } from "../../../contexts/AuthContext";
import { blogAPI } from "../api/blogAPI";
import BlogShareModal from "../components/BlogShareModal";

const formatDate = (timestamp) => {
  if (!timestamp) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

export default function BlogPostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid || !postId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    blogAPI.getPost(currentUser.uid, postId).then((snapshot) => {
      setPost(snapshot.val());
      setLoading(false);
    });
  }, [currentUser?.uid, postId]);

  const handleDelete = async () => {
    if (!currentUser?.uid || !post?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${post.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    await blogAPI.deletePost(currentUser.uid, post.id);
    navigate("/blog");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
        Post not found.
      </div>
    );
  }

  const showCoverImage = post.coverImageUrl && !coverImageError;

  return (
    <article className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/blog"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to blog
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/blog/posts/${post.id}/edit`}
            className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {showCoverImage && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            onError={() => setCoverImageError(true)}
            className="mx-auto block h-auto max-h-[32rem] max-w-full object-contain"
          />
        )}

        <div className="p-6 md:p-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {post.category && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                {post.category}
              </span>
            )}

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold capitalize text-gray-700">
              {post.status}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold capitalize text-gray-700">
              {post.visibility}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
              {(post.uniqueViewCount || 0).toLocaleString()} unique views
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>

          <div className="mt-3 space-y-1 text-gray-500">
            <p>Updated {formatDate(post.updatedAt)}</p>

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

      {showShare && (
        <BlogShareModal
          post={post}
          onClose={() => setShowShare(false)}
          onVisibilitySaved={(visibility) =>
            setPost((previous) => ({ ...previous, visibility }))
          }
        />
      )}
    </article>
  );
}