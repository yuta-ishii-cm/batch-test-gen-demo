import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from "../types/task";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

/**
 * DBの行をAPIのTask型に変換する
 * @param row - DBから取得した行
 * @returns Task型のオブジェクト
 */
const toTask = (row: typeof tasks.$inferSelect): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status as TaskStatus,
  assigneeId: row.assigneeId,
  projectId: row.projectId,
  milestoneId: row.milestoneId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const taskStore = {
  /** 全タスクを取得する */
  getAll: async (): Promise<Task[]> => {
    const rows = await db.select().from(tasks);
    return rows.map(toTask);
  },

  /**
   * IDでタスクを取得する
   * @param id - タスクID
   * @returns 見つかったタスク、または null
   */
  getById: async (id: string): Promise<Task | null> => {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!rows.length) {
      return null;
    }
    return toTask(rows[0]);
  },

  /**
   * 新しいタスクを作成する
   * @param input - タスク作成用の入力
   * @returns 作成されたタスク
   */
  create: async (input: CreateTaskInput): Promise<Task> => {
    const rows = await db
      .insert(tasks)
      .values({
        title: input.title,
        description: input.description ?? "",
        status: input.status ?? "todo",
        assigneeId: input.assigneeId ?? null,
        projectId: input.projectId ?? null,
        milestoneId: input.milestoneId ?? null,
      })
      .returning();
    return toTask(rows[0]);
  },

  /**
   * タスクを更新する
   * @param id - 更新対象のタスクID
   * @param input - 更新内容
   * @returns 更新されたタスク、または null（タスクが見つからない場合）
   */
  update: async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    const filtered = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(filtered).length) {
      return taskStore.getById(id);
    }

    const rows = await db
      .update(tasks)
      .set({ ...filtered, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (!rows.length) {
      return null;
    }
    return toTask(rows[0]);
  },

  /**
   * タスクを削除する
   * @param id - 削除対象のタスクID
   * @returns 削除成功なら true、タスクが見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(tasks);
  },

  /** ステータスが有効かどうかを判定する */
  isValidStatus: (status: string): status is TaskStatus =>
    VALID_STATUSES.includes(status as TaskStatus),
};
