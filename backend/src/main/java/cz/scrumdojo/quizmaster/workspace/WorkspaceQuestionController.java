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

import java.util.List;
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
            int timesAsked = (int) logs.stream().filter(l -> "ANSWERED".equals(l.getEventType()) || "SKIPPED".equals(l.getEventType())).count();
            int skipped = (int) logs.stream().filter(l -> "SKIPPED".equals(l.getEventType())).count();
            // Úspěšnost: podíl správných odpovědí (correct==true)
            long correct = logs.stream()
                .filter(l -> "ANSWERED".equals(l.getEventType()) && isCorrectAnswer(l.getEventDetail()))
                .count();
            int successRate = timesAsked > 0 ? (int) Math.round(100.0 * correct / timesAsked) : 0;
            // Průměrný čas odpovědi (pokud je v eventDetail)
            double avgTime = logs.stream()
                .filter(l -> "ANSWERED".equals(l.getEventType()) && l.getEventDetail() != null && l.getEventDetail().contains("answeredAt"))
                .mapToLong(l -> {
                    try {
                        // eventDetail: {"score":1,"answeredAt":"2026-05-12T12:34:56"}
                        String detail = l.getEventDetail();
                        int idx = detail.indexOf("\"answeredAt\":\"");
                        if (idx < 0) return 0L;
                        // Zde by bylo ideální mít i čas zadání otázky, ale není-li, ignoruj
                        return 0L;
                    } catch (Exception e) { return 0L; }
                }).filter(x -> x > 0).average().orElse(0);
            int averageTime = (int) Math.round(avgTime); // TODO: pokud bude čas k dispozici

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
