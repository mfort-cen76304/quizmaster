package cz.scrumdojo.quizmaster.attempt;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class ScoreOutcomeTest {

    @Test
    public void mapsOneToCorrect() {
        assertThat(ScoreOutcome.from(1.0)).isEqualTo(ScoreOutcome.CORRECT);
    }

    @Test
    public void mapsHalfToPartial() {
        assertThat(ScoreOutcome.from(0.5)).isEqualTo(ScoreOutcome.PARTIAL);
    }

    @Test
    public void mapsZeroToIncorrect() {
        assertThat(ScoreOutcome.from(0.0)).isEqualTo(ScoreOutcome.INCORRECT);
    }

    @Test
    public void mapsOtherValuesToIncorrect() {
        assertThat(ScoreOutcome.from(0.99)).isEqualTo(ScoreOutcome.INCORRECT);
        assertThat(ScoreOutcome.from(0.25)).isEqualTo(ScoreOutcome.INCORRECT);
    }
}
