import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";

/**
 * 全プロジェクトを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns プロジェクト一覧のJSONレスポンス
 */
export const getProjects = async (c: Context) => {
  const status = c.req.query("status");
  let projects = await projectStore.getAll();

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  return c.json({ projects });
};
