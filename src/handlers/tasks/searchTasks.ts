import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * タスクをキーワードで検索するハンドラー
 * @param c - Honoコンテキスト
 * @returns 検索結果のJSONレスポンス、またはバリデーションエラー
 */
export const searchTasks = async (c: Context) => {
  const q = c.req.query("q");

  if (!q) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  const allTasks = await taskStore.getAll();
  const lower = q.toLowerCase();
  const tasks = allTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
  );

  return c.json({ tasks });
};
