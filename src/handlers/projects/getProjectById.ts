import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";

/**
 * IDを指定してプロジェクトを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns プロジェクトのJSONレスポンス、または404エラー
 */
export const getProjectById = async (c: Context) => {
  const id = c.req.param("id");
  const project = await projectStore.getById(id);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ project });
};
