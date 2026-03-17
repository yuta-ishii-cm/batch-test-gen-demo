import { useEffect, useState, useCallback } from "react";
import { tagsApi, type Tag } from "../api";

const PRESET_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const load = useCallback(async () => {
    const res = await tagsApi.list();
    setTags(res.tags);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTag = async () => {
    const n = name.trim();
    if (!n) { return; }
    await tagsApi.create({ name: n, color });
    setName("");
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTag(); } }} placeholder="タグ名" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {PRESET_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: color === c ? "3px solid #111" : "3px solid transparent", cursor: "pointer", padding: 0 }} />
          ))}
        </div>
        <button onClick={addTag} style={{ padding: "10px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>追加</button>
      </div>

      {!tags.length ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>タグがありません</div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.map((t) => (
            <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.color + "18", border: `1px solid ${t.color}44`, padding: "8px 16px", borderRadius: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.color }} />
              <span style={{ fontWeight: 500 }}>{t.name}</span>
              <button onClick={async () => { await tagsApi.delete(t.id); load(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa" }}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
