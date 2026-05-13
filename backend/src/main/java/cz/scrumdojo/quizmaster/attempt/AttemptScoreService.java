package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AttemptScoreService {

    private final AttemptQuestionScoreRepository scoreRepository;

    public AttemptScoreService(AttemptQuestionScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    @Transactional
    public void seedUnansweredPlaceholders(Integer attemptId, int[] questionIds) {
        for (int position = 0; position < questionIds.length; position++) {
            scoreRepository.save(AttemptQuestionScore.builder()
                .attemptId(attemptId)
                .questionId(questionIds[position])
                .status(AnswerStatus.UNANSWERED)
                .position(position)
                .build());
        }
    }

    @Transactional
    public void recordSubmission(QuizMode mode, Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        if (mode == QuizMode.EXAM) {
            applyExamScore(attemptId, questionId, status, answeredAt);
        } else {
            applyLearnScore(attemptId, questionId, status, answeredAt);
        }
    }

    @Transactional
    public void recordExamScore(Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        applyExamScore(attemptId, questionId, status, answeredAt);
    }

    @Transactional
    public void recordLearnScore(Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        applyLearnScore(attemptId, questionId, status, answeredAt);
    }

    private void applyExamScore(Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        var row = scoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
            .orElseGet(() -> AttemptQuestionScore.builder()
                .attemptId(attemptId)
                .questionId(questionId)
                .build());
        row.setStatus(status);
        row.setAnsweredAt(answeredAt);
        scoreRepository.save(row);
    }

    private void applyLearnScore(Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        var existing = scoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
        if (existing.isPresent() && existing.get().getStatus() != AnswerStatus.UNANSWERED) return;
        var row = existing.orElseGet(() -> AttemptQuestionScore.builder()
            .attemptId(attemptId)
            .questionId(questionId)
            .build());
        row.setStatus(status);
        row.setAnsweredAt(answeredAt);
        scoreRepository.save(row);
    }
}
