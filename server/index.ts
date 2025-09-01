// 必要なモジュールをインポートします。
import express, { type Request, Response, NextFunction } from "express"; // express: Node.jsのWebアプリケーションフレームワーク
import { registerRoutes } from "./routes"; // registerRoutes: APIのルートを登録する関数
import { setupVite, serveStatic, log } from "./vite"; // Vite関連のヘルパー関数

// Expressアプリケーションのインスタンスを作成します。
const app = express();

// express.json()ミドルウェアを使用して、リクエストボディのJSONをパース（解析）できるようにします。
app.use(express.json());
// express.urlencoded()ミドルウェアを使用して、URLエンコードされたリクエストボディをパースできるようにします。
app.use(express.urlencoded({ extended: false }));

// カスタムのロギングミドルウェアを定義します。
// このミドルウェアは、APIへのリクエスト情報をコンソールに出力します。
app.use((req, res, next) => {
  const start = Date.now(); // リクエスト処理の開始時刻を記録
  const path = req.path; // リクエストされたパス（例: /api/records）
  let capturedJsonResponse: Record<string, any> | undefined = undefined; //レスポンスのJSONを一時的に保存する変数

  // 元のres.json関数を保存しておきます。
  const originalResJson = res.json;
  // res.json関数を上書きして、レスポンス内容をキャプチャ（捕捉）します。
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson; // レスポンスのJSONを保存
    // 元のjson関数を呼び出して、レスポンスをクライアントに返します。
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // レスポンスが完了した時（'finish'イベント）に実行される処理を登録します。
  res.on("finish", () => {
    const duration = Date.now() - start; // リクエスト処理にかかった時間を計算
    // パスが '/api' で始まる場合のみログを出力します。
    if (path.startsWith("/api")) {
      // ログメッセージの基本部分を作成します。 (例: "POST /api/records 201 in 50ms")
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // レスポンスのJSONが存在すれば、ログに追加します。
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // ログが長すぎる場合は、省略して表示します。
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine); // 整形したログを出力します。
    }
  });

  // 次のミドルウェアまたはルートハンドラに処理を渡します。
  next();
});

// 非同期の即時実行関数を使って、サーバーのセットアップを開始します。
(async () => {
  // `registerRoutes`を呼び出して、APIのルートをアプリケーションに登録し、HTTPサーバーインスタンスを受け取ります。
  const server = await registerRoutes(app);

  // エラーハンドリングミドルウェアを定義します。
  // ルートハンドラでエラーが発生した場合、このミドルウェアが実行されます。
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // エラーオブジェクトからステータスコードとメッセージを取得します。
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // エラーレスポンスをJSON形式でクライアントに返します。
    res.status(status).json({ message });
    // エラーをスローして、さらなる処理を停止させます。
    throw err;
  });

  // 開発環境（development）の場合のみVite開発サーバーをセットアップします。
  // 本番環境との切り分けが重要です。すべてのAPIルートを登録した後にViteをセットアップしないと、
  // ViteのキャッチオールルートがAPIルートの邪魔をしてしまいます。
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // 本番環境（production）の場合は、ビルドされた静的ファイル（HTML, CSS, JS）を配信します。
    serveStatic(app);
  }

  // 環境変数 `PORT` で指定されたポートでサーバーを起動します。
  // このポートはファイアウォールで唯一開かれているポートです。
  // `PORT` が指定されていない場合は、デフォルトで5000番ポートを使用します。
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0", // すべてのネットワークインターフェースでリッスンします。
    reusePort: true, // ポートの再利用を許可します。
  }, () => {
    // サーバーが正常に起動したことをログに出力します。
    log(`serving on port ${port}`);
  });
})();
