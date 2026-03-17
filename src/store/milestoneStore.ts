import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { milestones } from "../db/schema";
import type {
  Milestone,
  MilestoneStatus,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "../types/milestone";

const VALID_STATUSES: MilestoneStatus[] = ["open", "closed"];

/**
 * DBの行をAPIのMilestone型に変換する
 * @param row - DBから取得した行
 * @returns Milestone型のオブジェクト
 */
const toMilestone = (row: typeof milestones.$inferSelect): Milestone => ({
  id: row.id,
  projectId: row.projectId,
  title: row.title,
  description: row.description,
  status: row.status as MilestoneStatus,
  dueDate: row.dueDate,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const milestoneStore = {
  /**
   * プロジェクトに紐づくマイルストーン一覧を取得する
   * @param projectId - プロジェクトID
   * @returns マイルストーンの配列
   */
  getByProjectId: async (projectId: string): Promise<Milestone[]> => {
    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId));
    return rows.map(toMilestone);
  },

  /**
   * IDでマイルストーンを取得する
   * @param id - マイルストーンID
   * @returns 見つかったマイルストーン、または null
   */
  getById: async (id: string): Promise<Milestone | null> => {
    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id));
    if (!rows.length) {
      return null;
    }
    return toMilestone(rows[0]);
  },

  /**
   * 新しいマイルストーンを作成する
   * @param projectId - プロジェクトID
   * @param input - マイルストーン作成用の入力
   * @returns 作成されたマイルストーン
   */
  create: async (
    projectId: string,
    input: CreateMilestoneInput
  ): Promise<Milestone> => {
    const rows = await db
      .insert(milestones)
      .values({
        projectId,
        title: input.title,
        description: input.description ?? "",
        dueDate: input.dueDate ?? null,
      })
      .returning();
    return toMilestone(rows[0]);
  },

  /**
   * マイルストーンを更新する
   * @param id - 更新対象のマイルストーンID
   * @param input - 更新内容
   * @returns 更新されたマイルストーン、または null
   */
  update: async (
    id: string,
    input: UpdateMilestoneInput
  ): Promise<Milestone | null> => {
    const filtered = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(filtered).length) {
      return milestoneStore.getById(id);
    }

    const rows = await db
      .update(milestones)
      .set({ ...filtered, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();

    if (!rows.length) {
      return null;
    }
    return toMilestone(rows[0]);
  },

  /**
   * マイルストーンを削除する
   * @param id - 削除対象のマイルストーンID
   * @returns 削除成功なら true、見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(milestones)
      .where(eq(milestones.id, id))
      .returning({ id: milestones.id });
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(milestones);
  },

  /** ステータスが有効かどうかを判定する */
  isValidStatus: (status: string): status is MilestoneStatus =>
    VALID_STATUSES.includes(status as MilestoneStatus),
};
