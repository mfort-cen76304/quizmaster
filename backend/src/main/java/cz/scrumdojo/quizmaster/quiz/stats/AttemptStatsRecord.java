package cz.scrumdojo.quizmaster.quiz.stats;

import cz.scrumdojo.quizmaster.attempt.AttemptStatus;

public record AttemptStatsRecord(
        Integer id,
        Integer durationSeconds,
        int correctAnswers,
        int incorrectAnswers,
        int partiallyCorrectAnswers,
        int totalQuestions,
        int score,
        AttemptStatus status
) {}
