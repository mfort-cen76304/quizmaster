package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
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
public class QuizSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void quizApisRequireAuthentication() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Unauthenticated create?", workspace.getGuid(), question.getId())))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Unauthenticated update?", workspace.getGuid(), question.getId())))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void viewerCannotWriteQuizzes() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Viewer create?", workspace.getGuid(), question.getId())))
            .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                .with(fixtures.viewerOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Viewer update?", workspace.getGuid(), question.getId())))
            .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                .with(fixtures.viewerOf(workspace)))
            .andExpect(status().isForbidden());
    }

    @Test
    public void editorCanWriteQuizzes() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        var result = mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Editor create?", workspace.getGuid(), question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer quizId = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quizId)
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Editor update?", workspace.getGuid(), question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(quizId));

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quizId)
                .with(fixtures.editorOf(workspace)))
            .andExpect(status().isNoContent());
    }

    @Test
    public void createQuizRejectsQuestionFromAnotherWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question foreignQuestion = fixtures.save(fixtures.questionIn(otherWorkspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Foreign question", workspace.getGuid(), foreignQuestion.getId())))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void updateQuizRejectsQuestionFromAnotherWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Question foreignQuestion = fixtures.save(fixtures.questionIn(otherWorkspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                .with(fixtures.editorOf(workspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Foreign question update", workspace.getGuid(), foreignQuestion.getId())))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuizUsesPathWorkspaceOverRequestBodyWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", otherWorkspace.getGuid())
                .with(fixtures.editorOf(otherWorkspace))
                .contentType(MediaType.APPLICATION_JSON)
                .content(quizJson("Body workspace mismatch", workspace.getGuid(), question.getId())))
            .andExpect(status().isBadRequest());
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
