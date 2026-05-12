package cz.scrumdojo.quizmaster.workspace;

public record QuestionStats(
    int timesAsked,
    int successRate, // 0-100 (%)
    int averageTime, // seconds
    int skipped
) {}
