import type { Context } from "hono";
import { milestoneStore } from "../../store/milestoneStore";

/**
 * IDを指定してマイルストーンを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns マイルストーンのJSONレスポンス、または404エラー
 */
export const getMilestoneById = async (c: Context) => {
  const id = c.req.param("milestoneId");
  const milestone = await milestoneStore.getById(id);

  if (!milestone) {
    return c.json({ error: "Milestone not found" }, 404);
  }

  return c.json({ milestone });
};
