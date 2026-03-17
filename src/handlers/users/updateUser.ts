import type { Context } from "hono";
import { userStore } from "../../store/userStore";

/**
 * ユーザーを更新するハンドラー
 * @param c - Honoコンテキスト
 * @returns 更新されたユーザーのJSONレスポンス、またはエラー
 */
export const updateUser = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const user = await userStore.update(id, {
    name: body.name,
    email: body.email,
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
};
