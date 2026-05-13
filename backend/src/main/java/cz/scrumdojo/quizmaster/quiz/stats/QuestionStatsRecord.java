package cz.scrumdojo.quizmaster.quiz.stats;
public record QuestionStatsRecord(
        String question,
        int shown,
        int answered,
        int skipped,
        int timeout,
        int abandoned,
        int correctAnswers,
        int partiallyCorrectAnswers,
        int incorrectAnswers
) {}
