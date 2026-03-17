# batch-test-gen-demo

Claude Code の `/batch` コマンドでテストコードを一括生成するデモ用リポジトリです。

## 関連記事

<!-- TODO: DevelopersIO 記事公開後にリンクを追加 -->

## 技術スタック

- Hono + TypeScript
- Vitest
- Node.js / pnpm

## セットアップ

```bash
pnpm install
pnpm dev
```

## テスト

```bash
pnpm test
```

## 概要

シンプルなタスク管理APIを題材に、`/batch` で6つのハンドラーに対応するテストコードを並列生成します。

詳しくは関連記事をご覧ください。
