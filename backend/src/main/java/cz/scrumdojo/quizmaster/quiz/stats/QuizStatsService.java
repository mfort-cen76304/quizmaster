package cz.scrumdojo.quizmaster.quiz.stats;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScore;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScoreRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptStatus;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
@Service
public class QuizStatsService {
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionScoreRepository attemptQuestionScoreRepository;
    private final QuizService quizService;
    public QuizStatsService(
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            AttemptQuestionScoreRepository attemptQuestionScoreRepository,
            QuizService quizService) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.attemptQuestionScoreRepository = attemptQuestionScoreRepository;
        this.quizService = quizService;
    }
    @Transactional(readOnly = true)
    public Optional<QuizStatsResponse> getStats(String workspaceGuid, Integer quizId) {
        return quizRepository.findByIdAndWorkspaceGuid(quizId, workspaceGuid).map(quiz -> {
            List<Attempt> attempts = attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quizId);
            List<Integer> attemptIds = attempts.stream().map(Attempt::getId).toList();
            List<AttemptQuestionScore> allScores = attemptIds.isEmpty()
                    ? List.of()
                    : attemptQuestionScoreRepository.findByAttemptIdIn(attemptIds);
            Map<Integer, List<AttemptQuestionScore>> scoresByAttemptId = allScores.stream()
                    .collect(Collectors.groupingBy(AttemptQuestionScore::getAttemptId));
            List<AttemptStatsRecord> attemptRecords = attempts.stream()
                    .map(attempt -> toAttemptRecord(
                            quiz,
                            getTotalQuestions(quiz, attempt),
                            attempt,
                            scoresByAttemptId.getOrDefault(attempt.getId(), List.of())))
                    .toList();
            SummaryStats summary = computeSummary(attemptRecords);
            List<QuestionStatsRecord> questionRecords = buildQuestionRecords(quiz, attempts, allScores);
            return new QuizStatsResponse(summary, attemptRecords, questionRecords);
        });
    }
    private List<QuestionStatsRecord> buildQuestionRecords(Quiz quiz, List<Attempt> attempts, List<AttemptQuestionScore> allScores) {
        List<Question> questions = quizService.loadQuestions(quiz);
        if (questions.isEmpty()) {
            return List.of();
        }
        Map<Integer, Long> drawCountsByQuestionId = attempts.stream()
                .flatMap(attempt -> attempt.getQuestionIds() == null
                        ? Stream.<Integer>empty()
                        : Arrays.stream(attempt.getQuestionIds()).boxed())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        Map<Integer, List<AttemptQuestionScore>> scoresByQuestionId = allScores.stream()
                .collect(Collectors.groupingBy(AttemptQuestionScore::getQuestionId));
        return questions.stream()
                .map(question -> toQuestionRecord(
                        question,
                        drawCountsByQuestionId.getOrDefault(question.getId(), 0L).intValue(),
                        scoresByQuestionId.getOrDefault(question.getId(), List.of())))
                .toList();
    }
    private QuestionStatsRecord toQuestionRecord(
            Question question,
            int drawCount,
            List<AttemptQuestionScore> scores) {
        List<AttemptQuestionScore> answeredScores = scores.stream()
                .filter(s -> s.getStatus() != AnswerStatus.UNANSWERED)
                .toList();
        int answered = answeredScores.size();
        int unanswered = drawCount - answered;
        int correctAnswers = countByStatus(answeredScores, AnswerStatus.CORRECT);
        int partiallyCorrectAnswers = countByStatus(answeredScores, AnswerStatus.PARTIAL);
        int incorrectAnswers = countByStatus(answeredScores, AnswerStatus.INCORRECT);
        return new QuestionStatsRecord(
                question.getQuestion(),
                answered,
                correctAnswers,
                partiallyCorrectAnswers,
                incorrectAnswers,
                unanswered
        );
    }
    private int countByStatus(List<AttemptQuestionScore> scores, AnswerStatus status) {
        return (int) scores.stream()
                .filter(s -> s.getStatus() == status)
                .count();
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
    private AttemptStatsRecord toAttemptRecord(Quiz quiz, int totalQuestions, Attempt attempt, List<AttemptQuestionScore> scores) {
        LocalDateTime endTime = attempt.getTimedOutAt() != null
                ? attempt.getTimedOutAt()
                : attempt.getFinishedAt();
        Integer durationSeconds = endTime != null
                ? (int) Duration.between(attempt.getStartedAt(), endTime).getSeconds()
                : null;
        if (durationSeconds != null && attempt.getTimedOutAt() != null && quiz.getTimeLimit() != null) {
            durationSeconds = Math.min(durationSeconds, quiz.getTimeLimit());
        }
        int correctAnswers = countByStatus(scores, AnswerStatus.CORRECT);
        int partiallyCorrectAnswers = countByStatus(scores, AnswerStatus.PARTIAL);
        int incorrectAnswers = attempt.getFinishedAt() != null
                ? totalQuestions - correctAnswers - partiallyCorrectAnswers
                : countByStatus(scores, AnswerStatus.INCORRECT);
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
