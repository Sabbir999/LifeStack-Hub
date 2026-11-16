import React from "react";
import { Eye, FileText, Globe2, PencilLine, Share2 } from "lucide-react";

function StatCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

export default function BlogStats({ posts = [] }) {
  const totalPosts = posts.length;

  const published = posts.filter(
    (post) => post.status === "published"
  ).length;

  const drafts = posts.filter((post) => post.status !== "published").length;

  const shared = posts.filter(
    (post) => post.visibility === "public" || post.visibility === "unlisted"
  ).length;

  const uniqueViews = posts.reduce(
    (total, post) => total + Number(post.uniqueViewCount || 0),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total Posts"
        value={totalPosts}
        subtitle="All time"
        icon={FileText}
      />

      <StatCard
        label="Published"
        value={published}
        subtitle="Live & public"
        icon={Globe2}
      />

      <StatCard
        label="Drafts"
        value={drafts}
        subtitle="In progress"
        icon={PencilLine}
      />

      <StatCard
        label="Shared"
        value={shared}
        subtitle="Public links"
        icon={Share2}
      />

      <StatCard
        label="Unique Views"
        value={uniqueViews.toLocaleString()}
        subtitle="Public readers"
        icon={Eye}
      />
    </div>
  );
}