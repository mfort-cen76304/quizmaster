package cz.scrumdojo.quizmaster.attempt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

@SpringBootTest
public class AttemptQuestionRepositoryTest {

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void persistsAndFindsByAttemptIdAndQuestionId() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        attemptQuestionRepository.save(
            AttemptQuestion.builder()
                .attemptId(attempt.getId())
                .questionId(question.getId())
                .position(0)
                .status(AnswerStatus.CORRECT)
                .answeredAt(LocalDateTime.now())
                .build()
        );

        var found = attemptQuestionRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    public void findByAttemptIdReturnsAllRowsForAttempt() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        attemptQuestionRepository.save(
            AttemptQuestion.builder()
                .attemptId(attempt.getId())
                .questionId(q1.getId())
                .position(0)
                .status(AnswerStatus.CORRECT)
                .answeredAt(LocalDateTime.now())
                .build()
        );
        attemptQuestionRepository.save(
            AttemptQuestion.builder()
                .attemptId(attempt.getId())
                .questionId(q2.getId())
                .position(1)
                .status(AnswerStatus.PARTIAL)
                .answeredAt(LocalDateTime.now())
                .build()
        );

        var rows = attemptQuestionRepository.findByAttemptIdOrderByPosition(attempt.getId());
        assertThat(rows).hasSize(2);
    }

    @Test
    public void uniqueConstraintRejectsDuplicateAttemptQuestionPair() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        attemptQuestionRepository.save(
            AttemptQuestion.builder()
                .attemptId(attempt.getId())
                .questionId(question.getId())
                .position(0)
                .status(AnswerStatus.CORRECT)
                .answeredAt(LocalDateTime.now())
                .build()
        );

        assertThatThrownBy(() ->
            attemptQuestionRepository.saveAndFlush(
                AttemptQuestion.builder()
                    .attemptId(attempt.getId())
                    .questionId(question.getId())
                    .position(0)
                    .status(AnswerStatus.INCORRECT)
                    .answeredAt(LocalDateTime.now())
                    .build()
            )
        ).isInstanceOf(DataIntegrityViolationException.class);
    }
}
