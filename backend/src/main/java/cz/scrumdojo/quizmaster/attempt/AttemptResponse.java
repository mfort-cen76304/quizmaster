package cz.scrumdojo.quizmaster.attempt;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AttemptResponse(
        Integer id,
        Integer quizId,
        Integer durationSeconds,
        BigDecimal points,
        BigDecimal score,
        AttemptStatus status,
        Integer maxScore,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Integer correctAnswers,
        Integer incorrectAnswers
) {
    public static AttemptResponse from(Attempt attempt) {
        return new AttemptResponse(
                attempt.getId(),
                attempt.getQuizId(),
                attempt.getDurationSeconds(),
                attempt.getPoints(),
                attempt.getScore(),
                attempt.getStatus(),
                attempt.getMaxScore(),
                attempt.getStartedAt(),
                attempt.getFinishedAt(),
                attempt.getCorrectAnswers(),
                attempt.getIncorrectAnswers()
        );
    }
}

