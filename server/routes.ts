import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAngerRecordSchema } from "@shared/schema";
import { cognitiveDistortionService } from "./services/cognitive-distortion-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create anger record
  app.post("/api/anger-records", async (req, res) => {
    try {
      const validatedData = insertAngerRecordSchema.parse(req.body);
      
      // Detect cognitive distortions
      const detectedDistortions = cognitiveDistortionService.detectDistortions(
        validatedData.thoughts,
        validatedData.situation,
        validatedData.evidence
      );
      
      const recordWithDistortions = {
        ...validatedData,
        detectedDistortions
      };
      
      const record = await storage.createAngerRecord(recordWithDistortions);
      res.json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid record data", error });
    }
  });

  // Get anger records with pagination
  app.get("/api/anger-records", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const records = await storage.getAngerRecords(limit, offset);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch records", error });
    }
  });

  // Get single anger record
  app.get("/api/anger-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getAngerRecordById(id);
      
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch record", error });
    }
  });

  // Get records by date range
  app.get("/api/anger-records/range/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const records = await storage.getAngerRecordsByDateRange(startDate, endDate);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch records by date range", error });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getAngerRecordsStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error });
    }
  });

  // Analyze cognitive distortions
  app.post("/api/analyze-distortions", async (req, res) => {
    try {
      const { thoughts, situation, evidence } = req.body;
      const distortions = cognitiveDistortionService.detectDistortions(thoughts, situation, evidence);
      res.json(distortions);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze distortions", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
