package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum ScoreOutcome {
    @JsonProperty("correct") CORRECT,
    @JsonProperty("partial") PARTIAL,
    @JsonProperty("incorrect") INCORRECT;

    public static ScoreOutcome from(double score) {
        if (score == 1.0) return CORRECT;
        if (score == 0.5) return PARTIAL;
        return INCORRECT;
    }
}
