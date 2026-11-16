import React, { useMemo, useState } from "react";
import { Copy, X } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import { blogAPI } from "../api/blogAPI";

export default function BlogShareModal({ post, onClose, onVisibilitySaved }) {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(post?.visibility || "private");
  const [savedVisibility, setSavedVisibility] = useState(post?.visibility || "private");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const shareUrl = useMemo(() => {
    if (!post?.shareId || !currentUser?.uid) return "";
    return `${window.location.origin}/blog/share/${currentUser.uid}/${post.shareId}`;
  }, [post?.shareId, currentUser?.uid]);

  const handleSaveVisibility = async () => {
    if (!currentUser?.uid || !post?.id) return;
    setSaving(true);
    setError("");
    try {
      await blogAPI.updatePost(currentUser.uid, post.id, { visibility });
      setSavedVisibility(visibility);
      onVisibilitySaved?.(visibility);
    } catch (saveError) {
      console.error("Could not save blog visibility:", saveError);
      setError("Could not save visibility. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share post</h2>
            <p className="mt-1 text-sm text-gray-500">Control visibility and copy a public link.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Visibility</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5">
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </label>

        <button type="button" onClick={handleSaveVisibility} disabled={saving} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save visibility"}
        </button>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5">
          <span className="text-sm font-semibold text-gray-700">Share link</span>
          <div className="mt-1 flex gap-2">
            <input value={shareUrl} readOnly className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm" />
            <button type="button" onClick={copyLink} disabled={saving || post?.status !== "published" || savedVisibility === "private" || visibility === "private" || !shareUrl} className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {visibility === "private" && <p className="mt-2 text-xs text-red-500">Private posts cannot be viewed from the public share link.</p>}
        </div>
      </div>
    </div>
  );
}
