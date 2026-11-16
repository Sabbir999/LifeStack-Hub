import React from "react";
import { Link } from "react-router-dom";
import { Edit, Eye, Share2, Trash2 } from "lucide-react";

const coverColorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  rose: "bg-rose-50 text-rose-600",
  gray: "bg-gray-100 text-gray-600",
};

export default function BlogPostCard({ post, onShare, onDelete }) {
  const coverClass =
    coverColorClasses[post.coverColor] || coverColorClasses.blue;

  const uniqueViews = Number(post.uniqueViewCount || 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {post.coverImageUrl ? (
        <img
          src={post.coverImageUrl}
          alt={post.title || "Blog post cover"}
          className="h-36 w-full bg-gray-50 object-contain"
        />
      ) : (
        <div
          className={`flex h-36 w-full items-center justify-center text-4xl ${coverClass}`}
        >
          📝
        </div>
      )}

      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
              post.status === "published"
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {post.status || "draft"}
          </span>

          {post.category && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {post.category}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-xl font-bold text-gray-900">
          {post.title || "Untitled post"}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
          {post.excerpt || "No excerpt yet."}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-500">
          <Eye className="h-4 w-4" />
          <span>
            {uniqueViews.toLocaleString()}{" "}
            {uniqueViews === 1 ? "unique view" : "unique views"}
          </span>
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/blog/posts/${post.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>

          <Link
            to={`/blog/posts/${post.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => onShare?.(post)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(post)}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}