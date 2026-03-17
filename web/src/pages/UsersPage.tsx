import { useEffect, useState, useCallback } from "react";
import { usersApi, type User, type Task } from "../api";

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    const res = await usersApi.list();
    setUsers(res.users);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addUser = async () => {
    const n = name.trim();
    const e = email.trim();
    if (!n || !e) { return; }
    await usersApi.create({ name: n, email: e });
    setName("");
    setEmail("");
    load();
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      const res = await usersApi.tasks(id);
      setUserTasks(res.tasks);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addUser(); } }} placeholder="メールアドレス" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <button onClick={addUser} style={{ padding: "10px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>追加</button>
      </div>

      {!users.length ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>ユーザーがいません</div>
      ) : (
        users.map((u) => (
          <div key={u.id} style={{ background: "#fff", borderRadius: 8, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.1)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => toggleExpand(u.id)}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 16, color: "#666" }}>
                {u.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{u.email}</div>
              </div>
              <button onClick={async (e) => { e.stopPropagation(); await usersApi.delete(u.id); load(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc" }}>&times;</button>
            </div>

            {expanded === u.id && (
              <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, color: "#888", marginTop: 12, marginBottom: 6 }}>Assigned Tasks ({userTasks.length})</div>
                {!userTasks.length ? (
                  <div style={{ fontSize: 13, color: "#bbb" }}>割り当てられたタスクはありません</div>
                ) : (
                  userTasks.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.status === "done" ? "#22c55e" : t.status === "in_progress" ? "#3b82f6" : "#f59e0b" }} />
                      <span>{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
