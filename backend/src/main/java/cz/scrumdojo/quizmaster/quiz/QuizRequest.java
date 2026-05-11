package cz.scrumdojo.quizmaster.quiz;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public record QuizRequest(
    @NotBlank String title,
    String description,
    LocalDateTime startAt,
    LocalDateTime endAt,
    int[] questionIds,
    QuizMode mode,
    Difficulty difficulty,
    int passScore,
    Integer timeLimit,
    Integer randomQuestionCount,
    List<String> cohortNames
) {
    public Quiz toEntity(String workspaceGuid) {
        List<Cohort> cohortEntities = new ArrayList<>();
        if (cohortNames != null) {
            for (String name : cohortNames) {
                cohortEntities.add(Cohort.builder().name(name).build());
            }
        }
        return Quiz.builder()
            .title(title)
            .description(description)
            .startAt(startAt)
            .endAt(endAt)
            .questionIds(questionIds)
            .mode(mode != null ? mode : QuizMode.EXAM)
            .difficulty(difficulty != null ? difficulty : Difficulty.KEEP_QUESTION)
            .passScore(passScore)
            .timeLimit(timeLimit)
            .workspaceGuid(workspaceGuid)
            .randomQuestionCount(randomQuestionCount)
            .cohorts(cohortEntities)
            .build();
    }
}
