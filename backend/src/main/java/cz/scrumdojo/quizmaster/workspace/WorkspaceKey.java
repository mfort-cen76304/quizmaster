package cz.scrumdojo.quizmaster.workspace;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class WorkspaceKey {
    public static final String HEADER = "X-Workspace-Key";

    private WorkspaceKey() {}

    public static String require(String value) {
        if (value == null || value.isBlank()) {
            throw notFound();
        }
        return value;
    }

    public static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
}
