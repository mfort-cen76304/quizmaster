package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;

public record QuizEvaluationRequest(
    int[] questionIds,
    QuestionAnswerRequest[] answers
) {}
