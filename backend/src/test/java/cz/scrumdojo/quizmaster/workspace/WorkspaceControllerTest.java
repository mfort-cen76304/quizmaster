package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void saveAndGetWorkspace() throws Exception {
        var result = mockMvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Test Workspace"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guid").isNotEmpty())
            .andReturn();

        String guid = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.guid");

        mockMvc.perform(get("/api/workspaces/{guid}", guid))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                {"guid": "%s", "title": "Test Workspace"}
                """.formatted(guid)));
    }

    @Test
    public void saveWorkspaceBlankTitleReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "  "}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void saveWorkspaceNullTitleReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void getWorkspaceNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}", "non-existent-guid"))
            .andExpect(status().isNotFound());
    }
}
