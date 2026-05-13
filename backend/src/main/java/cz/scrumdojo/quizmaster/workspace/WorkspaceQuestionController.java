package cz.scrumdojo.quizmaster.workspace;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.aiassistant.QuestionEmbeddingService;
import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionRequest;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.question.QuestionStatsLogRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/questions")
public class WorkspaceQuestionController {

    private final WorkspaceGuard workspaceGuard;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuestionEmbeddingService questionEmbeddingService;
    private final QuestionStatsLogRepository questionStatsLogRepository;
    private final ObjectMapper objectMapper;

    public WorkspaceQuestionController(
        WorkspaceGuard workspaceGuard,
        QuestionRepository questionRepository,
        QuizRepository quizRepository,
        QuestionEmbeddingService questionEmbeddingService,
        QuestionStatsLogRepository questionStatsLogRepository,
        ObjectMapper objectMapper
    ) {
        this.workspaceGuard = workspaceGuard;
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.questionEmbeddingService = questionEmbeddingService;
        this.questionStatsLogRepository = questionStatsLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<List<QuestionListItem>> getWorkspaceQuestions(@PathVariable String workspaceGuid) {
        workspaceGuard.requireExists(workspaceGuid);

        List<Question> questions = questionRepository.findByWorkspaceGuid(workspaceGuid);
        Set<Integer> questionIdsInQuizzes = quizRepository.findQuestionIdsInQuizzesByWorkspaceGuid(workspaceGuid);

        // Load logs only for questions in this workspace
        var questionIds = questions.stream().map(Question::getId).toList();
        var allLogs = questionStatsLogRepository.findByQuestionIdIn(questionIds);

        var items = questions.stream().map(q -> {
            var logs = allLogs.stream().filter(l -> l.getQuestionId().equals(q.getId())).toList();
            int skipped = (int) logs.stream()
                .filter(l -> "SKIPPED".equals(l.getEventType()) || "TIMEOUT".equals(l.getEventType()))
                .count();
            int timesAsked = (int) logs.stream()
                .filter(l -> "ANSWERED".equals(l.getEventType()) || "SKIPPED".equals(l.getEventType()) || "TIMEOUT".equals(l.getEventType()))
                .count();
            // Úspěšnost: podíl správných odpovědí (correct==true)
            long correct = logs.stream()
                .filter(l -> "ANSWERED".equals(l.getEventType()) && isCorrectAnswer(l.getEventDetail()))
                .count();
            int successRate = timesAsked > 0 ? (int) Math.round(100.0 * correct / timesAsked) : 0;
            // Average time: diff between STARTED and ANSWERED for the same attempt
            var answeredLogs = logs.stream().filter(l -> "ANSWERED".equals(l.getEventType())).toList();
            var startedLogs = logs.stream().filter(l -> "STARTED".equals(l.getEventType())).toList();
            int averageTime = (int) Math.round(
                answeredLogs.stream()
                    .flatMapToLong(answered ->
                        startedLogs.stream()
                            .filter(s -> Objects.equals(s.getAttemptId(), answered.getAttemptId())
                                    && Objects.equals(s.getQuestionId(), answered.getQuestionId())
                                    && s.getCreatedAt().isBefore(answered.getCreatedAt()))
                            .max(Comparator.comparing(s -> s.getCreatedAt()))
                            .stream()
                            .mapToLong(started -> Duration.between(started.getCreatedAt(), answered.getCreatedAt()).getSeconds())
                            .filter(diff -> diff > 0)
                    )
                    .average()
                    .orElse(0)
            );

            var stats = new QuestionStats(timesAsked, successRate, averageTime, skipped);
            return QuestionListItem.from(q, questionIdsInQuizzes.contains(q.getId()), stats);
        }).toList();

        return ResponseEntity.ok(items);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> getWorkspaceQuestion(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(questionRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).map(QuestionResponse::from));
    }

    @Transactional
    @PostMapping
    public ResponseEntity<IdResponse> createWorkspaceQuestion(
            @PathVariable String workspaceGuid,
            @Valid @RequestBody QuestionRequest request) {
        workspaceGuard.requireExists(workspaceGuid);

        var question = request.toEntity(workspaceGuid);
        embedBestEffort(question);
        var created = questionRepository.save(question);
        return ResponseEntity.ok(new IdResponse(created.getId()));
    }

    @Transactional
    @PatchMapping("/{id}")
    public ResponseEntity<IdResponse> updateWorkspaceQuestion(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id,
            @Valid @RequestBody QuestionRequest request) {
        workspaceGuard.requireExists(workspaceGuid);

        return questionRepository.findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(existing -> {
                var question = request.toEntity(workspaceGuid);
                question.setId(existing.getId());
                embedBestEffort(question);
                questionRepository.save(question);
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspaceQuestion(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        int deleted = questionRepository.deleteByIdAndWorkspaceGuid(id, workspaceGuid);
        return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    QuestionStats toQuestionStats(List<cz.scrumdojo.quizmaster.question.QuestionStatsLog> logs) {
        int skipped = (int) logs.stream()
            .filter(log -> "SKIPPED".equals(log.getEventType()) || "TIMEOUT".equals(log.getEventType()))
            .count();
        int timesAsked = (int) logs.stream()
            .filter(log -> "ANSWERED".equals(log.getEventType()) || "SKIPPED".equals(log.getEventType()) || "TIMEOUT".equals(log.getEventType()))
            .count();
        long correct = logs.stream()
            .filter(log -> "ANSWERED".equals(log.getEventType()) && isCorrectAnswer(log.getEventDetail()))
            .count();
        int successRate = timesAsked > 0 ? (int) Math.round(100.0 * correct / timesAsked) : 0;
        int averageTime = 0; // not yet implemented — needs per-question start time logging
        return new QuestionStats(timesAsked, successRate, averageTime, skipped);
    }

    private boolean isCorrectAnswer(String eventDetail) {
        if (eventDetail == null) return false;
        try {
            return objectMapper.readTree(eventDetail).path("correct").asBoolean(false);
        } catch (Exception e) {
            return false;
        }
    }

    private void embedBestEffort(Question question) {
        try {
            questionEmbeddingService.embedForSave(question);
        } catch (RuntimeException e) {
            log.warn("Embedding failed for question, saving without embedding", e);
            question.setEmbedding(null);
            question.setEmbeddingModel(null);
            question.setEmbeddingTextHash(null);
        }
    }
}
