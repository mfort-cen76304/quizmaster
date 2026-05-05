package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.workspace.Workspace;
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
public class QuestionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void questionApisRequireAuthentication() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Unauthenticated create?")))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Unauthenticated update?")))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void nonMemberCannotReadQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .with(fixtures.outsider()))
            .andExpect(status().isForbidden());
    }

    @Test
    public void viewerCanReadQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(question.getId()));
    }

    @Test
    public void viewerCannotWriteQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Viewer create?")))
            .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Viewer update?")))
            .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isForbidden());
    }

    @Test
    public void editorCanWriteQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        var result = mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Editor create?")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer questionId = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(patch("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), questionId)
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(questionJson("Editor update?")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(questionId));

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), questionId)
                .with(fixtures.editorOf(workspace)))
            .andExpect(status().isNoContent());
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
}
