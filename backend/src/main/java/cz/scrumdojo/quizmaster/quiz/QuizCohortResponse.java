package cz.scrumdojo.quizmaster.quiz;

public record QuizCohortResponse(String guid, String name) {
    public static QuizCohortResponse from(Cohort cohort) {
        return new QuizCohortResponse(cohort.getGuid(), cohort.getName());
    }
}
