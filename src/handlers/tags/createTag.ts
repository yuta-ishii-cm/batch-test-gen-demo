import type { Context } from "hono";
import { tagStore } from "../../store/tagStore";

/**
 * 新しいタグを作成するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたタグのJSONレスポンス、またはバリデーションエラー
 */
export const createTag = async (c: Context) => {
  const body = await c.req.json();

  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const tag = await tagStore.create({
    name: body.name,
    color: body.color,
  });

  return c.json({ tag }, 201);
};
