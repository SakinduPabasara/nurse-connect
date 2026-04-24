import { useState, useEffect } from "react";
import API from "../../api/axios";
import { notify } from "../../utils/toast";

export default function CommunityManagementPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/community");
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await API.delete(`/community/${id}`);
      fetchPosts();
      notify.success("Post deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete post.");
    }
  };

  const handleDeleteComment = async (postId, cid) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`/community/${postId}/comments/${cid}`);
      fetchPosts();
      notify.success("Comment deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const catColor = {
    discussion: "badge-blue",
    advice: "badge-green",
    experience: "badge-cyan",
    support: "badge-yellow",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💬 Community Moderation</div>
          <div className="page-subtitle">{posts.length} posts</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">No community posts.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <div key={p._id} className="card">
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="text-muted text-sm">
                    By {p.author?.name} •{" "}
                    {new Date(p.createdAt).toLocaleDateString()} • 💬{" "}
                    {p.comments?.length || 0} comments
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span
                    className={`badge ${catColor[p.category] || "badge-gray"}`}
                  >
                    {p.category}
                  </span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete Post
                  </button>
                </div>
              </div>
              {p.comments?.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-sm text-muted"
                    style={{ marginBottom: 8, fontWeight: 500 }}
                  >
                    Comments:
                  </div>
                  {p.comments.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div className="text-sm">
                        <strong>{c.author?.name}:</strong>{" "}
                        <span className="text-muted">{c.content}</span>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteComment(p._id, c._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
