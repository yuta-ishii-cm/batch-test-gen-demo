import type { Context } from "hono";
import { userStore } from "../../store/userStore";
import { taskStore } from "../../store/taskStore";

/**
 * ユーザーに割り当てられたタスク一覧を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タスク一覧のJSONレスポンス、または404エラー
 */
export const getUserTasks = async (c: Context) => {
  const id = c.req.param("id");
  const user = await userStore.getById(id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const allTasks = await taskStore.getAll();
  const tasks = allTasks.filter((t) => t.assigneeId === id);

  return c.json({ tasks });
};
