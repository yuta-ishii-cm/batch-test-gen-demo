import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";
import { tagStore } from "../../store/tagStore";

/**
 * タスクに紐づくタグ一覧を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タグ一覧のJSONレスポンス、または404エラー
 */
export const getTaskTags = async (c: Context) => {
  const taskId = c.req.param("id");
  const task = await taskStore.getById(taskId);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const tags = await tagStore.getByTaskId(taskId);
  return c.json({ tags });
};
