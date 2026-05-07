package cz.scrumdojo.quizmaster.quiz;

import java.time.LocalDateTime;

public record QuizMetadataResponse(
    Integer id,
    String title,
    String description,
    LocalDateTime startAt,
    LocalDateTime endAt,
    QuizMode mode,
    Difficulty difficulty,
    int passScore,
    Integer timeLimit,
    Integer randomQuestionCount,
    int questionCount
) {}
