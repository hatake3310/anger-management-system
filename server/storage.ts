import { angerRecords, type AngerRecord, type InsertAngerRecord } from "@shared/schema";

// User types for future expansion
export interface User {
  id: number;
  username: string;
  email?: string;
  createdAt: Date;
}

export interface InsertUser {
  username: string;
  email?: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Anger management methods
  createAngerRecord(record: InsertAngerRecord): Promise<AngerRecord>;
  getAngerRecords(limit?: number, offset?: number): Promise<AngerRecord[]>;
  getAngerRecordById(id: number): Promise<AngerRecord | undefined>;
  getAngerRecordsByDateRange(startDate: string, endDate: string): Promise<AngerRecord[]>;
  getAngerRecordsStats(): Promise<{
    totalRecords: number;
    avgMoodImprovement: number;
    weeklyRecords: number;
    commonDistortions: { type: string; count: number }[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private angerRecords: Map<number, AngerRecord>;
  currentUserId: number;
  currentRecordId: number;

  constructor() {
    this.users = new Map();
    this.angerRecords = new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async createAngerRecord(insertRecord: InsertAngerRecord): Promise<AngerRecord> {
    const id = this.currentRecordId++;
    const record: AngerRecord = {
      ...insertRecord,
      id,
      emotions: JSON.stringify(insertRecord.emotions),
      detectedDistortions: JSON.stringify(insertRecord.detectedDistortions),
      createdAt: new Date(),
    };
    this.angerRecords.set(id, record);
    return record;
  }

  async getAngerRecords(limit = 50, offset = 0): Promise<AngerRecord[]> {
    const records = Array.from(this.angerRecords.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    return records;
  }

  async getAngerRecordById(id: number): Promise<AngerRecord | undefined> {
    return this.angerRecords.get(id);
  }

  async getAngerRecordsByDateRange(startDate: string, endDate: string): Promise<AngerRecord[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.angerRecords.values()).filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
  }

  async getAngerRecordsStats(): Promise<{
    totalRecords: number;
    avgMoodImprovement: number;
    weeklyRecords: number;
    commonDistortions: { type: string; count: number }[];
  }> {
    const records = Array.from(this.angerRecords.values());
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyRecords = records.filter(record => 
      new Date(record.createdAt) >= weekAgo
    ).length;

    const avgMoodImprovement = records.length > 0 
      ? records.reduce((sum, record) => sum + (record.moodBefore - record.moodAfter), 0) / records.length
      : 0;

    const distortionCounts: { [key: string]: number } = {};
    records.forEach(record => {
      try {
        const distortions = JSON.parse(record.detectedDistortions);
        distortions.forEach((distortion: any) => {
          distortionCounts[distortion.type] = (distortionCounts[distortion.type] || 0) + 1;
        });
      } catch (e) {
        // Handle JSON parse errors
      }
    });

    const commonDistortions = Object.entries(distortionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRecords: records.length,
      avgMoodImprovement,
      weeklyRecords,
      commonDistortions,
    };
  }
}

export const storage = new MemStorage();
