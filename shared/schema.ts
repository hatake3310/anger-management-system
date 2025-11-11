import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
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
  copingPlans: text("coping_plans").notNull(), // JSON string of coping plan objects
  followUpReview: text("follow_up_review"), // JSON string of follow-up review data
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

export const copingPlanSchema = z.object({
  id: z.string(),
  distortionType: z.string(),
  suggestion: z.string(),
  action: z.string().min(1, "行動プランを入力してください"),
  willTry: z.boolean(),
  supportNotes: z.string().optional(),
  distortionKey: z.string().optional(),
});

export const followUpItemSchema = z.object({
  planId: z.string(),
  planSummary: z.string(),
  attempted: z.boolean(),
  notes: z.string().optional(),
});

export const followUpReviewSchema = z.object({
  previousRecordId: z.number(),
  items: z.array(followUpItemSchema),
  reflection: z.string().optional(),
});

export const insertAngerRecordSchema = createInsertSchema(angerRecords, {
  emotions: z.array(emotionSchema),
  detectedDistortions: z.array(cognitiveDistortionSchema),
  copingPlans: z.array(copingPlanSchema).default([]),
  followUpReview: followUpReviewSchema.optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertAngerRecord = z.infer<typeof insertAngerRecordSchema>;
export type AngerRecord = typeof angerRecords.$inferSelect;
export type Emotion = z.infer<typeof emotionSchema>;
export type CognitiveDistortion = z.infer<typeof cognitiveDistortionSchema>;
export type CopingPlan = z.infer<typeof copingPlanSchema>;
export type FollowUpReview = z.infer<typeof followUpReviewSchema>;
export type FollowUpItem = z.infer<typeof followUpItemSchema>;
