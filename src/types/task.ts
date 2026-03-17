export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  /** タスクID（UUID） */
  id: string;
  /** タスクのタイトル */
  title: string;
  /** タスクの説明 */
  description: string;
  /** タスクのステータス */
  status: TaskStatus;
  /** 担当者ID（null = 未アサイン） */
  assigneeId: string | null;
  /** プロジェクトID（null = 未所属） */
  projectId: string | null;
  /** マイルストーンID（null = 未設定） */
  milestoneId: string | null;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

export interface CreateTaskInput {
  /** タスクのタイトル（必須） */
  title: string;
  /** タスクの説明 */
  description?: string;
  /** タスクのステータス（デフォルト: "todo"） */
  status?: TaskStatus;
  /** 担当者ID */
  assigneeId?: string;
  /** プロジェクトID */
  projectId?: string;
  /** マイルストーンID */
  milestoneId?: string;
}

export interface UpdateTaskInput {
  /** タスクのタイトル */
  title?: string;
  /** タスクの説明 */
  description?: string;
  /** タスクのステータス */
  status?: TaskStatus;
  /** 担当者ID */
  assigneeId?: string | null;
  /** プロジェクトID */
  projectId?: string | null;
  /** マイルストーンID */
  milestoneId?: string | null;
}
