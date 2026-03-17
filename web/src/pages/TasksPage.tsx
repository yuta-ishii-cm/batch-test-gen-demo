import { useEffect, useState, useCallback } from "react";
import { tasksApi, commentsApi, type Task, type Stats, type Tag, type Comment, type User, usersApi, tagsApi } from "../api";

const STATUS_LABEL: Record<string, string> = { todo: "Todo", in_progress: "In Progress", done: "Done" };
const STATUS_COLOR: Record<string, string> = { todo: "#f59e0b", in_progress: "#3b82f6", done: "#22c55e" };

export const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byStatus: { todo: 0, in_progress: 0, done: 0 } });
  const [users, setUsers] = useState<User[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [taskTags, setTaskTags] = useState<Tag[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    const [tasksRes, statsRes, usersRes, tagsRes] = await Promise.all([
      search ? tasksApi.search(search) : tasksApi.list(filter || undefined),
      tasksApi.stats(),
      usersApi.list(),
      tagsApi.list(),
    ]);
    setTasks(tasksRes.tasks);
    setStats(statsRes);
    setUsers(usersRes.users);
    setAllTags(tagsRes.tags);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (taskId: string) => {
    const [tagsRes, commentsRes] = await Promise.all([
      tasksApi.getTags(taskId),
      commentsApi.list(taskId),
    ]);
    setTaskTags(tagsRes.tags);
    setComments(commentsRes.comments);
  }, []);

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      loadDetail(id);
    }
  };

  const addTask = async () => {
    const t = title.trim();
    if (!t) { return; }
    await tasksApi.create({ title: t, description: desc.trim() });
    setTitle("");
    setDesc("");
    load();
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", value: stats.total, color: "#111" },
          { label: "Todo", value: stats.byStatus.todo, color: STATUS_COLOR.todo },
          { label: "In Progress", value: stats.byStatus.in_progress, color: STATUS_COLOR.in_progress },
          { label: "Done", value: stats.byStatus.done, color: STATUS_COLOR.done },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "12px 16px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setFilter(""); }}
        placeholder="タスクを検索..."
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
      />

      {/* New task form */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTask(); } }} placeholder="タイトル" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明（任意）" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <button onClick={addTask} style={{ padding: "10px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>追加</button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["", "todo", "in_progress", "done"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setSearch(""); }} style={{ padding: "6px 14px", border: `1px solid ${filter === f && !search ? "#111" : "#ddd"}`, borderRadius: 20, background: filter === f && !search ? "#111" : "#fff", color: filter === f && !search ? "#fff" : "#111", cursor: "pointer", fontSize: 13 }}>
            {f ? STATUS_LABEL[f] : "All"}
          </button>
        ))}
      </div>

      {/* Task list */}
      {!tasks.length ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>タスクがありません</div>
      ) : (
        tasks.map((t) => (
          <div key={t.id} style={{ background: "#fff", borderRadius: 8, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.1)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => toggleExpand(t.id)}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: STATUS_COLOR[t.status] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                {t.description ? <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{t.description}</div> : null}
                {t.assigneeId ? <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Assignee: {users.find((u) => u.id === t.assigneeId)?.name ?? "Unknown"}</div> : null}
              </div>
              <select value={t.status} onChange={async (e) => { e.stopPropagation(); await tasksApi.update(t.id, { status: e.target.value }); load(); }} onClick={(e) => e.stopPropagation()} style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
              <select value={t.assigneeId ?? ""} onChange={async (e) => { e.stopPropagation(); await tasksApi.update(t.id, { assigneeId: e.target.value || null }); load(); }} onClick={(e) => e.stopPropagation()} style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}>
                <option value="">Unassigned</option>
                {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              <button onClick={async (e) => { e.stopPropagation(); await tasksApi.delete(t.id); load(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc" }}>&times;</button>
            </div>

            {/* Expanded detail */}
            {expanded === t.id && (
              <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f0f0f0" }}>
                {/* Tags */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Tags</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {taskTags.map((tag) => (
                      <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: tag.color + "22", color: tag.color, padding: "2px 10px", borderRadius: 12, fontSize: 13 }}>
                        {tag.name}
                        <button onClick={async () => { await tasksApi.removeTag(t.id, tag.id); loadDetail(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: tag.color, fontSize: 14, padding: 0 }}>&times;</button>
                      </span>
                    ))}
                    {allTags.filter((at) => !taskTags.some((tt) => tt.id === at.id)).length > 0 && (
                      <select onChange={async (e) => { if (e.target.value) { await tasksApi.addTag(t.id, e.target.value); loadDetail(t.id); e.target.value = ""; } }} defaultValue="" style={{ padding: "2px 6px", border: "1px solid #ddd", borderRadius: 4, fontSize: 12 }}>
                        <option value="">+ Add tag</option>
                        {allTags.filter((at) => !taskTags.some((tt) => tt.id === at.id)).map((at) => (
                          <option key={at.id} value={at.id}>{at.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Comments ({comments.length})</div>
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, padding: 8, background: "#f9f9f9", borderRadius: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#888" }}>{c.authorId ? users.find((u) => u.id === c.authorId)?.name ?? "Unknown" : "Anonymous"} · {new Date(c.createdAt).toLocaleString()}</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{c.content}</div>
                      </div>
                      <button onClick={async () => { await commentsApi.delete(t.id, c.id); loadDetail(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ccc" }}>&times;</button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && newComment.trim()) { await commentsApi.create(t.id, { content: newComment.trim() }); setNewComment(""); loadDetail(t.id); } }} placeholder="コメントを追加..." style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
                    <button onClick={async () => { if (newComment.trim()) { await commentsApi.create(t.id, { content: newComment.trim() }); setNewComment(""); loadDetail(t.id); } }} style={{ padding: "8px 14px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>送信</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
