import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * 新しいタスクを作成するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたタスクのJSONレスポンス、またはバリデーションエラー
 */
export const createTask = async (c: Context) => {
  const body = await c.req.json();

  if (!body.title) {
    return c.json({ error: "Title is required" }, 400);
  }

  if (body.status && !taskStore.isValidStatus(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const task = await taskStore.create({
    title: body.title,
    description: body.description,
    status: body.status,
    assigneeId: body.assigneeId,
    projectId: body.projectId,
    milestoneId: body.milestoneId,
  });

  return c.json({ task }, 201);
};
