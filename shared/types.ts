export type Stats = {
  totalRecords: number;
  avgMoodImprovement: number;
  weeklyRecords: number;
  commonDistortions: { type: string; count: number }[];
};
