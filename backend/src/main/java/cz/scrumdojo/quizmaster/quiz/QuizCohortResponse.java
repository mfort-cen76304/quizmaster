package cz.scrumdojo.quizmaster.quiz;

import java.util.UUID;

public record QuizCohortResponse(
    UUID guid,
    String name
) {
    public static QuizCohortResponse from(Cohort cohort) {
        return new QuizCohortResponse(cohort.getGuid(), cohort.getName());
    }
}