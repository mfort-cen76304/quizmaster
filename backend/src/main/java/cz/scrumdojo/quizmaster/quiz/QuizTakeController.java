package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.Attempt;
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
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
import cz.scrumdojo.quizmaster.question.QuestionStatsLog;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.question.QuestionStatsLog;
import cz.scrumdojo.quizmaster.question.QuestionStatsLogRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {

    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;
    private final AttemptScoreService attemptScoreService;
    private final Clock clock;
    private final QuestionStatsLogRepository questionStatsLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService,
            AttemptScoreService attemptScoreService,
            Clock clock,
            QuestionStatsLogRepository questionStatsLogRepository) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
        this.attemptScoreService = attemptScoreService;
        this.clock = clock;
        this.questionStatsLogRepository = questionStatsLogRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizMetadataResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizService.getTakeQuiz(id));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<QuizLeaderboardResponse> getQuizLeaderboard(@PathVariable Integer id) {
        return quizRepository.findById(id)
            .map(quiz -> ResponseEntity.ok(new QuizLeaderboardResponse(
                List.of(
                    new QuizLeaderboardCohortResponse(1, "Team Rocket", 92),
                    new QuizLeaderboardCohortResponse(2, "Scrum Ninjas", 88),
                    new QuizLeaderboardCohortResponse(3, "Retro Masters", 75)
                ).toArray(QuizLeaderboardCohortResponse[]::new)
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/attempts")
    @Transactional
    public ResponseEntity<?> createAttempt(@PathVariable Integer id) {
        return quizRepository.findById(id)
            .map(quiz -> {
                if (!QuizAvailability.isAvailable(quiz, LocalDateTime.now(clock))) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Quiz is not currently available."));
                }

                var selectedQuestions = quizService.selectQuestions(quiz);
                var selectedQuestionIds = selectedQuestions.stream()
                    .mapToInt(Question::getId)
                    .toArray();
                Attempt attempt = Attempt.builder()
                    .quizId(id)
                    .questionIds(selectedQuestionIds)
                    .startedAt(LocalDateTime.now(clock))
                    .correctAnswers(0)
                    .partiallyCorrectAnswers(0)
                    .incorrectAnswers(0)
                    .build();
                Attempt persisted = attemptRepository.save(attempt);

                // Log ABANDONED for each question (default stav)
                for (Question q : selectedQuestions) {
                    QuestionStatsLog log = QuestionStatsLog.builder()
                        .questionId(q.getId())
                        .quizId(id)
                        .attemptId(persisted.getId())
                        .eventType("ABANDONED")
                        .eventDetail("{}")
                        .createdAt(LocalDateTime.now(clock))
                        .build();
                    questionStatsLogRepository.save(log);
                }

                QuestionTakeResponse[] questions = selectedQuestions.stream()
                    .map(QuestionTakeResponse::from)
                    .toArray(QuestionTakeResponse[]::new);
                return ResponseEntity.ok(new QuizAttemptStartResponse(persisted.getId(), questions));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/attempts/{attemptId}/timeout")
    public ResponseEntity<Void> recordTimeout(
            @PathVariable Integer id,
            @PathVariable Integer attemptId) {
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
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
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Log VIEWED pro všechny otázky v attemptu (pokud jsou stále ABANDONED)
        int[] qids = attempt.get().getQuestionIds();
        if (qids != null) {
            for (int qid : qids) {
                var logs = questionStatsLogRepository.findAll();
                logs.stream()
                    .filter(l -> l.getQuestionId().equals(qid)
                            && l.getAttemptId() != null && l.getAttemptId().equals(attemptId)
                            && "ABANDONED".equals(l.getEventType()))
                    .findFirst()
                    .ifPresent(l -> {
                        l.setEventType("VIEWED");
                        l.setCreatedAt(LocalDateTime.now(clock));
                        questionStatsLogRepository.save(l);
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
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var updatedAttempt = attempt.get();
        if (updatedAttempt.getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        var expectedQuestionIds = attempt.get().getQuestionIds();
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

            // SKIPPED: pokud není odpověď, aktualizuj ABANDONED na SKIPPED
            if (answer == null) {
                try {
                    var logs = questionStatsLogRepository.findAll();
                    logs.stream()
                        .filter(l -> l.getQuestionId().equals(questionId)
                                && l.getAttemptId() != null && l.getAttemptId().equals(attemptId)
                                && "ABANDONED".equals(l.getEventType()))
                        .findFirst()
                        .ifPresent(l -> {
                            l.setEventType("SKIPPED");
                            l.setCreatedAt(LocalDateTime.now(clock));
                            questionStatsLogRepository.save(l);
                        });
                } catch (Exception e) {
                    // ignore logging error
                }
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

    @PostMapping("/{id}/attempts/{attemptId}/questions/{questionId}/submit")
    public ResponseEntity<?> submitAttemptQuestion(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @PathVariable Integer questionId,
            @RequestBody QuestionAnswerRequest request) {
        var quiz = quizRepository.findById(id);
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (attempt.get().getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        var expectedQuestionIds = attempt.get().getQuestionIds();
        if (expectedQuestionIds == null || Arrays.stream(expectedQuestionIds).noneMatch(expectedId -> Objects.equals(expectedId, questionId))) {
            return ResponseEntity.badRequest().build();
        }

        var question = quizService.loadQuestions(new int[]{questionId}).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        double score = questionScoringService.score(question.get(), request);
        attemptScoreService.recordSubmission(
            quiz.get().getMode(), attemptId, questionId, ScoreOutcome.from(score), LocalDateTime.now(clock));

        // Update ABANDONED to ANSWERED for this question/attempt (nebo vytvoř nový záznam)
        try {
            String eventDetail = objectMapper.writeValueAsString(Map.of(
                "score", score,
                "correct", score >= 1.0,
                "answeredAt", LocalDateTime.now(clock).toString()
            ));
            // Najdi ABANDONED záznam a aktualizuj na ANSWERED
            var logs = questionStatsLogRepository.findAll();
            logs.stream()
                .filter(l -> l.getQuestionId().equals(questionId)
                        && l.getAttemptId() != null && l.getAttemptId().equals(attemptId)
                        && "ABANDONED".equals(l.getEventType()))
                .findFirst()
                .ifPresentOrElse(
                    l -> {
                        l.setEventType("ANSWERED");
                        l.setEventDetail(eventDetail);
                        l.setCreatedAt(LocalDateTime.now(clock));
                        questionStatsLogRepository.save(l);
                    },
                    () -> {
                        QuestionStatsLog log = QuestionStatsLog.builder()
                            .questionId(questionId)
                            .quizId(id)
                            .attemptId(attemptId)
                            .eventType("ANSWERED")
                            .eventDetail(eventDetail)
                            .createdAt(LocalDateTime.now(clock))
                            .build();
                        questionStatsLogRepository.save(log);
                    }
                );
        } catch (Exception e) {
            // ignore logging error
        }

        if (quiz.get().getMode() == QuizMode.EXAM) {
            return ResponseEntity.ok(new QuestionEvaluationResponse(score == 1, score, null));
        }

        return ResponseEntity.ok(questionScoringService.evaluate(question.get(), request));
    }
}
