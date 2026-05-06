package cz.scrumdojo.quizmaster.quiz.stats;

import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptStatus;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class QuizStatsService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;

    public QuizStatsService(QuizRepository quizRepository, AttemptRepository attemptRepository) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public Optional<QuizStatsResponse> getStats(String workspaceGuid, Integer quizId) {
        return quizRepository.findByIdAndWorkspaceGuid(quizId, workspaceGuid).map(quiz -> {
            List<Attempt> attempts = attemptRepository.findByQuizIdOrderByStartedAtDesc(quizId);
            List<AttemptStatsRecord> records = attempts.stream()
                    .map(attempt -> toRecord(quiz, getTotalQuestions(quiz, attempt), attempt))
                    .toList();
            SummaryStats summary = computeSummary(records);
            return new QuizStatsResponse(summary, records);
        });
    }

    private int getTotalQuestions(Quiz quiz) {
        if (quiz.getRandomQuestionCount() != null && quiz.getRandomQuestionCount() > 0) {
            return quiz.getRandomQuestionCount();
        }
        return quiz.getQuestionIds() != null ? quiz.getQuestionIds().length : 0;
    }

    private int getTotalQuestions(Quiz quiz, Attempt attempt) {
        if (attempt.getQuestionIds() != null && attempt.getQuestionIds().length > 0) {
            return attempt.getQuestionIds().length;
        }
        return getTotalQuestions(quiz);
    }

    private AttemptStatsRecord toRecord(Quiz quiz, int totalQuestions, Attempt attempt) {
        LocalDateTime endTime = attempt.getTimedOutAt() != null
                ? attempt.getTimedOutAt()
                : attempt.getFinishedAt();
        Integer durationSeconds = endTime != null
                ? (int) Duration.between(attempt.getStartedAt(), endTime).getSeconds()
                : null;
        if (durationSeconds != null && attempt.getTimedOutAt() != null && quiz.getTimeLimit() != null) {
            durationSeconds = Math.min(durationSeconds, quiz.getTimeLimit());
        }

        int correctAnswers = attempt.getCorrectAnswers();
        int partiallyCorrectAnswers = attempt.getPartiallyCorrectAnswers() != null
                ? attempt.getPartiallyCorrectAnswers()
                : 0;
        int incorrectAnswers = attempt.getFinishedAt() != null
                ? totalQuestions - correctAnswers - partiallyCorrectAnswers
                : attempt.getIncorrectAnswers();

        float earnedPoints = correctAnswers + 0.5f * partiallyCorrectAnswers;
        int score = totalQuestions > 0
                ? Math.round(earnedPoints / totalQuestions * 100)
                : 0;

        AttemptStatus status = deriveStatus(attempt);

        return new AttemptStatsRecord(
                attempt.getId(),
                durationSeconds,
                correctAnswers,
                incorrectAnswers,
                partiallyCorrectAnswers,
                totalQuestions,
                score,
                status
        );
    }

    private AttemptStatus deriveStatus(Attempt attempt) {
        boolean evaluated = attempt.getFinishedAt() != null;
        boolean timedOut = attempt.getTimedOutAt() != null;

        if (evaluated && !timedOut) return AttemptStatus.FINISHED;
        if (evaluated && timedOut) return AttemptStatus.TIMEOUT;
        if (!evaluated && timedOut) return AttemptStatus.ABANDONED;
        return AttemptStatus.IN_PROGRESS;
    }

    private SummaryStats computeSummary(List<AttemptStatsRecord> records) {
        int started = records.size();
        int finished = (int) records.stream().filter(r -> r.status() == AttemptStatus.FINISHED).count();
        int timeout = (int) records.stream().filter(r -> r.status() == AttemptStatus.TIMEOUT).count();
        int unfinished = started - finished - timeout;
        return new SummaryStats(started, finished, unfinished, timeout);
    }
}
