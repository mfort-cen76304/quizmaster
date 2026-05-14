package cz.scrumdojo.quizmaster.attempt;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

public class AttemptTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 5, 14, 10, 0);

    @Test
    public void statusIsInProgressWhenNeitherFinishedNorTimedOut() {
        Attempt attempt = Attempt.builder().startedAt(START).build();

        assertThat(attempt.status()).isEqualTo(AttemptStatus.IN_PROGRESS);
        assertThat(attempt.isFinished()).isFalse();
        assertThat(attempt.isTimedOut()).isFalse();
    }

    @Test
    public void statusIsFinishedWhenEvaluatedWithoutTimeout() {
        Attempt attempt = Attempt.builder().startedAt(START).finishedAt(START.plusMinutes(2)).build();

        assertThat(attempt.status()).isEqualTo(AttemptStatus.FINISHED);
        assertThat(attempt.isFinished()).isTrue();
        assertThat(attempt.isTimedOut()).isFalse();
    }

    @Test
    public void statusIsTimeoutWhenEvaluatedAfterTimingOut() {
        Attempt attempt = Attempt.builder()
            .startedAt(START)
            .timedOutAt(START.plusMinutes(5))
            .finishedAt(START.plusMinutes(6))
            .build();

        assertThat(attempt.status()).isEqualTo(AttemptStatus.TIMEOUT);
    }

    @Test
    public void statusIsAbandonedWhenTimedOutButNotEvaluated() {
        Attempt attempt = Attempt.builder()
            .startedAt(START)
            .timedOutAt(START.plusMinutes(5))
            .build();

        assertThat(attempt.status()).isEqualTo(AttemptStatus.ABANDONED);
    }

    @Test
    public void durationSecondsIsNullWhileInProgress() {
        Attempt attempt = Attempt.builder().startedAt(START).build();

        assertThat(attempt.durationSeconds(null)).isNull();
        assertThat(attempt.durationSeconds(300)).isNull();
    }

    @Test
    public void durationSecondsCountsFromStartToFinishWhenNotTimedOut() {
        Attempt attempt = Attempt.builder()
            .startedAt(START)
            .finishedAt(START.plusSeconds(90))
            .build();

        assertThat(attempt.durationSeconds(300)).isEqualTo(90);
    }

    @Test
    public void durationSecondsCapsAtTimeLimitWhenTimedOut() {
        Attempt attempt = Attempt.builder()
            .startedAt(START)
            .timedOutAt(START.plusSeconds(500))
            .finishedAt(START.plusSeconds(520))
            .build();

        assertThat(attempt.durationSeconds(300)).isEqualTo(300);
    }

    @Test
    public void durationSecondsIsRawElapsedWhenTimedOutWithoutCap() {
        Attempt attempt = Attempt.builder()
            .startedAt(START)
            .timedOutAt(START.plusSeconds(500))
            .build();

        assertThat(attempt.durationSeconds(null)).isEqualTo(500);
    }

    @Test
    public void markFinishedStampsFinishedAt() {
        Attempt attempt = Attempt.builder().startedAt(START).build();

        attempt.markFinished(START.plusMinutes(2));

        assertThat(attempt.getFinishedAt()).isEqualTo(START.plusMinutes(2));
    }

    @Test
    public void markTimedOutStampsTimedOutAt() {
        Attempt attempt = Attempt.builder().startedAt(START).build();

        attempt.markTimedOut(START.plusMinutes(5));

        assertThat(attempt.getTimedOutAt()).isEqualTo(START.plusMinutes(5));
    }
}
