import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";

/**
 * プロジェクトを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteProject = async (c: Context) => {
  const id = c.req.param("id");
  const deleted = await projectStore.delete(id);

  if (!deleted) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ message: "Project deleted" });
};
