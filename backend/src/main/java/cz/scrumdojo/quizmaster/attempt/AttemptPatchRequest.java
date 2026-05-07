package cz.scrumdojo.quizmaster.attempt;

import java.time.LocalDateTime;

public record AttemptPatchRequest(
        LocalDateTime timedOutAt,
        LocalDateTime finishedAt
) {}
