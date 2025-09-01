// 必要なモジュールと型をインポートします。
import type { Express } from "express"; // Expressの型定義
import { createServer, type Server } from "http"; // Node.jsのhttpモジュール
import { storage } from "./storage"; // データベース操作を行うためのstorageモジュール
import { insertAngerRecordSchema } from "@shared/schema"; // フロントエンドと共有しているデータ検証スキーマ
import { cognitiveDistortionService } from "./services/cognitive-distortion-service"; // 認知の歪みを検出するサービス

/**
 * ExpressアプリケーションにAPIルートを登録し、HTTPサーバーをセットアップします。
 * @param app - Expressアプリケーションのインスタンス
 * @returns - Node.jsのHTTPサーバーインスタンス
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // --- ルート定義 ---

  // [POST] 怒りの記録を作成するAPI
  app.post("/api/anger-records", async (req, res) => {
    try {
      // Zodスキーマを使ってリクエストボディのデータを検証します。
      const validatedData = insertAngerRecordSchema.parse(req.body);
      
      // 認知の歪み検出サービスを呼び出して、入力されたテキストから歪みを検出します。
      const detectedDistortions = cognitiveDistortionService.detectDistortions(
        validatedData.thoughts,
        validatedData.situation,
        validatedData.evidence
      );
      
      // 検証済みデータと検出された歪みを結合します。
      const recordWithDistortions = {
        ...validatedData,
        detectedDistortions
      };
      
      // データベースに新しい記録を保存します。
      const record = await storage.createAngerRecord(recordWithDistortions);
      // 作成された記録をJSON形式でクライアントに返します。
      res.json(record);
    } catch (error) {
      // データが無効な場合やエラーが発生した場合は、400エラーを返します。
      res.status(400).json({ message: "Invalid record data", error });
    }
  });

  // [GET] 怒りの記録一覧をページネーション付きで取得するAPI
  app.get("/api/anger-records", async (req, res) => {
    try {
      // クエリパラメータから取得件数(limit)と開始位置(offset)を取得します。
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // データベースから指定された範囲の記録を取得します。
      const records = await storage.getAngerRecords(limit, offset);
      // 取得した記録をJSON形式で返します。
      res.json(records);
    } catch (error) {
      // エラーが発生した場合は、500エラーを返します。
      res.status(500).json({ message: "Failed to fetch records", error });
    }
  });

  // [GET] IDを指定して単一の怒りの記録を取得するAPI
  app.get("/api/anger-records/:id", async (req, res) => {
    try {
      // URLパラメータからIDを取得します。
      const id = parseInt(req.params.id);
      // データベースからIDに一致する記録を取得します。
      const record = await storage.getAngerRecordById(id);
      
      // 記録が見つからない場合は、404エラーを返します。
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      // 記録をJSON形式で返します。
      res.json(record);
    } catch (error) {
      // エラーが発生した場合は、500エラーを返します。
      res.status(500).json({ message: "Failed to fetch record", error });
    }
  });

  // [GET] 日付の範囲を指定して記録を取得するAPI
  app.get("/api/anger-records/range/:startDate/:endDate", async (req, res) => {
    try {
      // URLパラメータから開始日と終了日を取得します。
      const { startDate, endDate } = req.params;
      // データベースから指定された日付範囲の記録を取得します。
      const records = await storage.getAngerRecordsByDateRange(startDate, endDate);
      // 記録をJSON形式で返します。
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch records by date range", error });
    }
  });

  // [GET] 統計データを取得するAPI
  app.get("/api/stats", async (req, res) => {
    try {
      // データベースから統計情報を取得します。
      const stats = await storage.getAngerRecordsStats();
      // 統計情報をJSON形式で返します。
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error });
    }
  });

  // [POST] テキストから認知の歪みを分析するAPI
  app.post("/api/analyze-distortions", async (req, res) => {
    try {
      // リクエストボディから分析対象のテキストを取得します。
      const { thoughts, situation, evidence } = req.body;
      // 認知の歪み検出サービスを呼び出します。
      const distortions = cognitiveDistortionService.detectDistortions(thoughts, situation, evidence);
      // 検出結果をJSON形式で返します。
      res.json(distortions);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze distortions", error });
    }
  });

  // ExpressアプリケーションをラップするHTTPサーバーを作成します。
  // WebSocketなどのためにHTTPサーバーのインスタンスが直接必要な場合があるため、このようにしています。
  const httpServer = createServer(app);
  return httpServer;
}
