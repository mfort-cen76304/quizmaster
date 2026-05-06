package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.workspace.WorkspaceKey;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-assistant")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final WorkspaceRepository workspaceRepository;

    public AiAssistantController(AiAssistantService aiAssistantService, WorkspaceRepository workspaceRepository) {
        this.aiAssistantService = aiAssistantService;
        this.workspaceRepository = workspaceRepository;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> generate(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @RequestBody AiAssistantRequest request) {
        String workspaceGuid = requireCanUseAiAssistant(workspaceKey);
        return ResponseEntity.ok(aiAssistantService.generateQuestion(request.question(), request.questionType(), workspaceGuid));
    }

    @PostMapping("/batch")
    public ResponseEntity<QuestionResponse[]> generateBatch(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @RequestBody AiAssistantRequest request) {
        requireCanUseAiAssistant(workspaceKey);
        return ResponseEntity.ok(aiAssistantService.generateQuestions(request.question(), request.questionType()));
    }

    private String requireCanUseAiAssistant(String workspaceKey) {
        String workspaceGuid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(workspaceGuid)) {
            throw WorkspaceKey.notFound();
        }
        return workspaceGuid;
    }
}
