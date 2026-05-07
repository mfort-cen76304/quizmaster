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
public class WorkspaceQuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void getWorkspaceQuestionsNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/questions", "non-existent-guid"))
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
    public void getWorkspaceQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(question.getId()))
            .andExpect(jsonPath("$.question").value("What is the capital of Italy?"));
    }

    @Test
    public void getWorkspaceQuestionFromWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace2.getGuid(), question.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuestionInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        var result = mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
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
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer questionId = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), questionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(questionId));
    }

    @Test
    public void updateWorkspaceQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(patch("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
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

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").value("Updated question?"));
    }

    @Test
    public void updateQuestionInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(patch("/api/workspaces/{guid}/questions/{id}", workspace2.getGuid(), question.getId())
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

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuestionInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace2.getGuid(), question.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuestionBlankTextReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/workspaces/{guid}/questions", workspace.getGuid())
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
        mockMvc.perform(post("/api/workspaces/{guid}/questions", "non-existent-guid")
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

    @Test
    public void deleteQuestionReferencedByQuizLeavesDanglingReference() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(delete("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions.length()").value(0));
    }
}
