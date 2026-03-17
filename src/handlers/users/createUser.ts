import type { Context } from "hono";
import { userStore } from "../../store/userStore";

/**
 * 新しいユーザーを作成するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたユーザーのJSONレスポンス、またはバリデーションエラー
 */
export const createUser = async (c: Context) => {
  const body = await c.req.json();

  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  if (!body.email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const user = await userStore.create({
    name: body.name,
    email: body.email,
  });

  return c.json({ user }, 201);
};
