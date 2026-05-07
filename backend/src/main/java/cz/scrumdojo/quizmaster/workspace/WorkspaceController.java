package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;

    public WorkspaceController(WorkspaceRepository workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }

    @PostMapping
    public ResponseEntity<WorkspaceCreateResponse> saveWorkspace(@Valid @RequestBody WorkspaceRequest request) {
        var createdWorkspace = workspaceRepository.save(request.toEntity());
        return ResponseEntity.ok(new WorkspaceCreateResponse(createdWorkspace.getGuid()));
    }

    @GetMapping("/{workspaceGuid}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(@PathVariable String workspaceGuid) {
        return ResponseHelper.okOrNotFound(workspaceRepository.findById(workspaceGuid).map(WorkspaceResponse::from));
    }
}
