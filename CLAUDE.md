# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

タスク管理REST API。Claude Code の `/batch` コマンドでテストコード一括生成するデモ用リポジトリ。

## Commands

```bash
pnpm install          # 依存インストール
pnpm dev              # APIサーバー起動 (localhost:3000, tsx watch)
pnpm dev:front        # フロントエンド起動 (localhost:5173, Vite)
pnpm test             # テスト実行 (vitest run)
pnpm test:watch       # テスト監視モード
pnpm build            # TypeScriptビルド

# DB
docker compose up -d  # PostgreSQL起動
pnpm db:push          # スキーマをDBに反映
pnpm db:generate      # マイグレーションファイル生成
pnpm db:migrate       # マイグレーション実行
```

単一テスト実行: `pnpm test -- src/path/to/test.test.ts`

## Architecture

3層構造: **Routes → Handlers → Store**

- `src/app.ts` — Honoアプリ。ルートをマウント
- `src/routes/` — HTTPメソッドとパスの定義。各ハンドラーを接続
- `src/handlers/` — リクエストのバリデーションとレスポンス生成。リソースごとにディレクトリ分け（tasks/, users/, tags/, comments/, projects/, milestones/）
- `src/store/` — DB操作の抽象化層。Drizzle ORMでCRUD。各storeはDB行をAPI型に変換する `toXxx` 関数を持つ
- `src/db/schema.ts` — Drizzleスキーマ定義（全テーブル一箇所）
- `src/db/client.ts` — DB接続（postgres.js + Drizzle）
- `src/types/` — リソースごとのAPI型定義

### API Routes

| Prefix | Resource |
|--------|----------|
| `/api/tasks` | タスク（CRUD + 検索） |
| `/api/tasks/stats` | タスク統計 |
| `/api/tasks/:taskId/comments` | コメント |
| `/api/users` | ユーザー |
| `/api/tags` | タグ |
| `/api/projects` | プロジェクト |
| `/api/projects/:projectId/milestones` | マイルストーン |

### DB

PostgreSQL。接続先は `DATABASE_URL` 環境変数、デフォルトは `postgres://taskuser:taskpass@localhost:5432/taskdb`。

### テスト

Vitest。`globals: true` で `describe`/`it`/`expect` はimport不要。`passWithNoTests: true` 設定済み。
