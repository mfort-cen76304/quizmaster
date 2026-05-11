package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionResponse;

import java.time.LocalDateTime;

public record QuizResponse(
    Integer id,
    String title,
    String description,
    LocalDateTime startAt,
    LocalDateTime endAt,
    QuestionResponse[] questions,
    QuizMode mode,
    Difficulty difficulty,
    int passScore,
    Integer timeLimit,
    Integer randomQuestionCount,
    String[] cohortNames
) {}
