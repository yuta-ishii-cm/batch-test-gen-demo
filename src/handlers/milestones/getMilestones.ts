import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";
import { milestoneStore } from "../../store/milestoneStore";

/**
 * プロジェクトに紐づくマイルストーン一覧を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns マイルストーン一覧のJSONレスポンス、または404エラー
 */
export const getMilestones = async (c: Context) => {
  const projectId = c.req.param("projectId");
  const project = await projectStore.getById(projectId);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const milestones = await milestoneStore.getByProjectId(projectId);
  return c.json({ milestones });
};
