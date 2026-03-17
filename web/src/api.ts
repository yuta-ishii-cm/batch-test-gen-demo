/** API呼び出しのヘルパー */
const json = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  return res.json() as Promise<T>;
};

const post = <T>(url: string, body: Record<string, unknown>): Promise<T> =>
  json<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const put = <T>(url: string, body: Record<string, unknown>): Promise<T> =>
  json<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const del = <T>(url: string): Promise<T> =>
  json<T>(url, { method: "DELETE" });

// --- Tasks ---
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  assigneeId: string | null;
  projectId: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  byStatus: { todo: number; in_progress: number; done: number };
}

export const tasksApi = {
  list: (status?: string) =>
    json<{ tasks: Task[] }>(status ? `/api/tasks?status=${status}` : "/api/tasks"),
  search: (q: string) => json<{ tasks: Task[] }>(`/api/tasks/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => json<{ task: Task }>(`/api/tasks/${id}`),
  create: (body: { title: string; description?: string; assigneeId?: string; projectId?: string; milestoneId?: string }) =>
    post<{ task: Task }>("/api/tasks", body),
  update: (id: string, body: Record<string, unknown>) =>
    put<{ task: Task }>(`/api/tasks/${id}`, body),
  delete: (id: string) => del(`/api/tasks/${id}`),
  stats: () => json<Stats>("/api/tasks/stats"),
  getTags: (id: string) => json<{ tags: Tag[] }>(`/api/tasks/${id}/tags`),
  addTag: (id: string, tagId: string) => post<{ tags: Tag[] }>(`/api/tasks/${id}/tags`, { tagId }),
  removeTag: (id: string, tagId: string) => del(`/api/tasks/${id}/tags/${tagId}`),
};

// --- Users ---
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  list: () => json<{ users: User[] }>("/api/users"),
  create: (body: { name: string; email: string }) => post<{ user: User }>("/api/users", body),
  update: (id: string, body: Record<string, unknown>) => put<{ user: User }>(`/api/users/${id}`, body),
  delete: (id: string) => del(`/api/users/${id}`),
  tasks: (id: string) => json<{ tasks: Task[] }>(`/api/users/${id}/tasks`),
};

// --- Tags ---
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export const tagsApi = {
  list: () => json<{ tags: Tag[] }>("/api/tags"),
  create: (body: { name: string; color?: string }) => post<{ tag: Tag }>("/api/tags", body),
  delete: (id: string) => del(`/api/tags/${id}`),
};

// --- Comments ---
export interface Comment {
  id: string;
  taskId: string;
  authorId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const commentsApi = {
  list: (taskId: string) => json<{ comments: Comment[] }>(`/api/tasks/${taskId}/comments`),
  create: (taskId: string, body: { content: string; authorId?: string }) =>
    post<{ comment: Comment }>(`/api/tasks/${taskId}/comments`, body),
  delete: (taskId: string, commentId: string) =>
    del(`/api/tasks/${taskId}/comments/${commentId}`),
};

// --- Projects ---
export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived" | "completed";
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  list: (status?: string) =>
    json<{ projects: Project[] }>(status ? `/api/projects?status=${status}` : "/api/projects"),
  get: (id: string) => json<{ project: Project }>(`/api/projects/${id}`),
  create: (body: { name: string; description?: string }) =>
    post<{ project: Project }>("/api/projects", body),
  update: (id: string, body: Record<string, unknown>) =>
    put<{ project: Project }>(`/api/projects/${id}`, body),
  delete: (id: string) => del(`/api/projects/${id}`),
  tasks: (id: string) => json<{ tasks: Task[] }>(`/api/projects/${id}/tasks`),
};

// --- Milestones ---
export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "open" | "closed";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const milestonesApi = {
  list: (projectId: string) =>
    json<{ milestones: Milestone[] }>(`/api/projects/${projectId}/milestones`),
  get: (projectId: string, id: string) =>
    json<{ milestone: Milestone }>(`/api/projects/${projectId}/milestones/${id}`),
  create: (projectId: string, body: { title: string; description?: string; dueDate?: string }) =>
    post<{ milestone: Milestone }>(`/api/projects/${projectId}/milestones`, body),
  update: (projectId: string, id: string, body: Record<string, unknown>) =>
    put<{ milestone: Milestone }>(`/api/projects/${projectId}/milestones/${id}`, body),
  delete: (projectId: string, id: string) =>
    del(`/api/projects/${projectId}/milestones/${id}`),
};
