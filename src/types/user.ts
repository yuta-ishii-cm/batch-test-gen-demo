export interface User {
  /** ユーザーID（UUID） */
  id: string;
  /** ユーザー名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

export interface CreateUserInput {
  /** ユーザー名（必須） */
  name: string;
  /** メールアドレス（必須） */
  email: string;
}

export interface UpdateUserInput {
  /** ユーザー名 */
  name?: string;
  /** メールアドレス */
  email?: string;
}
