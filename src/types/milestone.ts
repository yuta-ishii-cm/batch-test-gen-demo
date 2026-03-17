export type MilestoneStatus = "open" | "closed";

export interface Milestone {
  /** マイルストーンID（UUID） */
  id: string;
  /** 所属プロジェクトID */
  projectId: string;
  /** マイルストーンのタイトル */
  title: string;
  /** マイルストーンの説明 */
  description: string;
  /** マイルストーンのステータス */
  status: MilestoneStatus;
  /** 期日（YYYY-MM-DD形式、null = 未設定） */
  dueDate: string | null;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

export interface CreateMilestoneInput {
  /** マイルストーンのタイトル（必須） */
  title: string;
  /** マイルストーンの説明 */
  description?: string;
  /** 期日（YYYY-MM-DD形式） */
  dueDate?: string;
}

export interface UpdateMilestoneInput {
  /** マイルストーンのタイトル */
  title?: string;
  /** マイルストーンの説明 */
  description?: string;
  /** マイルストーンのステータス */
  status?: MilestoneStatus;
  /** 期日（YYYY-MM-DD形式） */
  dueDate?: string | null;
}
