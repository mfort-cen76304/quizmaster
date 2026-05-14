package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.*;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.*;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardResponse;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {
    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;
    private final AttemptService attemptService;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuizLeaderboardService quizLeaderboardService;
    private final Clock clock;

    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptService attemptService,
            AttemptQuestionRepository attemptQuestionRepository,
            QuizLeaderboardService quizLeaderboardService,
            Clock clock) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
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
        var quizOpt = quizRepository.findById(id);
        if (quizOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Quiz quiz = quizOpt.get();
        var now = LocalDateTime.now(clock);
        if (!QuizAvailability.isAvailable(quiz, now)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Quiz is not currently available."));
        }
        var cohort = resolveCohort(quiz, request);
        if (cohortRequested(request) && cohort.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cohort does not belong to this quiz."));
        }
        return ResponseEntity.ok(QuizAttemptStartResponse.from(
                attemptService.start(quiz, cohort.orElse(null), false, now)));
    }

    private Optional<Cohort> resolveCohort(Quiz quiz, QuizAttemptStartRequest request) {
        if (!cohortRequested(request)) {
            return Optional.empty();
        }
        try {
            return quiz.findCohortByGuid(UUID.fromString(request.cohortGuid()));
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    private boolean cohortRequested(QuizAttemptStartRequest request) {
        return request != null && request.cohortGuid() != null && !request.cohortGuid().isBlank();
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
                feedbackQuestions));
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
        var question = quizService.loadQuestions(new int[] { questionId }).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var status = attemptService.submitAnswer(quiz.get(), attempt.get(), question.get(), request,
                LocalDateTime.now(clock));
        if (status.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (quiz.get().getMode() == QuizMode.EXAM) {
            return ResponseEntity.ok(
                    new QuestionEvaluationResponse(status.get() == AnswerStatus.CORRECT, status.get().points(), null));
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
