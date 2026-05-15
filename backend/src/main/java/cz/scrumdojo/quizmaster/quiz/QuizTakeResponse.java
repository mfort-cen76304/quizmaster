package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
import java.time.LocalDateTime;

public record QuizTakeResponse(
    Integer id,
    String title,
    String description,
    LocalDateTime startAt,
    LocalDateTime endAt,
    QuestionTakeResponse[] questions,
    QuizMode mode,
    Difficulty difficulty,
    int passScore,
    Integer timeLimit,
    Integer randomQuestionCount
) {}
