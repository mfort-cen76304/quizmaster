package cz.scrumdojo.quizmaster.attempt;

import static org.assertj.core.api.Assertions.assertThat;

import cz.scrumdojo.quizmaster.quiz.QuizMode;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

public class AttemptQuestionTest {

    private static final LocalDateTime WHEN = LocalDateTime.of(2026, 5, 14, 10, 0);
    private static final LocalDateTime LATER = WHEN.plusMinutes(1);

    @Test
    public void drawnRowStartsUnansweredAtGivenPosition() {
        AttemptQuestion row = AttemptQuestion.drawn(1, 2, 3);

        assertThat(row.getAttemptId()).isEqualTo(1);
        assertThat(row.getQuestionId()).isEqualTo(2);
        assertThat(row.getPosition()).isEqualTo(3);
        assertThat(row.getStatus()).isEqualTo(AnswerStatus.UNANSWERED);
        assertThat(row.getAnsweredAt()).isNull();
    }

    @Test
    public void recordOutcomeInExamModeOverwritesPriorOutcome() {
        AttemptQuestion row = AttemptQuestion.drawn(1, 2, 0);
        row.recordOutcome(QuizMode.EXAM, AnswerStatus.INCORRECT, WHEN);
        row.recordOutcome(QuizMode.EXAM, AnswerStatus.CORRECT, LATER);

        assertThat(row.getStatus()).isEqualTo(AnswerStatus.CORRECT);
        assertThat(row.getAnsweredAt()).isEqualTo(LATER);
    }

    @Test
    public void recordOutcomeInLearnModePreservesFirstOutcome() {
        AttemptQuestion row = AttemptQuestion.drawn(1, 2, 0);
        row.recordOutcome(QuizMode.LEARN, AnswerStatus.INCORRECT, WHEN);
        row.recordOutcome(QuizMode.LEARN, AnswerStatus.CORRECT, LATER);

        assertThat(row.getStatus()).isEqualTo(AnswerStatus.INCORRECT);
        assertThat(row.getAnsweredAt()).isEqualTo(WHEN);
    }

    @Test
    public void totalPointsSumsAnswerStatusPoints() {
        AttemptQuestion correct = answered(AnswerStatus.CORRECT);
        AttemptQuestion partial = answered(AnswerStatus.PARTIAL);
        AttemptQuestion incorrect = answered(AnswerStatus.INCORRECT);
        AttemptQuestion unanswered = AttemptQuestion.drawn(1, 4, 3);

        double total = AttemptQuestion.totalPoints(List.of(correct, partial, incorrect, unanswered));

        assertThat(total).isEqualTo(1.5);
    }

    @Test
    public void percentageScoreIsZeroForEmptyList() {
        assertThat(AttemptQuestion.percentageScore(List.of())).isEqualTo(0);
    }

    @Test
    public void percentageScoreScalesAnswerPointsToPercentOfTotal() {
        AttemptQuestion correct = answered(AnswerStatus.CORRECT);
        AttemptQuestion partial = answered(AnswerStatus.PARTIAL);
        AttemptQuestion incorrect = answered(AnswerStatus.INCORRECT);

        assertThat(AttemptQuestion.percentageScore(List.of(correct, partial, incorrect))).isEqualTo(50);
    }

    @Test
    public void percentageScoreRoundsToNearestInteger() {
        AttemptQuestion correct = answered(AnswerStatus.CORRECT);
        AttemptQuestion incorrect1 = answered(AnswerStatus.INCORRECT);
        AttemptQuestion incorrect2 = answered(AnswerStatus.INCORRECT);

        assertThat(AttemptQuestion.percentageScore(List.of(correct, incorrect1, incorrect2))).isEqualTo(33);
    }

    private AttemptQuestion answered(AnswerStatus status) {
        AttemptQuestion row = AttemptQuestion.drawn(1, 2, 0);
        row.recordOutcome(QuizMode.EXAM, status, WHEN);
        return row;
    }
}
