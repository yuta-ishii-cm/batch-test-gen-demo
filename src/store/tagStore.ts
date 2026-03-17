import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { tags, taskTags } from "../db/schema";
import type { Tag, CreateTagInput } from "../types/tag";

/**
 * DBの行をAPIのTag型に変換する
 * @param row - DBから取得した行
 * @returns Tag型のオブジェクト
 */
const toTag = (row: typeof tags.$inferSelect): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  createdAt: row.createdAt.toISOString(),
});

export const tagStore = {
  /** 全タグを取得する */
  getAll: async (): Promise<Tag[]> => {
    const rows = await db.select().from(tags);
    return rows.map(toTag);
  },

  /**
   * IDでタグを取得する
   * @param id - タグID
   * @returns 見つかったタグ、または null
   */
  getById: async (id: string): Promise<Tag | null> => {
    const rows = await db.select().from(tags).where(eq(tags.id, id));
    if (!rows.length) {
      return null;
    }
    return toTag(rows[0]);
  },

  /**
   * 新しいタグを作成する
   * @param input - タグ作成用の入力
   * @returns 作成されたタグ
   */
  create: async (input: CreateTagInput): Promise<Tag> => {
    const rows = await db
      .insert(tags)
      .values({
        name: input.name,
        color: input.color ?? "#6b7280",
      })
      .returning();
    return toTag(rows[0]);
  },

  /**
   * タグを削除する
   * @param id - 削除対象のタグID
   * @returns 削除成功なら true、見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(tags)
      .where(eq(tags.id, id))
      .returning({ id: tags.id });
    return rows.length > 0;
  },

  /**
   * タスクに紐づくタグ一覧を取得する
   * @param taskId - タスクID
   * @returns タグの配列
   */
  getByTaskId: async (taskId: string): Promise<Tag[]> => {
    const rows = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));
    return rows.map((r) => toTag(r.tag));
  },

  /**
   * タスクにタグを追加する
   * @param taskId - タスクID
   * @param tagId - タグID
   */
  addToTask: async (taskId: string, tagId: string): Promise<void> => {
    await db
      .insert(taskTags)
      .values({ taskId, tagId })
      .onConflictDoNothing();
  },

  /**
   * タスクからタグを削除する
   * @param taskId - タスクID
   * @param tagId - タグID
   * @returns 削除成功なら true
   */
  removeFromTask: async (taskId: string, tagId: string): Promise<boolean> => {
    const rows = await db
      .delete(taskTags)
      .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)))
      .returning();
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(taskTags);
    await db.delete(tags);
  },
};
