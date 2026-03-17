import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";
import { commentStore } from "../../store/commentStore";

/**
 * タスクにコメントを追加するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたコメントのJSONレスポンス、またはエラー
 */
export const createComment = async (c: Context) => {
  const taskId = c.req.param("taskId");
  const body = await c.req.json();

  if (!body.content) {
    return c.json({ error: "Content is required" }, 400);
  }

  const task = await taskStore.getById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const comment = await commentStore.create(taskId, {
    authorId: body.authorId,
    content: body.content,
  });

  return c.json({ comment }, 201);
};
