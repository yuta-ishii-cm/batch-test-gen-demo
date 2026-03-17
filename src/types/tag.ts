export interface Tag {
  /** タグID（UUID） */
  id: string;
  /** タグ名 */
  name: string;
  /** 表示色（hex） */
  color: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
}

export interface CreateTagInput {
  /** タグ名（必須） */
  name: string;
  /** 表示色（デフォルト: "#6b7280"） */
  color?: string;
}
