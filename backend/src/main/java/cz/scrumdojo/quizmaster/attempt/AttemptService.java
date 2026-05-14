package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuestionScoringService questionScoringService;
    private final QuizService quizService;

    public AttemptService(AttemptRepository attemptRepository,
                          AttemptQuestionRepository attemptQuestionRepository,
                          QuestionScoringService questionScoringService,
                          QuizService quizService) {
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.questionScoringService = questionScoringService;
        this.quizService = quizService;
    }

    @Transactional
    public AttemptStart start(Quiz quiz, Cohort cohort, boolean isDryRun, LocalDateTime now) {
        Attempt persisted = attemptRepository.save(Attempt.builder()
            .quizId(quiz.getId())
            .cohortId(cohort == null ? null : cohort.getId())
            .startedAt(now)
            .isDryRun(isDryRun)
            .build());
        List<Question> drawnQuestions = quizService.drawQuestions(quiz);
        for (int position = 0; position < drawnQuestions.size(); position++) {
            attemptQuestionRepository.save(
                AttemptQuestion.drawn(persisted.getId(), drawnQuestions.get(position).getId(), position));
        }
        return new AttemptStart(persisted, drawnQuestions);
    }

    @Transactional
    public Optional<AnswerStatus> submitAnswer(Quiz quiz, Attempt attempt, Question question, QuestionAnswerRequest request, LocalDateTime now) {
        return attemptQuestionRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()).map(attemptQuestion -> {
            AnswerStatus status = questionScoringService.score(question, request);
            attemptQuestion.score(quiz.getMode(), status, now);
            return status;
        });
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
