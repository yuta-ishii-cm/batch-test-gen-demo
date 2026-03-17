import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * タスクを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteTask = async (c: Context) => {
  const id = c.req.param("id");
  const deleted = await taskStore.delete(id);

  if (!deleted) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ message: "Task deleted" });
};
