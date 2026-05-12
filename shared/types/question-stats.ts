export interface QuestionStats {
  timesAsked: number;
  successRate: number; // 0-100 (%)
  averageTime: number; // seconds
  skipped: number;
}
