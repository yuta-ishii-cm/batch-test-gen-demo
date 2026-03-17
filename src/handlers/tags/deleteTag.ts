import type { Context } from "hono";
import { tagStore } from "../../store/tagStore";

/**
 * タグを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteTag = async (c: Context) => {
  const id = c.req.param("id");
  const deleted = await tagStore.delete(id);

  if (!deleted) {
    return c.json({ error: "Tag not found" }, 404);
  }

  return c.json({ message: "Tag deleted" });
};
