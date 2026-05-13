package cz.scrumdojo.quizmaster.attempt;

public enum AnswerStatus {
    UNANSWERED,
    CORRECT,
    PARTIAL,
    INCORRECT;

    public double points() {
        return switch (this) {
            case CORRECT -> 1.0;
            case PARTIAL -> 0.5;
            case INCORRECT, UNANSWERED -> 0.0;
        };
    }
}
