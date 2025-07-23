# GitHubへの手動アップロード手順

## 1. 主要ファイルをコピー

以下のファイル内容をコピーして、GitHubリポジトリに手動で作成してください。

### package.json
```json
{
  "name": "anger-management-system",
  "version": "1.0.0",
  "description": "アンガーマネジメント記録システム - CBT七柱技法と認知歪み分析",
  "main": "server/index.js",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push"
  },
  "keywords": ["anger-management", "cbt", "mental-health", "psychology"],
  "author": "hatake3310",
  "license": "MIT"
}
```

## 2. GitHubでの作成手順

1. **リポジトリに移動**: https://github.com/hatake3310/anger-management-system
2. **「Add file」→「Create new file」をクリック**
3. **ファイル名を入力** (例: `package.json`)
4. **内容をペースト**
5. **「Commit new file」をクリック**

## 3. 作成するファイル一覧

### 設定ファイル
- `package.json` - 依存関係とスクリプト
- `README.md` - プロジェクト説明書
- `.gitignore` - 除外ファイル設定
- `tsconfig.json` - TypeScript設定
- `vite.config.ts` - ビルド設定

### アプリケーションコード
- `shared/schema.ts` - データベーススキーマ
- `server/index.ts` - サーバーエントリーポイント
- `server/routes.ts` - API ルート
- `server/storage.ts` - データ保存層
- `client/src/App.tsx` - メインアプリ
- `client/src/main.tsx` - エントリーポイント
- その他のReactコンポーネント

この手順で進めますか？または、Replitの他の機能（Tools → Git または Settings）で連携できるか確認してみますか？