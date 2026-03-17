import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";

/**
 * プロジェクトを更新するハンドラー
 * @param c - Honoコンテキスト
 * @returns 更新されたプロジェクトのJSONレスポンス、またはエラー
 */
export const updateProject = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  if (body.status && !projectStore.isValidStatus(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const project = await projectStore.update(id, {
    name: body.name,
    description: body.description,
    status: body.status,
  });

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ project });
};
