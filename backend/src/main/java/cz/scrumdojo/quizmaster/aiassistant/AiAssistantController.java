package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.workspace.WorkspaceKey;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/ai-assistant", "/api/workspaces/{workspaceGuid}/ai-assistant"})
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final WorkspaceRepository workspaceRepository;

    public AiAssistantController(AiAssistantService aiAssistantService, WorkspaceRepository workspaceRepository) {
        this.aiAssistantService = aiAssistantService;
        this.workspaceRepository = workspaceRepository;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> generate(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @RequestBody AiAssistantRequest request) {
        String workspaceGuid = requireCanUseAiAssistant(pathWorkspaceGuid, workspaceKey);
        return ResponseEntity.ok(aiAssistantService.generateQuestion(
            request.question(),
            request.questionType(),
            workspaceGuid,
            request.excludedQuestionId()
        ));
    }

    @PostMapping("/batch")
    public ResponseEntity<QuestionResponse[]> generateBatch(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @RequestBody AiAssistantRequest request) {
        String workspaceGuid = requireCanUseAiAssistant(pathWorkspaceGuid, workspaceKey);
        return ResponseEntity.ok(aiAssistantService.generateQuestions(request.question(), request.questionType(), workspaceGuid));
    }

    private String requireCanUseAiAssistant(String pathWorkspaceGuid, String workspaceKey) {
        String workspaceGuid = pathWorkspaceGuid == null
            ? WorkspaceKey.require(workspaceKey)
            : WorkspaceKey.require(pathWorkspaceGuid);
        if (!workspaceRepository.existsById(workspaceGuid)) {
            throw WorkspaceKey.notFound();
        }
        return workspaceGuid;
    }
}
