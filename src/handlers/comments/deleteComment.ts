import type { Context } from "hono";
import { commentStore } from "../../store/commentStore";

/**
 * コメントを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteComment = async (c: Context) => {
  const id = c.req.param("commentId");
  const deleted = await commentStore.delete(id);

  if (!deleted) {
    return c.json({ error: "Comment not found" }, 404);
  }

  return c.json({ message: "Comment deleted" });
};
