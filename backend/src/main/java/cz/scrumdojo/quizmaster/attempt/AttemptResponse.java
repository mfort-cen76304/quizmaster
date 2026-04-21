package cz.scrumdojo.quizmaster.attempt;

import java.time.LocalDateTime;

public record AttemptResponse(
        Integer id,
        Integer quizId,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Integer correctAnswers,
        Integer incorrectAnswers,
        Integer partiallyCorrectAnswers,
        LocalDateTime timedOutAt
) {
    public static AttemptResponse from(Attempt attempt) {
        return new AttemptResponse(
                attempt.getId(),
                attempt.getQuizId(),
                attempt.getStartedAt(),
                attempt.getFinishedAt(),
                attempt.getCorrectAnswers(),
                attempt.getIncorrectAnswers(),
                attempt.getPartiallyCorrectAnswers(),
                attempt.getTimedOutAt()
        );
    }
}
