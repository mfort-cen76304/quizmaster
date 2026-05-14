package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.quiz.QuizMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AttemptScoreService {

    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;

    public AttemptScoreService(AttemptRepository attemptRepository,
                               AttemptQuestionRepository attemptQuestionRepository) {
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
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
        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attemptId, questionId).orElseThrow();
        row.setStatus(status);
        row.setAnsweredAt(answeredAt);
        attemptQuestionRepository.save(row);
    }

    private void applyLearnScore(Integer attemptId, Integer questionId, AnswerStatus status, LocalDateTime answeredAt) {
        var row = attemptQuestionRepository.findByAttemptIdAndQuestionId(attemptId, questionId).orElseThrow();
        if (row.getStatus() != AnswerStatus.UNANSWERED) return;
        row.setStatus(status);
        row.setAnsweredAt(answeredAt);
        attemptQuestionRepository.save(row);
    }
}
