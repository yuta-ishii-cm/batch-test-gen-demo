import type { Context } from "hono";
import { projectStore } from "../../store/projectStore";

/**
 * 新しいプロジェクトを作成するハンドラー
 * @param c - Honoコンテキスト
 * @returns 作成されたプロジェクトのJSONレスポンス、またはバリデーションエラー
 */
export const createProject = async (c: Context) => {
  const body = await c.req.json();

  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const project = await projectStore.create({
    name: body.name,
    description: body.description,
  });

  return c.json({ project }, 201);
};
