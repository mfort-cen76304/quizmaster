package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttemptScoreService {

    private final AttemptRepository attemptRepository;
    private final AttemptQuestionScoreRepository scoreRepository;

    public AttemptScoreService(AttemptRepository attemptRepository, AttemptQuestionScoreRepository scoreRepository) {
        this.attemptRepository = attemptRepository;
        this.scoreRepository = scoreRepository;
    }

    @Transactional
    public void recordSubmission(QuizMode mode, Integer attemptId, Integer questionId, ScoreOutcome outcome, LocalDateTime answeredAt) {
        if (mode == QuizMode.EXAM) {
            applyExamScore(attemptId, questionId, outcome, answeredAt);
        } else {
            applyLearnScore(attemptId, questionId, outcome, answeredAt);
        }
        applyRecomputedCounters(attemptId);
    }

    @Transactional
    public void recordExamScore(Integer attemptId, Integer questionId, ScoreOutcome outcome, LocalDateTime answeredAt) {
        applyExamScore(attemptId, questionId, outcome, answeredAt);
    }

    @Transactional
    public void recordLearnScore(Integer attemptId, Integer questionId, ScoreOutcome outcome, LocalDateTime answeredAt) {
        applyLearnScore(attemptId, questionId, outcome, answeredAt);
    }

    @Transactional
    public void recomputeAttemptCounters(Integer attemptId) {
        applyRecomputedCounters(attemptId);
    }

    private void applyExamScore(Integer attemptId, Integer questionId, ScoreOutcome outcome, LocalDateTime answeredAt) {
        var existing = scoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
        var entity = existing.orElseGet(() -> AttemptQuestionScore.builder()
            .attemptId(attemptId)
            .questionId(questionId)
            .build());
        entity.setScore(outcome);
        entity.setAnsweredAt(answeredAt);
        scoreRepository.save(entity);
    }

    private void applyLearnScore(Integer attemptId, Integer questionId, ScoreOutcome outcome, LocalDateTime answeredAt) {
        if (scoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId).isPresent()) return;
        scoreRepository.save(AttemptQuestionScore.builder()
            .attemptId(attemptId)
            .questionId(questionId)
            .score(outcome)
            .answeredAt(answeredAt)
            .build());
    }

    private void applyRecomputedCounters(Integer attemptId) {
        var attempt = attemptRepository.findById(attemptId).orElseThrow();
        List<AttemptQuestionScore> rows = scoreRepository.findByAttemptId(attemptId);
        int correct = 0;
        int partial = 0;
        int incorrect = 0;
        for (AttemptQuestionScore row : rows) {
            switch (row.getScore()) {
                case CORRECT -> correct++;
                case PARTIAL -> partial++;
                case INCORRECT -> incorrect++;
            }
        }
        attempt.setCorrectAnswers(correct);
        attempt.setPartiallyCorrectAnswers(partial);
        attempt.setIncorrectAnswers(incorrect);
        attemptRepository.save(attempt);
    }
}
