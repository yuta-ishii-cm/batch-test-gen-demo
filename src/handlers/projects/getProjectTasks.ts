import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";
import { taskStore } from "../../store/taskStore";

/**
 * プロジェクトに属するタスク一覧を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タスク一覧のJSONレスポンス、または404エラー
 */
export const getProjectTasks = async (c: Context) => {
  const id = c.req.param("id");
  const project = await projectStore.getById(id);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const allTasks = await taskStore.getAll();
  const tasks = allTasks.filter((t) => t.projectId === id);

  return c.json({ tasks });
};
