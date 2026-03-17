import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import type { User, CreateUserInput, UpdateUserInput } from "../types/user";

/**
 * DBの行をAPIのUser型に変換する
 * @param row - DBから取得した行
 * @returns User型のオブジェクト
 */
const toUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const userStore = {
  /** 全ユーザーを取得する */
  getAll: async (): Promise<User[]> => {
    const rows = await db.select().from(users);
    return rows.map(toUser);
  },

  /**
   * IDでユーザーを取得する
   * @param id - ユーザーID
   * @returns 見つかったユーザー、または null
   */
  getById: async (id: string): Promise<User | null> => {
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows.length) {
      return null;
    }
    return toUser(rows[0]);
  },

  /**
   * 新しいユーザーを作成する
   * @param input - ユーザー作成用の入力
   * @returns 作成されたユーザー
   */
  create: async (input: CreateUserInput): Promise<User> => {
    const rows = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
      })
      .returning();
    return toUser(rows[0]);
  },

  /**
   * ユーザーを更新する
   * @param id - 更新対象のユーザーID
   * @param input - 更新内容
   * @returns 更新されたユーザー、または null
   */
  update: async (id: string, input: UpdateUserInput): Promise<User | null> => {
    const filtered = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(filtered).length) {
      return userStore.getById(id);
    }

    const rows = await db
      .update(users)
      .set({ ...filtered, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!rows.length) {
      return null;
    }
    return toUser(rows[0]);
  },

  /**
   * ユーザーを削除する
   * @param id - 削除対象のユーザーID
   * @returns 削除成功なら true、見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(users);
  },
};
