import type { Context } from "hono";
import { userStore } from "../../store/userStore";

/**
 * ユーザーを削除するハンドラー
 * @param c - Honoコンテキスト
 * @returns 削除成功メッセージ、または404エラー
 */
export const deleteUser = async (c: Context) => {
  const id = c.req.param("id");
  const deleted = await userStore.delete(id);

  if (!deleted) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ message: "User deleted" });
};
