import type { Context } from "hono";
import { tagStore } from "../../store/tagStore";

/**
 * 全タグを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns タグ一覧のJSONレスポンス
 */
export const getTags = async (c: Context) => {
  const tags = await tagStore.getAll();
  return c.json({ tags });
};
