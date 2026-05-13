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
    private TestFixtures fixtures;

    @Test
    public void recordExamScoreOverwritesPriorOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        service.recordExamScore(attempt.getId(), question.getId(), AnswerStatus.INCORRECT, LocalDateTime.now());
        service.recordExamScore(attempt.getId(), question.getId(), AnswerStatus.CORRECT, LocalDateTime.now());

        var rows = scoreRepository.findByAttemptId(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getStatus()).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    public void recordLearnScorePreservesFirstOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        service.recordLearnScore(attempt.getId(), question.getId(), AnswerStatus.INCORRECT, LocalDateTime.now());
        service.recordLearnScore(attempt.getId(), question.getId(), AnswerStatus.CORRECT, LocalDateTime.now());

        var rows = scoreRepository.findByAttemptId(attempt.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getStatus()).isEqualTo(AnswerStatus.INCORRECT);
    }
}
