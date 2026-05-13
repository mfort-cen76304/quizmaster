package cz.scrumdojo.quizmaster.quiz;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScore;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScoreRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptScoreService;
import cz.scrumdojo.quizmaster.attempt.ScoreOutcome;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionEvaluationResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
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
    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final CohortRepository cohortRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;
    private final AttemptScoreService attemptScoreService;
    private final AttemptQuestionScoreRepository attemptQuestionScoreRepository;
    private final Clock clock;
    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            CohortRepository cohortRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptScoreService attemptScoreService,
            AttemptQuestionScoreRepository attemptQuestionScoreRepository,
            Clock clock) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.cohortRepository = cohortRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
        this.attemptScoreService = attemptScoreService;
        this.attemptQuestionScoreRepository = attemptQuestionScoreRepository;
        this.clock = clock;
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
        var attempts = attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId());
        var finishedCohortAttempts = attempts.stream()
            .filter(a -> a.getFinishedAt() != null && a.getCohortId() != null)
            .toList();
        var attemptIds = finishedCohortAttempts.stream().map(Attempt::getId).toList();
        var scoresByAttemptId = attemptIds.isEmpty()
            ? Map.<Integer, List<AttemptQuestionScore>>of()
            : attemptQuestionScoreRepository.findByAttemptIdIn(attemptIds).stream()
                .collect(Collectors.groupingBy(AttemptQuestionScore::getAttemptId));
        var scoresByCohort = new HashMap<Integer, List<Integer>>();
        for (Attempt attempt : finishedCohortAttempts) {
            scoresByCohort
                .computeIfAbsent(attempt.getCohortId(), ignored -> new ArrayList<>())
                .add(calculateAttemptScore(quiz, attempt, scoresByAttemptId.getOrDefault(attempt.getId(), List.of())));
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

    private int calculateAttemptScore(Quiz quiz, Attempt attempt, List<AttemptQuestionScore> scores) {
        int totalQuestions = attempt.getQuestionIds() != null && attempt.getQuestionIds().length > 0
            ? attempt.getQuestionIds().length
            : totalQuestionsForQuiz(quiz);
        if (totalQuestions <= 0) {
            return 0;
        }

        int correctAnswers = (int) scores.stream().filter(s -> s.getScore() == ScoreOutcome.CORRECT).count();
        int partiallyCorrectAnswers = (int) scores.stream().filter(s -> s.getScore() == ScoreOutcome.PARTIAL).count();
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
                    .build();
                Attempt persisted = attemptRepository.save(attempt);
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
        double score = 0;
        for (Integer questionId : expectedQuestionIds) {
            var question = questionsById.get(questionId);
            if (question == null) {
                return ResponseEntity.notFound().build();
            }
            QuestionAnswerRequest answer = answerByQuestionId.get(questionId);
            score += questionScoringService.score(question, answer);
        }
        updatedAttempt.setFinishedAt(LocalDateTime.now(clock));
        var feedbackQuestions = Arrays.stream(expectedQuestionIds)
            .mapToObj(questionsById::get)
            .map(QuestionResponse::feedbackFrom)
            .toArray(QuestionResponse[]::new);
        attemptRepository.save(updatedAttempt);
        return ResponseEntity.ok(new QuizEvaluationResponse(
            score,
            expectedQuestionIds.length,
            feedbackQuestions
        ));
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
}
