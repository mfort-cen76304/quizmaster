package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;

import java.time.LocalDateTime;

public record QuizEvaluationRequest(
    int[] questionIds,
    QuestionAnswerRequest[] answers,
    LocalDateTime finishedAt,
    LocalDateTime timedOutAt
) {}
