import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * IDを指定してタスクを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タスクのJSONレスポンス、または404エラー
 */
export const getTaskById = async (c: Context) => {
  const id = c.req.param("id");
  const task = await taskStore.getById(id);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ task });
};
