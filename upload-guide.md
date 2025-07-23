# GitHubへのアップロード手順

リポジトリURL: https://github.com/hatake3310/anger-management-system

## 方法1: Replit統合機能 (推奨)

1. 左サイドバーで「Version control」アイコンをクリック
2. 「Connect to GitHub」をクリック
3. GitHubアカウントでログイン
4. 既存のリポジトリ「anger-management-system」を選択
5. 「Push to GitHub」をクリック

## 方法2: 手動ファイルアップロード

もしReplit統合が機能しない場合：

1. GitHubリポジトリページ: https://github.com/hatake3310/anger-management-system
2. 「Add file」→「Upload files」をクリック
3. 以下のファイルをドラッグ&ドロップ：
   - すべての `client/` フォルダ内容
   - すべての `server/` フォルダ内容
   - `shared/` フォルダ
   - `package.json`
   - `README.md`
   - `.gitignore`
   - その他設定ファイル

## アップロード対象ファイル一覧

### 必須ファイル
- `package.json` - 依存関係
- `README.md` - プロジェクト説明
- `.gitignore` - 除外ファイル設定
- `tsconfig.json` - TypeScript設定
- `vite.config.ts` - Vite設定
- `tailwind.config.ts` - Tailwind設定
- `postcss.config.js` - PostCSS設定
- `components.json` - shadcn/ui設定
- `drizzle.config.ts` - データベース設定

### アプリケーションコード
- `client/` - フロントエンドコード全体
- `server/` - バックエンドコード全体
- `shared/` - 共通スキーマ

コミットメッセージ例:
"Initial commit: Complete anger management system with CBT seven-column technique"