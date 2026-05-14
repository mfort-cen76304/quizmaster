package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    @Test
    public void submitAnswerScoresChoiceQuestionAndPersistsOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).mode(QuizMode.EXAM));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);
        QuestionAnswerRequest correctAnswer = new QuestionAnswerRequest(null, "choice", new int[]{1}, null);

        AnswerStatus status = service.submitAnswer(quiz, attempt, question, correctAnswer, now);

        assertThat(status).isEqualTo(AnswerStatus.CORRECT);
        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(AnswerStatus.CORRECT);
        assertThat(row.getAnsweredAt()).isEqualTo(now);
    }

    @Test
    public void submitAnswerInLearnModeKeepsFirstOutcomeOnRetake() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).mode(QuizMode.LEARN));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        QuestionAnswerRequest wrongAnswer = new QuestionAnswerRequest(null, "choice", new int[]{0}, null);
        QuestionAnswerRequest correctAnswer = new QuestionAnswerRequest(null, "choice", new int[]{1}, null);

        service.submitAnswer(quiz, attempt, question, wrongAnswer, LocalDateTime.now());
        service.submitAnswer(quiz, attempt, question, correctAnswer, LocalDateTime.now());

        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    public void submitAnswerForUndrawnQuestionThrowsBadRequest() {
        Question drawn = fixtures.save(fixtures.question());
        Question undrawn = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(drawn));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), drawn);
        QuestionAnswerRequest answer = new QuestionAnswerRequest(null, "choice", new int[]{1}, null);

        assertThatThrownBy(() -> service.submitAnswer(quiz, attempt, undrawn, answer, LocalDateTime.now()))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
