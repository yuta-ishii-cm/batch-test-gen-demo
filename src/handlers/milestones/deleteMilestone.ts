import type { Context } from "hono";
import { milestoneStore } from "../../store/milestoneStore";

/**
 * マイルストーンを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteMilestone = async (c: Context) => {
  const id = c.req.param("milestoneId");
  const deleted = await milestoneStore.delete(id);

  if (!deleted) {
    return c.json({ error: "Milestone not found" }, 404);
  }

  return c.json({ message: "Milestone deleted" });
};
