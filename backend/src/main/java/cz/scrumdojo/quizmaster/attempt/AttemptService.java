package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuestionScoringService questionScoringService;

    public AttemptService(AttemptRepository attemptRepository,
                          AttemptQuestionRepository attemptQuestionRepository,
                          QuestionScoringService questionScoringService) {
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.questionScoringService = questionScoringService;
    }

    @Transactional
    public Attempt startAttempt(Attempt attempt, int[] drawnQuestionIds) {
        Attempt persisted = attemptRepository.save(attempt);
        for (int position = 0; position < drawnQuestionIds.length; position++) {
            attemptQuestionRepository.save(AttemptQuestion.builder()
                .attemptId(persisted.getId())
                .questionId(drawnQuestionIds[position])
                .status(AnswerStatus.UNANSWERED)
                .position(position)
                .build());
        }
        return persisted;
    }

    @Transactional
    public AnswerStatus submitAnswer(Quiz quiz, Attempt attempt, Question question, QuestionAnswerRequest request, LocalDateTime now) {
        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
        AnswerStatus status = questionScoringService.score(question, request);
        row.score(quiz.getMode(), status, now);
        return status;
    }

    @Transactional
    public void recordSubmission(QuizMode mode, Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attemptId, questionId).orElseThrow();
        row.score(mode, status, answeredAt);
    }

    @Transactional
    public AttemptEvaluation evaluate(Attempt attempt, LocalDateTime now) {
        var rows = attemptQuestionRepository.findByAttemptIdOrderByPosition(attempt.getId());
        int[] questionIds = rows.stream().mapToInt(AttemptQuestion::getQuestionId).toArray();
        attempt.markFinished(now);
        attemptRepository.save(attempt);
        return new AttemptEvaluation(Attempt.totalPoints(rows), rows.size(), questionIds);
    }

    @Transactional
    public void timeout(Attempt attempt, LocalDateTime now) {
        attempt.markTimedOut(now);
        attemptRepository.save(attempt);
    }
}
