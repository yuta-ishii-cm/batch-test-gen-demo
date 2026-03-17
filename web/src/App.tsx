import { useState } from "react";
import { TasksPage } from "./pages/TasksPage";
import { UsersPage } from "./pages/UsersPage";
import { TagsPage } from "./pages/TagsPage";
import { ProjectsPage } from "./pages/ProjectsPage";

type Page = "tasks" | "users" | "tags" | "projects";

const NAV: { key: Page; label: string }[] = [
  { key: "tasks", label: "Tasks" },
  { key: "projects", label: "Projects" },
  { key: "users", label: "Users" },
  { key: "tags", label: "Tags" },
];

export const App = () => {
  const [page, setPage] = useState<Page>("tasks");

  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24, borderBottom: "1px solid #e5e5e5", paddingBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Task Manager</h1>
        <nav style={{ display: "flex", gap: 4 }}>
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setPage(n.key)}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: 6,
                background: page === n.key ? "#111" : "transparent",
                color: page === n.key ? "#fff" : "#666",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: page === n.key ? 600 : 400,
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
      {page === "tasks" && <TasksPage />}
      {page === "projects" && <ProjectsPage />}
      {page === "users" && <UsersPage />}
      {page === "tags" && <TagsPage />}
    </div>
  );
};
