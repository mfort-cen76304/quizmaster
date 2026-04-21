package cz.scrumdojo.quizmaster.attempt;

import java.time.LocalDateTime;

public record AttemptRequest(
        Integer quizId,
        LocalDateTime startedAt
) {
    public Attempt toEntity() {
        return Attempt.builder()
                .quizId(quizId)
                .startedAt(startedAt)
                .correctAnswers(0)
                .incorrectAnswers(0)
                .partiallyCorrectAnswers(0)
                .build();
    }
}
