package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.aiassistant.QuestionEmbeddingService;
import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionRequest;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/questions")
public class WorkspaceQuestionController {

    private final WorkspaceGuard workspaceGuard;
    private final QuestionRepository questionRepository;
    private final QuestionEmbeddingService questionEmbeddingService;

    public WorkspaceQuestionController(
        WorkspaceGuard workspaceGuard,
        QuestionRepository questionRepository,
        QuestionEmbeddingService questionEmbeddingService
    ) {
        this.workspaceGuard = workspaceGuard;
        this.questionRepository = questionRepository;
        this.questionEmbeddingService = questionEmbeddingService;
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
