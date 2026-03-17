import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { projects } from "../db/schema";
import type {
  Project,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types/project";

const VALID_STATUSES: ProjectStatus[] = ["active", "archived", "completed"];

/**
 * DBの行をAPIのProject型に変換する
 * @param row - DBから取得した行
 * @returns Project型のオブジェクト
 */
const toProject = (row: typeof projects.$inferSelect): Project => ({
  id: row.id,
  name: row.name,
  description: row.description,
  status: row.status as ProjectStatus,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const projectStore = {
  /** 全プロジェクトを取得する */
  getAll: async (): Promise<Project[]> => {
    const rows = await db.select().from(projects);
    return rows.map(toProject);
  },

  /**
   * IDでプロジェクトを取得する
   * @param id - プロジェクトID
   * @returns 見つかったプロジェクト、または null
   */
  getById: async (id: string): Promise<Project | null> => {
    const rows = await db.select().from(projects).where(eq(projects.id, id));
    if (!rows.length) {
      return null;
    }
    return toProject(rows[0]);
  },

  /**
   * 新しいプロジェクトを作成する
   * @param input - プロジェクト作成用の入力
   * @returns 作成されたプロジェクト
   */
  create: async (input: CreateProjectInput): Promise<Project> => {
    const rows = await db
      .insert(projects)
      .values({
        name: input.name,
        description: input.description ?? "",
      })
      .returning();
    return toProject(rows[0]);
  },

  /**
   * プロジェクトを更新する
   * @param id - 更新対象のプロジェクトID
   * @param input - 更新内容
   * @returns 更新されたプロジェクト、または null
   */
  update: async (
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> => {
    const filtered = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    if (!Object.keys(filtered).length) {
      return projectStore.getById(id);
    }

    const rows = await db
      .update(projects)
      .set({ ...filtered, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    if (!rows.length) {
      return null;
    }
    return toProject(rows[0]);
  },

  /**
   * プロジェクトを削除する
   * @param id - 削除対象のプロジェクトID
   * @returns 削除成功なら true、見つからなければ false
   */
  delete: async (id: string): Promise<boolean> => {
    const rows = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    return rows.length > 0;
  },

  /** ストアをリセットする（テスト用） */
  reset: async (): Promise<void> => {
    await db.delete(projects);
  },

  /** ステータスが有効かどうかを判定する */
  isValidStatus: (status: string): status is ProjectStatus =>
    VALID_STATUSES.includes(status as ProjectStatus),
};
