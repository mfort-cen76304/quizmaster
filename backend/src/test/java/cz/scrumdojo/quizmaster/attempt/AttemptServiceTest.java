package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class AttemptServiceTest {

    @Autowired
    private AttemptService service;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void examSubmissionOverwritesPriorOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        service.recordSubmission(QuizMode.EXAM, attempt.getId(), question.getId(), AnswerStatus.INCORRECT, LocalDateTime.now());
        service.recordSubmission(QuizMode.EXAM, attempt.getId(), question.getId(), AnswerStatus.CORRECT, LocalDateTime.now());

        var rows = attemptQuestionRepository.findByAttemptIdOrderByPosition(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getStatus()).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    public void learnSubmissionPreservesFirstOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        service.recordSubmission(QuizMode.LEARN, attempt.getId(), question.getId(), AnswerStatus.INCORRECT, LocalDateTime.now());
        service.recordSubmission(QuizMode.LEARN, attempt.getId(), question.getId(), AnswerStatus.CORRECT, LocalDateTime.now());

        var rows = attemptQuestionRepository.findByAttemptIdOrderByPosition(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getStatus()).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    public void timeoutStampsTimedOutAtAndPersists() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);

        service.timeout(attempt, now);

        Attempt reloaded = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(reloaded.getTimedOutAt()).isEqualTo(now);
        assertThat(reloaded.getFinishedAt()).isNull();
    }

    @Test
    public void evaluateMarksAttemptFinishedAndReturnsScore() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        fixtures.score(attempt, q2, AnswerStatus.PARTIAL);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);

        AttemptEvaluation evaluation = service.evaluate(attempt, now);

        assertThat(evaluation.totalPoints()).isEqualTo(1.5);
        assertThat(evaluation.totalQuestions()).isEqualTo(2);
        assertThat(evaluation.questionIds()).containsExactly(q1.getId(), q2.getId());
        Attempt reloaded = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(reloaded.getFinishedAt()).isEqualTo(now);
    }

    @Test
    public void evaluateAttemptWithoutDrawnQuestionsReturnsZero() {
        Quiz quiz = fixtures.save(fixtures.quiz());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        AttemptEvaluation evaluation = service.evaluate(attempt, LocalDateTime.now());

        assertThat(evaluation.totalPoints()).isEqualTo(0.0);
        assertThat(evaluation.totalQuestions()).isEqualTo(0);
        assertThat(evaluation.questionIds()).isEmpty();
    }
}
