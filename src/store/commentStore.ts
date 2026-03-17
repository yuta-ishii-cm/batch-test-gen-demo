import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { comments } from "../db/schema";
import type { Comment, CreateCommentInput } from "../types/comment";

/**
 * DBの行をAPIのComment型に変換する
 * @param row - DBから取得した行
 * @returns Comment型のオブジェクト
 */
const toComment = (row: typeof comments.$inferSelect): Comment => ({
  id: row.id,
  taskId: row.taskId,
  authorId: row.authorId,
  content: row.content,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const commentStore = {
  /**
   * タスクに紐づくコメント一覧を取得する
   * @param taskId - タスクID
   * @returns コメントの配列
   */
  getByTaskId: async (taskId: string): Promise<Comment[]> => {
    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId));
    return rows.map(toComment);
  },

  /**
   * コメントを作成する
   * @param taskId - タスクID
   * @param input - コメント作成用の入力
   * @returns 作成されたコメント
   */
  create: async (
    taskId: string,
    input: CreateCommentInput
  ): Promise<Comment> => {
    const rows = await db
      .insert(comments)
      .values({
        taskId,
        authorId: input.authorId ?? null,
        content: input.content,
      })
      .returning();
    return toComment(rows[0]);
  },

  /**
   * コメントを削除する
   * @param id - 削除対象のコメントID
   * @returns 削除成功なら true、見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning({ id: comments.id });
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(comments);
  },
};
