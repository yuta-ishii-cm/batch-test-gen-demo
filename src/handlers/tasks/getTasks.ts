import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * 全タスクを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タスク一覧のJSONレスポンス
 */
export const getTasks = async (c: Context) => {
  const status = c.req.query("status");
  let tasks = await taskStore.getAll();

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  return c.json({ tasks });
};
