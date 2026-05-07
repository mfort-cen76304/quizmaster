package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
public class AttemptQuestionScoreRepositoryTest {

    @Autowired
    private AttemptQuestionScoreRepository scoreRepository;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void persistsAndFindsByAttemptIdAndQuestionId() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        scoreRepository.save(AttemptQuestionScore.builder()
            .attemptId(attempt.getId())
            .questionId(question.getId())
            .score(ScoreOutcome.CORRECT)
            .answeredAt(LocalDateTime.now())
            .build());

        var found = scoreRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getScore()).isEqualTo(ScoreOutcome.CORRECT);
    }

    @Test
    public void findByAttemptIdReturnsAllRowsForAttempt() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        scoreRepository.save(AttemptQuestionScore.builder()
            .attemptId(attempt.getId()).questionId(q1.getId())
            .score(ScoreOutcome.CORRECT).answeredAt(LocalDateTime.now()).build());
        scoreRepository.save(AttemptQuestionScore.builder()
            .attemptId(attempt.getId()).questionId(q2.getId())
            .score(ScoreOutcome.PARTIAL).answeredAt(LocalDateTime.now()).build());

        var rows = scoreRepository.findByAttemptId(attempt.getId());
        assertThat(rows).hasSize(2);
    }

    @Test
    public void uniqueConstraintRejectsDuplicateAttemptQuestionPair() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        scoreRepository.save(AttemptQuestionScore.builder()
            .attemptId(attempt.getId()).questionId(question.getId())
            .score(ScoreOutcome.CORRECT).answeredAt(LocalDateTime.now()).build());

        assertThatThrownBy(() -> scoreRepository.saveAndFlush(AttemptQuestionScore.builder()
                .attemptId(attempt.getId()).questionId(question.getId())
                .score(ScoreOutcome.INCORRECT).answeredAt(LocalDateTime.now()).build()))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
