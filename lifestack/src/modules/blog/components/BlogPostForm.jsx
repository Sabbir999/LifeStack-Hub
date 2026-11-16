import React, { useId, useMemo, useState } from "react";
import { Save, Send } from "lucide-react";

import RichTextEditor from "./RichTextEditor";

const categories = [
  "Update",
  "Announcement",
  "Tutorial",
  "Story",
  "Product",
  "Sports",
  "Travel",
  "Other",
];

const coverColors = ["blue", "green", "amber", "purple", "rose", "gray"];

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BlogPostForm({
  initialPost = null,
  savedCategories = [],
  onSave,
  onCancel,
  saving = false,
}) {
  const isEditing = Boolean(initialPost);
  const categoryListId = useId();

  const [form, setForm] = useState({
    title: initialPost?.title || "",
    slug: initialPost?.slug || "",
    excerpt: initialPost?.excerpt || "",
    content: initialPost?.content || "",
    coverImageUrl: initialPost?.coverImageUrl || "",
    coverColor: initialPost?.coverColor || "blue",
    category: initialPost?.category || "Update",
    tags: Array.isArray(initialPost?.tags) ? initialPost.tags.join(", ") : "",
    status: initialPost?.status || "draft",
    visibility: initialPost?.visibility || "private",
    featured: Boolean(initialPost?.featured),

    authorName: initialPost?.authorName || "",
    authorTitle: initialPost?.authorTitle || "",
    authorBio: initialPost?.authorBio || "",
    authorImageUrl: initialPost?.authorImageUrl || "",
  });

  const generatedSlug = useMemo(
    () => slugify(form.slug || form.title),
    [form.slug, form.title]
  );

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const buildPayload = (statusOverride) => ({
    ...form,
    slug: generatedSlug,
    status: statusOverride || form.status,
    category: form.category.trim() || "Update",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-xl font-bold"
            placeholder="How I Built LifeStack"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Slug</span>
          <input
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
            placeholder={generatedSlug || "post-url-slug"}
          />
          <p className="mt-1 text-xs text-gray-500">
            Final slug: {generatedSlug || "none"}
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Excerpt</span>
          <textarea
            value={form.excerpt}
            onChange={(event) => updateField("excerpt", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
            rows={3}
            placeholder="Short summary shown on blog cards..."
          />
        </label>

        <div>
          <span className="text-sm font-semibold text-gray-700">Content</span>

          <RichTextEditor
            value={form.content}
            onChange={(content) => updateField("content", content)}
          />

          <p className="mt-2 text-xs text-gray-500">
            Select text and use the toolbar to change font size, headings,
            bold, italic, lists, quotes, links, undo, and redo.
          </p>
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? "Post settings" : "Create post"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Save as draft or publish when ready.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">
            Visibility
          </span>
          <select
            value={form.visibility}
            onChange={(event) => updateField("visibility", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Category</span>
          <input
            list={categoryListId}
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
            placeholder="Choose or type a category"
          />
          <datalist id={categoryListId}>
            {[...new Set([...categories, ...savedCategories])].map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Tags</span>
          <input
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
            placeholder="product, update, story"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">
            Cover image URL
          </span>
          <input
            value={form.coverImageUrl}
            onChange={(event) =>
              updateField("coverImageUrl", event.target.value)
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
            placeholder="https://..."
          />
        </label>

        <div>
          <span className="text-sm font-semibold text-gray-700">
            Cover color
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {coverColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateField("coverColor", color)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold capitalize ${
                  form.coverColor === color
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => updateField("featured", event.target.checked)}
          />
          Featured post
        </label>

        <div className="rounded-xl bg-gray-50 p-4">
          <h4 className="font-bold text-gray-900">Author info</h4>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-gray-700">
              Author name
            </span>
            <input
              value={form.authorName}
              onChange={(event) =>
                updateField("authorName", event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
              placeholder="Saifur Sabbir"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-gray-700">
              Author title
            </span>
            <input
              value={form.authorTitle}
              onChange={(event) =>
                updateField("authorTitle", event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
              placeholder="Founder of LifeStack"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-gray-700">
              Author image URL
            </span>
            <input
              value={form.authorImageUrl}
              onChange={(event) =>
                updateField("authorImageUrl", event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
              placeholder="https://..."
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-gray-700">
              Author bio
            </span>
            <textarea
              value={form.authorBio}
              onChange={(event) => updateField("authorBio", event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5"
              rows={3}
              placeholder="Short note about the author..."
            />
          </label>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onSave(buildPayload("draft"))}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Save className="mr-2 h-5 w-5" />
            Save draft
          </button>

          <button
            type="button"
            onClick={() => onSave(buildPayload("published"))}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Send className="mr-2 h-5 w-5" />
            Publish
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
}