export type ProjectStatus = "active" | "archived" | "completed";

export interface Project {
  /** プロジェクトID（UUID） */
  id: string;
  /** プロジェクト名 */
  name: string;
  /** プロジェクトの説明 */
  description: string;
  /** プロジェクトのステータス */
  status: ProjectStatus;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

export interface CreateProjectInput {
  /** プロジェクト名（必須） */
  name: string;
  /** プロジェクトの説明 */
  description?: string;
}

export interface UpdateProjectInput {
  /** プロジェクト名 */
  name?: string;
  /** プロジェクトの説明 */
  description?: string;
  /** プロジェクトのステータス */
  status?: ProjectStatus;
}
