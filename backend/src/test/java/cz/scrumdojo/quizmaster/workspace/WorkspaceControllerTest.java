package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
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

    @Test
    public void getWorkspaceQuestionsNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/questions", "non-existent-guid"))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getWorkspaceQuizzesNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes", "non-existent-guid"))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getWorkspaceQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question1 = fixtures.save(fixtures.questionIn(workspace));
        Question question2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.quiz(question2).workspaceGuid(workspace.getGuid()).build();
        fixtures.save(quiz);

        mockMvc.perform(get("/api/workspaces/{guid}/questions", workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                [
                    {"id": %d, "isInAnyQuiz": false},
                    {"id": %d, "isInAnyQuiz": true}
                ]
                """.formatted(question1.getId(), question2.getId())));
    }

    @Test
    public void getWorkspaceQuizzes() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Quiz quiz1 = fixtures.save(fixtures.quizIn(workspace));
        Quiz quiz2 = fixtures.save(fixtures.quizIn(workspace));
        fixtures.save(fixtures.quiz()); // Quiz without workspace

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes", workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                [
                    {"id": %d, "title": "Test Quiz"},
                    {"id": %d, "title": "Test Quiz"}
                ]
                """.formatted(quiz1.getId(), quiz2.getId())));
    }
}
