export interface Comment {
  /** コメントID（UUID） */
  id: string;
  /** 対象タスクID */
  taskId: string;
  /** 投稿者ID（null = 匿名） */
  authorId: string | null;
  /** コメント本文 */
  content: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

export interface CreateCommentInput {
  /** 投稿者ID */
  authorId?: string;
  /** コメント本文（必須） */
  content: string;
}
