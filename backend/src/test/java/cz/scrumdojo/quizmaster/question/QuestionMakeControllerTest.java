package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import cz.scrumdojo.quizmaster.workspace.WorkspaceKey;
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
public class QuestionMakeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void getWorkspaceQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(get("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(question.getId()))
            .andExpect(jsonPath("$.question").value("What is the capital of Italy?"));
    }

    @Test
    public void getWorkspaceQuestionFromWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(get("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace2.getGuid()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuestionInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/workspace/questions")
                .header(WorkspaceKey.HEADER, workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "What is the capital of Italy?",
                        "answers": ["Naples", "Rome", "Florence"],
                        "correctAnswers": [1],
                        "explanations": ["No", "Correct!", "No"],
                        "isEasy": false,
                        "questionType": "single"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    public void updateWorkspaceQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(patch("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "Updated question?",
                        "answers": ["A", "B"],
                        "correctAnswers": [0],
                        "explanations": ["Yes", "No"],
                        "isEasy": false,
                        "questionType": "single"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(question.getId()));

        mockMvc.perform(get("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").value("Updated question?"));
    }

    @Test
    public void updateQuestionInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(patch("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace2.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "Updated?",
                        "answers": ["A", "B"],
                        "correctAnswers": [0],
                        "explanations": ["Yes", "No"],
                        "isEasy": false,
                        "questionType": "single"
                    }
                    """))
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteWorkspaceQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(delete("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace.getGuid()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace.getGuid()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuestionInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(delete("/api/workspace/questions/{id}", question.getId())
                .header(WorkspaceKey.HEADER, workspace2.getGuid()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuestionBlankTextReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/workspace/questions")
                .header(WorkspaceKey.HEADER, workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "  ",
                        "answers": ["A", "B"],
                        "correctAnswers": [0],
                        "explanations": ["Yes", "No"],
                        "isEasy": false,
                        "questionType": "single"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuestionInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc.perform(post("/api/workspace/questions")
                .header(WorkspaceKey.HEADER, "non-existent-guid")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "Test?",
                        "answers": ["A", "B"],
                        "correctAnswers": [0],
                        "explanations": ["Yes", "No"],
                        "isEasy": false,
                        "questionType": "single"
                    }
                    """))
            .andExpect(status().isNotFound());
    }
}
