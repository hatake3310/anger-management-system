import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const angerRecords = pgTable("anger_records", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  situation: text("situation").notNull(),
  emotions: text("emotions").notNull(), // JSON string of emotion objects
  thoughts: text("thoughts").notNull(),
  evidence: text("evidence").notNull(),
  counterEvidence: text("counter_evidence").notNull(),
  balancedThinking: text("balanced_thinking").notNull(),
  moodBefore: integer("mood_before").notNull(), // 0-100 scale
  moodAfter: integer("mood_after").notNull(), // 0-100 scale
  detectedDistortions: text("detected_distortions").notNull(), // JSON string of distortion objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emotionSchema = z.object({
  type: z.string(),
  intensity: z.number().min(0).max(100),
});

export const cognitiveDistortionSchema = z.object({
  type: z.enum(["labeling", "mind_reading", "all_or_nothing", "personalization", "externalization"]),
  description: z.string(),
  suggestion: z.string(),
});

export const insertAngerRecordSchema = createInsertSchema(angerRecords, {
  emotions: z.array(emotionSchema),
  detectedDistortions: z.array(cognitiveDistortionSchema),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertAngerRecord = z.infer<typeof insertAngerRecordSchema>;
export type AngerRecord = typeof angerRecords.$inferSelect;
export type Emotion = z.infer<typeof emotionSchema>;
export type CognitiveDistortion = z.infer<typeof cognitiveDistortionSchema>;
