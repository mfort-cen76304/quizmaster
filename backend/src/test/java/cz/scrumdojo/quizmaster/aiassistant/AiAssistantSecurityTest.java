package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Disabled("Security foundation production code not implemented yet")
public class AiAssistantSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void aiAssistantRequiresAuthentication() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/ai-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content(emptyAiRequest(workspace)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void nonMemberCannotUseAiAssistant() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/ai-assistant")
                .with(fixtures.outsider())
                .contentType(MediaType.APPLICATION_JSON)
                .content(emptyAiRequest(workspace)))
            .andExpect(status().isForbidden());
    }

    @Test
    public void viewerCannotUseAiAssistant() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/ai-assistant")
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(emptyAiRequest(workspace)))
            .andExpect(status().isForbidden());
    }

    @Test
    public void editorCanReachAiAssistantValidation() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/ai-assistant")
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(emptyAiRequest(workspace)))
            .andExpect(status().isBadRequest());
    }

    private static String emptyAiRequest(Workspace workspace) {
        return """
            {
                "workspaceGuid": "%s",
                "question": "   ",
                "questionType": "single"
            }
            """.formatted(workspace.getGuid());
    }
}
