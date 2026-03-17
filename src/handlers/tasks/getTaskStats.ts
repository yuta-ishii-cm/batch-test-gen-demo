import type { Context } from "hono";
import { taskStore } from "../../store/taskStore";

/**
 * タスクの統計情報を取得するハンドラー
 * @param c - Honoコンテキスト
 * @returns 統計情報のJSONレスポンス
 */
export const getTaskStats = async (c: Context) => {
  const tasks = await taskStore.getAll();

  const byStatus = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return c.json({
    total: tasks.length,
    byStatus,
  });
};
