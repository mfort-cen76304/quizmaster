package cz.scrumdojo.quizmaster.attempt;

public record AttemptPatchRequest(
        Integer correctAnswers,
        Integer incorrectAnswers
) {}
