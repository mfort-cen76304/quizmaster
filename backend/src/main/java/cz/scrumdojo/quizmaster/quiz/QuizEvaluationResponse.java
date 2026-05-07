package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.AttemptResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;

public record QuizEvaluationResponse(
    AttemptResponse attempt,
    double score,
    int totalQuestions,
    QuestionResponse[] questions
) {}
