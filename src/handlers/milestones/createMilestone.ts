import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";
import { milestoneStore } from "../../store/milestoneStore";

/**
 * マイルストーンを作成するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたマイルストーンのJSONレスポンス、またはエラー
 */
export const createMilestone = async (c: Context) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json();

  if (!body.title) {
    return c.json({ error: "Title is required" }, 400);
  }

  const project = await projectStore.getById(projectId);
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const milestone = await milestoneStore.create(projectId, {
    title: body.title,
    description: body.description,
    dueDate: body.dueDate,
  });

  return c.json({ milestone }, 201);
};
