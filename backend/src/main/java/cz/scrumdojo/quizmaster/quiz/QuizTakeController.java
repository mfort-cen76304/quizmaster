package cz.scrumdojo.quizmaster.quiz;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScoreRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptResponse;
import cz.scrumdojo.quizmaster.attempt.AttemptScoreService;
import cz.scrumdojo.quizmaster.attempt.ScoreOutcome;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionEvaluationResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.question.QuestionStatsLog;
import cz.scrumdojo.quizmaster.question.QuestionStatsLogRepository;
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {
    private static final String ABANDONED = "ABANDONED";
    private static final String ANSWERED = "ANSWERED";
    private static final String SKIPPED = "SKIPPED";
    private static final String TIMEOUT = "TIMEOUT";
    private static final String VIEWED = "VIEWED";
    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final CohortRepository cohortRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;
    private final AttemptScoreService attemptScoreService;
    private final AttemptQuestionScoreRepository attemptQuestionScoreRepository;
    private final Clock clock;
    private final QuestionStatsLogRepository questionStatsLogRepository;
    private final ObjectMapper objectMapper;
    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            CohortRepository cohortRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptScoreService attemptScoreService,
            AttemptQuestionScoreRepository attemptQuestionScoreRepository,
            Clock clock,
            QuestionStatsLogRepository questionStatsLogRepository,
            ObjectMapper objectMapper) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.cohortRepository = cohortRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
        this.attemptScoreService = attemptScoreService;
        this.attemptQuestionScoreRepository = attemptQuestionScoreRepository;
        this.clock = clock;
        this.questionStatsLogRepository = questionStatsLogRepository;
        this.objectMapper = objectMapper;
    }
    @GetMapping("/{id}")
    public ResponseEntity<QuizMetadataResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizService.getTakeQuiz(id));
    }
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<QuizLeaderboardResponse> getQuizLeaderboard(@PathVariable Integer id) {
        return quizRepository.findById(id)
            .map(quiz -> ResponseEntity.ok(new QuizLeaderboardResponse(buildLeaderboard(quiz))))
            .orElse(ResponseEntity.notFound().build());
    }

    private QuizLeaderboardCohortResponse[] buildLeaderboard(Quiz quiz) {
        var scoresByCohort = new HashMap<Integer, List<Integer>>();
        for (Attempt attempt : attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId())) {
            if (attempt.getFinishedAt() == null || attempt.getCohortId() == null) {
                continue;
            }
            scoresByCohort
                .computeIfAbsent(attempt.getCohortId(), ignored -> new ArrayList<>())
                .add(calculateAttemptScore(quiz, attempt));
        }

        var rankedCohorts = quiz.getCohorts().stream()
            .map(cohort -> new CohortLeaderboardRow(
                cohort.getName(),
                averageScore(scoresByCohort.get(cohort.getId()))
            ))
            .sorted(Comparator.comparingInt(CohortLeaderboardRow::score).reversed()
                .thenComparing(CohortLeaderboardRow::name))
            .toList();

        QuizLeaderboardCohortResponse[] response = new QuizLeaderboardCohortResponse[rankedCohorts.size()];
        for (int index = 0; index < rankedCohorts.size(); index++) {
            var cohort = rankedCohorts.get(index);
            response[index] = new QuizLeaderboardCohortResponse(index + 1, cohort.name(), cohort.score());
        }
        return response;
    }

    private int calculateAttemptScore(Quiz quiz, Attempt attempt) {
        int totalQuestions = attempt.getQuestionIds() != null && attempt.getQuestionIds().length > 0
            ? attempt.getQuestionIds().length
            : totalQuestionsForQuiz(quiz);
        if (totalQuestions <= 0) {
            return 0;
        }

        int correctAnswers = attempt.getCorrectAnswers() != null ? attempt.getCorrectAnswers() : 0;
        int partiallyCorrectAnswers = attempt.getPartiallyCorrectAnswers() != null
            ? attempt.getPartiallyCorrectAnswers()
            : 0;
        float earnedPoints = correctAnswers + 0.5f * partiallyCorrectAnswers;
        return Math.round(earnedPoints / totalQuestions * 100);
    }

    private int totalQuestionsForQuiz(Quiz quiz) {
        int total = quiz.getQuestionIds() == null ? 0 : quiz.getQuestionIds().length;
        Integer randomCount = quiz.getRandomQuestionCount();
        return (randomCount != null && randomCount > 0) ? Math.min(randomCount, total) : total;
    }

    private int averageScore(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) {
            return 0;
        }
        int total = scores.stream().mapToInt(Integer::intValue).sum();
        return Math.round((float) total / scores.size());
    }

    private record CohortLeaderboardRow(String name, int score) {}
    @PostMapping("/{id}/attempts")
    public ResponseEntity<?> createAttempt(
            @PathVariable Integer id,
            @RequestBody(required = false) QuizAttemptStartRequest request) {
        return quizRepository.findById(id)
            .map(quiz -> {
                var cohortId = resolveCohortId(id, request);
                if (cohortId.isEmpty() && request != null && request.cohortGuid() != null && !request.cohortGuid().isBlank()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cohort does not belong to this quiz."));
                }
                var now = LocalDateTime.now(clock);
                if (!QuizAvailability.isAvailable(quiz, now)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Quiz is not currently available."));
                }
                var selectedQuestions = quizService.selectQuestions(quiz);
                var selectedQuestionIds = selectedQuestions.stream()
                    .mapToInt(Question::getId)
                    .toArray();
                Attempt attempt = Attempt.builder()
                    .quizId(id)
                    .cohortId(cohortId.orElse(null))
                    .questionIds(selectedQuestionIds)
                    .startedAt(now)
                    .correctAnswers(0)
                    .partiallyCorrectAnswers(0)
                    .incorrectAnswers(0)
                    .build();
                Attempt persisted = attemptRepository.save(attempt);
                for (Question question : selectedQuestions) {
                    questionStatsLogRepository.save(QuestionStatsLog.builder()
                        .questionId(question.getId())
                        .quizId(id)
                        .attemptId(persisted.getId())
                        .eventType(ABANDONED)
                        .eventDetail("{}")
                        .createdAt(now)
                        .build());
                }
                QuestionTakeResponse[] questions = selectedQuestions.stream()
                    .map(QuestionTakeResponse::from)
                    .toArray(QuestionTakeResponse[]::new);
                return ResponseEntity.ok(new QuizAttemptStartResponse(persisted.getId(), questions));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private Optional<Integer> resolveCohortId(Integer quizId, QuizAttemptStartRequest request) {
        if (request == null || request.cohortGuid() == null || request.cohortGuid().isBlank()) {
            return Optional.empty();
        }

        try {
            UUID cohortGuid = UUID.fromString(request.cohortGuid());
            return cohortRepository.findByGuidAndQuizId(cohortGuid, quizId).map(Cohort::getId);
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }
    @PostMapping("/{id}/attempts/{attemptId}/timeout")
    public ResponseEntity<Void> recordTimeout(
            @PathVariable Integer id,
            @PathVariable Integer attemptId) {
        var attempt = findActiveAttempt(id, attemptId);
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var existing = attempt.get();
        if (existing.getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        existing.setTimedOutAt(LocalDateTime.now(clock));
        attemptRepository.save(existing);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}/attempts/{attemptId}")
    public ResponseEntity<QuizTakeResponse> getAttemptQuiz(
            @PathVariable Integer id,
            @PathVariable Integer attemptId) {
        var attempt = findActiveAttempt(id, attemptId);
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        int[] questionIds = attempt.get().getQuestionIds();
        if (questionIds != null) {
            for (int questionId : questionIds) {
                questionStatsLogRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
                    .filter(log -> ABANDONED.equals(log.getEventType()))
                    .ifPresent(log -> {
                        log.setEventType(VIEWED);
                        log.setCreatedAt(LocalDateTime.now(clock));
                        questionStatsLogRepository.save(log);
                    });
            }
        }
        return ResponseHelper.okOrNotFound(quizService.getTakeQuizForAttempt(id, attempt.get().getQuestionIds()));
    }
    @PostMapping("/{id}/attempts/{attemptId}/evaluate")
    public ResponseEntity<QuizEvaluationResponse> evaluateQuiz(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @RequestBody QuizEvaluationRequest request) {
        var quiz = quizRepository.findById(id);
        var attempt = findActiveAttempt(id, attemptId);
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var updatedAttempt = attempt.get();
        if (updatedAttempt.getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        var expectedQuestionIds = updatedAttempt.getQuestionIds();
        if (expectedQuestionIds == null || request.questionIds() == null || !Arrays.equals(expectedQuestionIds, request.questionIds())) {
            return ResponseEntity.badRequest().build();
        }
        var questionsById = quizService.loadQuestions(expectedQuestionIds).stream()
            .collect(Collectors.toMap(Question::getId, Function.identity()));
        var answerByQuestionId = request.answers() == null
            ? Map.<Integer, QuestionAnswerRequest>of()
            : Arrays.stream(request.answers())
                .filter(answer -> answer.questionId() != null)
                .collect(Collectors.toMap(QuestionAnswerRequest::questionId, Function.identity(), (left, right) -> right));
        var timedOutQuestionId = findTimedOutQuestionId(expectedQuestionIds, attemptId, updatedAttempt.getTimedOutAt() != null);
        int correct = 0;
        int partial = 0;
        int incorrect = 0;
        double score = 0;
        for (Integer questionId : expectedQuestionIds) {
            var question = questionsById.get(questionId);
            if (question == null) {
                return ResponseEntity.notFound().build();
            }
            QuestionAnswerRequest answer = answerByQuestionId.get(questionId);
            double questionScore = questionScoringService.score(question, answer);
            score += questionScore;
            if (questionScore == 1) correct++;
            else if (questionScore == 0.5) partial++;
            else incorrect++;
            if (answer == null) {
                finalizeUnansweredQuestion(id, attemptId, questionId, updatedAttempt.getTimedOutAt() != null, timedOutQuestionId);
            }
        }
        updatedAttempt.setCorrectAnswers(correct);
        updatedAttempt.setPartiallyCorrectAnswers(partial);
        updatedAttempt.setIncorrectAnswers(incorrect);
        updatedAttempt.setFinishedAt(LocalDateTime.now(clock));
        var feedbackQuestions = Arrays.stream(expectedQuestionIds)
            .mapToObj(questionsById::get)
            .map(QuestionResponse::feedbackFrom)
            .toArray(QuestionResponse[]::new);
        return ResponseEntity.ok(new QuizEvaluationResponse(
            AttemptResponse.from(attemptRepository.save(updatedAttempt)),
            score,
            expectedQuestionIds.length,
            feedbackQuestions
        ));
    }
    @PostMapping("/{id}/attempts/{attemptId}/questions/{questionId}/skip")
    public ResponseEntity<Void> skipAttemptQuestion(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @PathVariable Integer questionId) {
        var attempt = findActiveAttempt(id, attemptId);
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!containsQuestion(attempt.get().getQuestionIds(), questionId)) {
            return ResponseEntity.badRequest().build();
        }
        if (attemptQuestionScoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId).isPresent()) {
            return ResponseEntity.noContent().build();
        }
        saveAttemptQuestionLog(id, attemptId, questionId, SKIPPED, "{}");
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{id}/attempts/{attemptId}/questions/{questionId}/submit")
    public ResponseEntity<?> submitAttemptQuestion(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @PathVariable Integer questionId,
            @RequestBody QuestionAnswerRequest request) {
        var quiz = quizRepository.findById(id);
        var attempt = findActiveAttempt(id, attemptId);
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (attempt.get().getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (!containsQuestion(attempt.get().getQuestionIds(), questionId)) {
            return ResponseEntity.badRequest().build();
        }
        var question = quizService.loadQuestions(new int[]{questionId}).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var answeredAt = LocalDateTime.now(clock);
        double score = questionScoringService.score(question.get(), request);
        attemptScoreService.recordSubmission(
            quiz.get().getMode(), attemptId, questionId, ScoreOutcome.from(score), answeredAt);
        try {
            saveAttemptQuestionLog(id, attemptId, questionId, ANSWERED, answeredEventDetail(score, answeredAt));
        } catch (Exception ignored) {
            // ignore logging error
        }
        if (quiz.get().getMode() == QuizMode.EXAM) {
            return ResponseEntity.ok(new QuestionEvaluationResponse(score == 1, score, null));
        }
        return ResponseEntity.ok(questionScoringService.evaluate(question.get(), request));
    }
    private Optional<Attempt> findActiveAttempt(Integer quizId, Integer attemptId) {
        return attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), quizId));
    }
    private boolean containsQuestion(int[] questionIds, Integer questionId) {
        return questionIds != null && Arrays.stream(questionIds).anyMatch(expectedId -> Objects.equals(expectedId, questionId));
    }
    private Integer findTimedOutQuestionId(int[] questionIds, Integer attemptId, boolean timedOut) {
        if (!timedOut) {
            return null;
        }
        for (int questionId : questionIds) {
            if (attemptQuestionScoreRepository.findByAttemptIdAndQuestionId(attemptId, questionId).isPresent()) {
                continue;
            }
            var eventType = questionStatsLogRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
                .map(QuestionStatsLog::getEventType)
                .orElse(ABANDONED);
            if (!SKIPPED.equals(eventType)) {
                return questionId;
            }
        }
        return null;
    }
    private void finalizeUnansweredQuestion(
            Integer quizId,
            Integer attemptId,
            Integer questionId,
            boolean timedOut,
            Integer timedOutQuestionId) {
        questionStatsLogRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
            .ifPresentOrElse(log -> {
                if (ANSWERED.equals(log.getEventType()) || SKIPPED.equals(log.getEventType())) {
                    return;
                }
                if (timedOut && Objects.equals(questionId, timedOutQuestionId)) {
                    saveAttemptQuestionLog(quizId, attemptId, questionId, TIMEOUT, log.getEventDetail());
                } else if (!timedOut) {
                    saveAttemptQuestionLog(quizId, attemptId, questionId, SKIPPED, log.getEventDetail());
                }
            }, () -> {
                if (timedOut && Objects.equals(questionId, timedOutQuestionId)) {
                    saveAttemptQuestionLog(quizId, attemptId, questionId, TIMEOUT, "{}");
                } else if (!timedOut) {
                    saveAttemptQuestionLog(quizId, attemptId, questionId, SKIPPED, "{}");
                }
            });
    }
    private String answeredEventDetail(double score, LocalDateTime answeredAt) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
            "score", score,
            "correct", score >= 1.0,
            "answeredAt", answeredAt.toString()
        ));
    }
    private void saveAttemptQuestionLog(
            Integer quizId,
            Integer attemptId,
            Integer questionId,
            String eventType,
            String eventDetail) {
        var log = questionStatsLogRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
            .orElseGet(() -> QuestionStatsLog.builder()
                .questionId(questionId)
                .quizId(quizId)
                .attemptId(attemptId)
                .build());
        log.setEventType(eventType);
        log.setEventDetail(eventDetail == null ? "{}" : eventDetail);
        log.setCreatedAt(LocalDateTime.now(clock));
        questionStatsLogRepository.save(log);
    }
}
