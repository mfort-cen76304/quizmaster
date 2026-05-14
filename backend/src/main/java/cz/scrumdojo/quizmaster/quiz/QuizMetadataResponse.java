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
) {
    public static QuizMetadataResponse from(Quiz quiz) {
        return new QuizMetadataResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getStartAt(),
            quiz.getEndAt(),
            quiz.getMode(),
            quiz.getDifficulty(),
            quiz.getPassScore(),
            quiz.getTimeLimit(),
            quiz.getRandomQuestionCount(),
            quiz.drawnQuestionCount()
        );
    }
}
