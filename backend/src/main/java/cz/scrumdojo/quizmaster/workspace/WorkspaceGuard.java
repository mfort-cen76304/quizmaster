package cz.scrumdojo.quizmaster.workspace;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class WorkspaceGuard {

    private final WorkspaceRepository workspaceRepository;

    public WorkspaceGuard(WorkspaceRepository workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }

    public void requireExists(String workspaceGuid) {
        if (!workspaceRepository.existsById(workspaceGuid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
