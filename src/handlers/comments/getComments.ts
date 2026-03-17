import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";
import { commentStore } from "../../store/commentStore";

/**
 * タスクに紐づくコメント一覧を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns コメント一覧のJSONレスポンス、または404エラー
 */
export const getComments = async (c: Context) => {
  const taskId = c.req.param("taskId");
  const task = await taskStore.getById(taskId);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const comments = await commentStore.getByTaskId(taskId);
  return c.json({ comments });
};
