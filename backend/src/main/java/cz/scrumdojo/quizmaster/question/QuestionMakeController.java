package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.workspace.WorkspaceKey;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspace/questions")
public class QuestionMakeController {

    private final WorkspaceRepository workspaceRepository;
    private final QuestionRepository questionRepository;

    public QuestionMakeController(
            WorkspaceRepository workspaceRepository,
            QuestionRepository questionRepository) {
        this.workspaceRepository = workspaceRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> getWorkspaceQuestion(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return ResponseHelper.okOrNotFound(questionRepository.findByIdAndWorkspaceGuid(id, guid).map(QuestionResponse::from));
    }

    @Transactional
    @PostMapping
    public ResponseEntity<IdResponse> createWorkspaceQuestion(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @Valid @RequestBody QuestionRequest request) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        var created = questionRepository.save(request.toEntity(guid));
        return ResponseEntity.ok(new IdResponse(created.getId()));
    }

    @Transactional
    @PatchMapping("/{id}")
    public ResponseEntity<IdResponse> updateWorkspaceQuestion(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id,
            @Valid @RequestBody QuestionRequest request) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return questionRepository.findByIdAndWorkspaceGuid(id, guid)
            .map(existing -> {
                var question = request.toEntity(guid);
                question.setId(existing.getId());
                questionRepository.save(question);
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspaceQuestion(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return questionRepository.findByIdAndWorkspaceGuid(id, guid)
            .map(existing -> {
                questionRepository.deleteById(id);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
