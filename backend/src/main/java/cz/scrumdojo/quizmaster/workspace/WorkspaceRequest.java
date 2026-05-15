package cz.scrumdojo.quizmaster.workspace;

import jakarta.validation.constraints.NotBlank;

public record WorkspaceRequest(@NotBlank String title) {
    public Workspace toEntity() {
        return Workspace.builder().title(title).build();
    }
}
