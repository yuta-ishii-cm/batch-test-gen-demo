# batch-test-gen-demo

Claude Code の `/batch` コマンドでテストコードを一括生成するデモ用リポジトリです。

## 関連記事

<!-- TODO: DevelopersIO 記事公開後にリンクを追加 -->

## 技術スタック

- Hono + TypeScript
- Drizzle ORM + PostgreSQL
- Vitest
- React + Vite（フロントエンド）
- Node.js / pnpm

## セットアップ

```bash
pnpm install
```

### DB起動

```bash
docker compose up -d
pnpm db:push
```

### APIサーバー起動

```bash
pnpm dev
# http://localhost:3000
```

### フロントエンド起動

```bash
pnpm dev:front
# http://localhost:5173（APIへのリクエストは localhost:3000 にプロキシ）
```

## テスト

```bash
pnpm test
```

## 概要

シンプルなタスク管理APIを題材に、`/batch` で6つのハンドラーに対応するテストコードを並列生成します。

詳しくは関連記事をご覧ください。
