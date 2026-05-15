package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.AttemptStart;
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;

public record QuizAttemptStartResponse(Integer attemptId, QuestionTakeResponse[] questions) {
    public static QuizAttemptStartResponse from(AttemptStart started) {
        return new QuizAttemptStartResponse(
            started.attempt().getId(),
            started.drawnQuestions().stream().map(QuestionTakeResponse::from).toArray(QuestionTakeResponse[]::new)
        );
    }
}
