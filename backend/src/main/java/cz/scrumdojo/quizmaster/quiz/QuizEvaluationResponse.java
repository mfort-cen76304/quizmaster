package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionResponse;

public record QuizEvaluationResponse(
    double score,
    int totalQuestions,
    QuestionResponse[] questions
) {}
