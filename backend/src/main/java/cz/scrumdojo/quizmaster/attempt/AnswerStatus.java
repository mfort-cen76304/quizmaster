package cz.scrumdojo.quizmaster.attempt;

public enum AnswerStatus {
    UNANSWERED,
    CORRECT,
    PARTIAL,
    INCORRECT;

    public static AnswerStatus from(double score) {
        if (score == 1.0) return CORRECT;
        if (score == 0.5) return PARTIAL;
        return INCORRECT;
    }
}
