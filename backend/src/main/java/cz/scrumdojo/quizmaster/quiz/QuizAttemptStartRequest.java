package cz.scrumdojo.quizmaster.quiz;

import java.time.LocalDateTime;

public record QuizAttemptStartRequest(
    LocalDateTime startedAt
) {}
