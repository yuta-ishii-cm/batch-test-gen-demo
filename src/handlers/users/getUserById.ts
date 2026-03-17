import type { Context } from "hono";
import { userStore } from "../../store/userStore";

/**
 * IDを指定してユーザーを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns ユーザーのJSONレスポンス、または404エラー
 */
export const getUserById = async (c: Context) => {
  const id = c.req.param("id");
  const user = await userStore.getById(id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
};
