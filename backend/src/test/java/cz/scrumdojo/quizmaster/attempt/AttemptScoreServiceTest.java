package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class AttemptScoreServiceTest {

    @Autowired
    private AttemptScoreService service;

    @Autowired
    private AttemptQuestionScoreRepository scoreRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void recordExamScoreOverwritesPriorOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        service.recordExamScore(attempt.getId(), question.getId(), ScoreOutcome.INCORRECT, LocalDateTime.now());
        service.recordExamScore(attempt.getId(), question.getId(), ScoreOutcome.CORRECT, LocalDateTime.now());

        var rows = scoreRepository.findByAttemptId(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getScore()).isEqualTo(ScoreOutcome.CORRECT);
    }

    @Test
    public void recordLearnScorePreservesFirstOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        service.recordLearnScore(attempt.getId(), question.getId(), ScoreOutcome.INCORRECT, LocalDateTime.now());
        service.recordLearnScore(attempt.getId(), question.getId(), ScoreOutcome.CORRECT, LocalDateTime.now());

        var rows = scoreRepository.findByAttemptId(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getScore()).isEqualTo(ScoreOutcome.INCORRECT);
    }

    @Test
    public void recomputeAttemptCountersAggregatesByOutcome() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Question q3 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        service.recordExamScore(attempt.getId(), q1.getId(), ScoreOutcome.CORRECT, LocalDateTime.now());
        service.recordExamScore(attempt.getId(), q2.getId(), ScoreOutcome.PARTIAL, LocalDateTime.now());
        service.recordExamScore(attempt.getId(), q3.getId(), ScoreOutcome.INCORRECT, LocalDateTime.now());

        service.recomputeAttemptCounters(attempt.getId());

        var stored = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(stored.getCorrectAnswers()).isEqualTo(1);
        assertThat(stored.getPartiallyCorrectAnswers()).isEqualTo(1);
        assertThat(stored.getIncorrectAnswers()).isEqualTo(1);
    }
}
