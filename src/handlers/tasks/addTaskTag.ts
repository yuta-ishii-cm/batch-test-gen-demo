import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";
import { tagStore } from "../../store/tagStore";

/**
 * タスクにタグを追加するハンドラー
 * @param c - Honoコンテキスト
 * @returns 追加結果のJSONレスポンス、または404エラー
 */
export const addTaskTag = async (c: Context) => {
  const taskId = c.req.param("id");
  const body = await c.req.json();

  if (!body.tagId) {
    return c.json({ error: "tagId is required" }, 400);
  }

  const task = await taskStore.getById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const tag = await tagStore.getById(body.tagId);
  if (!tag) {
    return c.json({ error: "Tag not found" }, 404);
  }

  await tagStore.addToTask(taskId, body.tagId);
  const tags = await tagStore.getByTaskId(taskId);
  return c.json({ tags }, 201);
};
