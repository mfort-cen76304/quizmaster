package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;

public record QuizAttemptStartResponse(
    Integer attemptId,
    QuestionTakeResponse[] questions
) {}
