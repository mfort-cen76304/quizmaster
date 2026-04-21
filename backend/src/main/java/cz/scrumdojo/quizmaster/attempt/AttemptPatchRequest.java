package cz.scrumdojo.quizmaster.attempt;

import java.time.LocalDateTime;

public record AttemptPatchRequest(
        Integer correctAnswers,
        Integer incorrectAnswers,
        Integer partiallyCorrectAnswers,
        LocalDateTime timedOutAt,
        LocalDateTime finishedAt
) {}
