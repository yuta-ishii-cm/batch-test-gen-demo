import type { Context } from "hono";
import { milestoneStore } from "../../store/milestoneStore";

/**
 * マイルストーンを更新するハンドラー
 * @param c - Honoコンテキスト
 * @returns 更新されたマイルストーンのJSONレスポンス、またはエラー
 */
export const updateMilestone = async (c: Context) => {
  const id = c.req.param("milestoneId");
  const body = await c.req.json();

  if (body.status && !milestoneStore.isValidStatus(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const milestone = await milestoneStore.update(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    dueDate: body.dueDate,
  });

  if (!milestone) {
    return c.json({ error: "Milestone not found" }, 404);
  }

  return c.json({ milestone });
};
