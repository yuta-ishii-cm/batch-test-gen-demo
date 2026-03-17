import type { Context } from "hono";
import { userStore } from "../../store/userStore";

/**
 * 全ユーザーを取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns ユーザー一覧のJSONレスポンス
 */
export const getUsers = async (c: Context) => {
  const users = await userStore.getAll();
  return c.json({ users });
};
