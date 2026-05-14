package cz.scrumdojo.quizmaster.quiz;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptService;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionEvaluationResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardResponse;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardService;
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
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {
    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final CohortRepository cohortRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;
    private final AttemptService attemptService;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuizLeaderboardService quizLeaderboardService;
    private final Clock clock;
    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            CohortRepository cohortRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptService attemptService,
            AttemptQuestionRepository attemptQuestionRepository,
            QuizLeaderboardService quizLeaderboardService,
            Clock clock) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.cohortRepository = cohortRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
        this.attemptService = attemptService;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.quizLeaderboardService = quizLeaderboardService;
        this.clock = clock;
    }
    @GetMapping("/{id}")
    public ResponseEntity<QuizMetadataResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizService.getTakeQuiz(id));
    }
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<QuizLeaderboardResponse> getQuizLeaderboard(@PathVariable Integer id) {
        return quizLeaderboardService.getLeaderboard(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

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
                Attempt persisted = attemptService.startAttempt(
                    Attempt.builder()
                        .quizId(id)
                        .cohortId(cohortId.orElse(null))
                        .startedAt(now)
                        .build(),
                    selectedQuestionIds);
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
        if (attempt.get().isFinished()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        attemptService.timeout(attempt.get(), LocalDateTime.now(clock));
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
        int[] questionIds = orderedQuestionIds(attemptId);
        return ResponseHelper.okOrNotFound(quizService.getTakeQuizForAttempt(id, questionIds));
    }
    @PostMapping("/{id}/attempts/{attemptId}/evaluate")
    public ResponseEntity<QuizEvaluationResponse> evaluateQuiz(
            @PathVariable Integer id,
            @PathVariable Integer attemptId) {
        var attempt = findActiveAttempt(id, attemptId);
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (attempt.get().isFinished()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        var evaluation = attemptService.evaluate(attempt.get(), LocalDateTime.now(clock));
        var feedbackQuestions = quizService.loadQuestions(evaluation.questionIds()).stream()
            .map(QuestionResponse::feedbackFrom)
            .toArray(QuestionResponse[]::new);
        return ResponseEntity.ok(new QuizEvaluationResponse(
            evaluation.totalPoints(),
            evaluation.totalQuestions(),
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
        if (attempt.get().isFinished()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        var question = quizService.loadQuestions(new int[]{questionId}).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AnswerStatus status = attemptService.submitAnswer(quiz.get(), attempt.get(), question.get(), request, LocalDateTime.now(clock));
        if (quiz.get().getMode() == QuizMode.EXAM) {
            return ResponseEntity.ok(new QuestionEvaluationResponse(status == AnswerStatus.CORRECT, status.points(), null));
        }
        return ResponseEntity.ok(questionScoringService.evaluate(question.get(), request));
    }
    private Optional<Attempt> findActiveAttempt(Integer quizId, Integer attemptId) {
        return attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), quizId));
    }
    private int[] orderedQuestionIds(Integer attemptId) {
        return attemptQuestionRepository.findByAttemptIdOrderByPosition(attemptId).stream()
            .mapToInt(AttemptQuestion::getQuestionId)
            .toArray();
    }
}
