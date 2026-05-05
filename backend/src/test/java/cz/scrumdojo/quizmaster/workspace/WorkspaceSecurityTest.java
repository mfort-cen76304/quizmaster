package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import org.junit.jupiter.api.Disabled;
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
@Disabled("Security foundation production code not implemented yet")
public class WorkspaceSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void workspaceApisRequireAuthentication() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(workspaceJson("Private Training")))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/workspaces/{guid}", workspace.getGuid()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/workspaces/{guid}/questions", workspace.getGuid()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes", workspace.getGuid()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void nonMemberCannotReadWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(get("/api/workspaces/{guid}", workspace.getGuid())
                .with(fixtures.outsider()))
            .andExpect(status().isForbidden());
    }

    @Test
    public void viewerCanReadWorkspaceContentAndStats() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(get("/api/workspaces/{guid}", workspace.getGuid())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/workspaces/{guid}/questions", workspace.getGuid())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk());
    }

    @Test
    public void viewerCannotWriteWorkspaceContent() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Can a viewer create questions?")))
            .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Viewer Quiz", workspace.getGuid(), question.getId())))
            .andExpect(status().isForbidden());
    }

    @Test
    public void workspaceCreatorCanReadCreatedWorkspaceButOutsiderCannot() throws Exception {
        var result = mockMvc.perform(post("/api/workspaces")
                .with(fixtures.workspaceCreator())
                .contentType(MediaType.APPLICATION_JSON)
                .content(workspaceJson("Private Training")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guid").isNotEmpty())
            .andReturn();

        String guid = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.guid");

        mockMvc.perform(get("/api/workspaces/{guid}", guid)
                .with(fixtures.workspaceCreator()))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/workspaces/{guid}", guid)
                .with(fixtures.outsider()))
            .andExpect(status().isForbidden());
    }

    private static String workspaceJson(String title) {
        return """
            {"title": "%s"}
            """.formatted(title);
    }

    private static String questionJson(String question) {
        return """
            {
                "question": "%s",
                "answers": ["A", "B"],
                "correctAnswers": [0],
                "explanations": ["Yes", "No"],
                "isEasy": false,
                "questionType": "single"
            }
            """.formatted(question);
    }

    private static String quizJson(String title, String workspaceGuid, Integer questionId) {
        return """
            {
                "title": "%s",
                "description": "Security test",
                "questionIds": [%d],
                "mode": "learn",
                "passScore": 80,
                "workspaceGuid": "%s",
                "randomQuestionCount": 1
            }
            """.formatted(title, questionId, workspaceGuid);
    }
}
