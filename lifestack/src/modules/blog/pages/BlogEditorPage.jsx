import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { blogAPI } from "../api/blogAPI";
import BlogPostForm from "../components/BlogPostForm";

export default function BlogEditorPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEditing = Boolean(postId);
  const [post, setPost] = useState(null);
  const [savedCategories, setSavedCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.uid || !postId) { setLoading(false); return; }
    blogAPI.getPost(currentUser.uid, postId).then((snapshot) => { setPost(snapshot.val()); setLoading(false); });
  }, [currentUser?.uid, postId]);

  useEffect(() => {
    const userId = currentUser?.uid;
    setSavedCategories([]);
    if (!userId) return;

    return blogAPI.getPosts(userId, (snapshot) => {
      const posts = Object.values(snapshot.val() || {});
      setSavedCategories(posts.map((entry) => entry.category).filter(Boolean));
    });
  }, [currentUser?.uid]);

  const handleSave = async (payload) => {
    if (!currentUser?.uid) { setError("You must be logged in."); return; }
    if (!payload.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      let savedPostId = postId;
      if (isEditing) await blogAPI.updatePost(currentUser.uid, postId, payload);
      else { const createdPost = await blogAPI.createPost(currentUser.uid, payload); savedPostId = createdPost.id; }
      navigate(`/blog/posts/${savedPostId}`);
    } catch (saveError) { console.error(saveError); setError("Could not save blog post."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">Loading post...</div>;
  if (isEditing && !post) return <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">Post not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/blog" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to blog</Link>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
      <BlogPostForm initialPost={post} savedCategories={savedCategories} onSave={handleSave} onCancel={() => navigate("/blog")} saving={saving} />
    </div>
  );
}
