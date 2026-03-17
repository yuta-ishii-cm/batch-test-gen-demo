import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";
import { tagStore } from "../../store/tagStore";

/**
 * タスクからタグを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除結果のJSONレスポンス、または404エラー
 */
export const removeTaskTag = async (c: Context) => {
  const taskId = c.req.param("id");
  const tagId = c.req.param("tagId");

  const task = await taskStore.getById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const removed = await tagStore.removeFromTask(taskId, tagId);
  if (!removed) {
    return c.json({ error: "Tag not found on this task" }, 404);
  }

  return c.json({ message: "Tag removed from task" });
};
