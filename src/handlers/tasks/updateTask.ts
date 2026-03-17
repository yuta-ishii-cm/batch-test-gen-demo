import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * タスクを更新するハンドラー
 * @param c - Honoコンテキスト
 * @returns 更新されたタスクのJSONレスポンス、またはエラー
 */
export const updateTask = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  if (body.status && !taskStore.isValidStatus(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const task = await taskStore.update(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    assigneeId: body.assigneeId,
    projectId: body.projectId,
    milestoneId: body.milestoneId,
  });

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ task });
};
