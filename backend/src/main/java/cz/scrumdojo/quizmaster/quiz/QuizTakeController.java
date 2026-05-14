package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.*;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.*;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardResponse;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    private final QuizLeaderboardService quizLeaderboardService;
    private final Clock clock;

    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptService attemptService,
            QuizLeaderboardService quizLeaderboardService,
            Clock clock) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
        this.attemptService = attemptService;
        this.quizLeaderboardService = quizLeaderboardService;
        this.clock = clock;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizMetadataResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizRepository.findById(id).map(QuizMetadataResponse::from));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<QuizLeaderboardResponse> getQuizLeaderboard(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizLeaderboardService.getLeaderboard(id));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<?> createAttempt(
            @PathVariable Integer id,
            @RequestBody(required = false) QuizAttemptStartRequest request) {

        Quiz quiz = requireAvailableQuiz(id);
        var cohort = resolveCohort(quiz, request);
        if (cohortRequested(request) && cohort.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cohort does not belong to this quiz."));
        }
        return ResponseEntity.ok(QuizAttemptStartResponse.from(
                attemptService.start(quiz, cohort.orElse(null), false, now())));
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

    @PostMapping("/{quizId}/attempts/{attemptId}/timeout")
    public ResponseEntity<Void> recordTimeout(
            @PathVariable Integer quizId,
            @PathVariable Integer attemptId) {

        var attempt = requireAttemptNotFinished(quizId, attemptId);
        attemptService.timeout(attempt, LocalDateTime.now(clock));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/evaluate")
    public ResponseEntity<QuizEvaluationResponse> evaluateQuiz(
            @PathVariable Integer quizId,
            @PathVariable Integer attemptId) {
        var attempt = requireAttemptNotFinished(quizId, attemptId);
        var evaluation = attemptService.evaluate(attempt, LocalDateTime.now(clock));
        var feedbackQuestions = quizService.loadQuestions(evaluation.questionIds()).stream()
                .map(QuestionResponse::feedbackFrom)
                .toArray(QuestionResponse[]::new);
        return ResponseEntity.ok(new QuizEvaluationResponse(
                evaluation.totalPoints(),
                evaluation.totalQuestions(),
                feedbackQuestions));
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/questions/{questionId}/submit")
    public ResponseEntity<?> submitAttemptQuestion(
            @PathVariable Integer quizId,
            @PathVariable Integer attemptId,
            @PathVariable Integer questionId,
            @RequestBody QuestionAnswerRequest request) {
        var quiz = requireQuiz(quizId);
        var attempt = requireAttemptNotFinished(quizId, attemptId);
        var question = quizService.loadQuestions(new int[] { questionId }).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var status = attemptService.submitAnswer(quiz, attempt, question.get(), request, now());
        if (status.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (quiz.getMode() == QuizMode.EXAM) {
            return ResponseEntity.ok(
                    new QuestionEvaluationResponse(status.get() == AnswerStatus.CORRECT, status.get().points(), null));
        }
        return ResponseEntity.ok(questionScoringService.evaluate(question.get(), request));
    }

    private Quiz requireQuiz(Integer quizId) {
        return quizRepository.findById(quizId).orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found with id: " + quizId)
        );
    }

    private Quiz requireAvailableQuiz(Integer quizId) {
        var quiz = requireQuiz(quizId);

        if (!quiz.isAvailable(now()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quiz is not currently available.");

        return quiz;
    }

    private Attempt requireAttemptNotFinished(Integer quizId, Integer attemptId) {
        var attempt = attemptRepository.findByIdAndQuizId(attemptId, quizId);

        if (attempt.isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found with id: " + attemptId + " for quiz id: " + quizId);

        if (attempt.get().isFinished())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attempt with id " + attemptId + " is already finished.");

        return attempt.get();
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
