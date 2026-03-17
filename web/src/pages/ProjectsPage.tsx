import { useEffect, useState, useCallback } from "react";
import { projectsApi, milestonesApi, type Project, type Milestone, type Task } from "../api";

const STATUS_LABEL: Record<string, string> = { active: "Active", archived: "Archived", completed: "Completed" };
const STATUS_COLOR: Record<string, string> = { active: "#22c55e", archived: "#6b7280", completed: "#3b82f6" };
const MS_STATUS_COLOR: Record<string, string> = { open: "#f59e0b", closed: "#22c55e" };

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [msTitle, setMsTitle] = useState("");
  const [msDueDate, setMsDueDate] = useState("");

  const load = useCallback(async () => {
    const res = await projectsApi.list();
    setProjects(res.projects);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (projectId: string) => {
    const [msRes, tasksRes] = await Promise.all([
      milestonesApi.list(projectId),
      projectsApi.tasks(projectId),
    ]);
    setMilestones(msRes.milestones);
    setProjectTasks(tasksRes.tasks);
  }, []);

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      loadDetail(id);
    }
  };

  const addProject = async () => {
    const n = name.trim();
    if (!n) { return; }
    await projectsApi.create({ name: n, description: desc.trim() });
    setName("");
    setDesc("");
    load();
  };

  const addMilestone = async (projectId: string) => {
    const t = msTitle.trim();
    if (!t) { return; }
    await milestonesApi.create(projectId, { title: t, dueDate: msDueDate || undefined });
    setMsTitle("");
    setMsDueDate("");
    loadDetail(projectId);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addProject(); } }} placeholder="プロジェクト名" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明（任意）" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <button onClick={addProject} style={{ padding: "10px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>追加</button>
      </div>

      {!projects.length ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>プロジェクトがありません</div>
      ) : (
        projects.map((p) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 8, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.1)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => toggleExpand(p.id)}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: STATUS_COLOR[p.status] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                {p.description ? <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{p.description}</div> : null}
              </div>
              <select value={p.status} onChange={async (e) => { e.stopPropagation(); await projectsApi.update(p.id, { status: e.target.value }); load(); }} onClick={(e) => e.stopPropagation()} style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
              <button onClick={async (e) => { e.stopPropagation(); await projectsApi.delete(p.id); load(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc" }}>&times;</button>
            </div>

            {expanded === p.id && (
              <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f0f0f0" }}>
                {/* Tasks */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Tasks ({projectTasks.length})</div>
                  {!projectTasks.length ? (
                    <div style={{ fontSize: 13, color: "#bbb" }}>タスクがありません</div>
                  ) : (
                    projectTasks.map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 14 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.status === "done" ? "#22c55e" : t.status === "in_progress" ? "#3b82f6" : "#f59e0b" }} />
                        <span>{t.title}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Milestones */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Milestones ({milestones.length})</div>
                  {milestones.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", marginBottom: 4, background: "#f9f9f9", borderRadius: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: MS_STATUS_COLOR[m.status] }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{m.title}</span>
                        {m.dueDate ? <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>Due: {m.dueDate}</span> : null}
                      </div>
                      <button onClick={async () => { await milestonesApi.update(p.id, m.id, { status: m.status === "open" ? "closed" : "open" }); loadDetail(p.id); }} style={{ padding: "2px 8px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>
                        {m.status === "open" ? "Close" : "Reopen"}
                      </button>
                      <button onClick={async () => { await milestonesApi.delete(p.id, m.id); loadDetail(p.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ccc" }}>&times;</button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addMilestone(p.id); } }} placeholder="マイルストーン名" style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
                    <input type="date" value={msDueDate} onChange={(e) => setMsDueDate(e.target.value)} style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
                    <button onClick={() => addMilestone(p.id)} style={{ padding: "8px 14px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>追加</button>
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
