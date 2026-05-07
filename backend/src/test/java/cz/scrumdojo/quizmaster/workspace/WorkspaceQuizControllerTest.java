package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceQuizControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Test
    public void createQuizInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        var result = mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "New Quiz",
                        "description": "A quiz",
                        "startAt": "2026-04-14T10:00",
                        "endAt": "2026-04-14T23:00",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer quizId = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quizId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(quizId))
            .andExpect(jsonPath("$.questions.length()").value(1));

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 10, 0));
        assertThat(savedQuiz.getEndAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 23, 0));
    }

    @Test
    public void getWorkspaceQuizReturnsAllQuestionsForRandomQuiz() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Question q3 = fixtures.save(fixtures.questionIn(workspace).question("Q3"));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3)
            .workspaceGuid(workspace.getGuid())
            .randomQuestionCount(2)
            .build());

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions.length()").value(3))
            .andExpect(jsonPath("$.questions[0].correctAnswers").exists());
    }

    @Test
    public void createQuizInWorkspaceWithOnlyStartDate() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "New Quiz",
                        "description": "A quiz",
                        "startAt": "2026-04-14T10:00",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 10, 0));
        assertThat(savedQuiz.getEndAt()).isNull();
    }

    @Test
    public void createQuizInWorkspaceWithOnlyEndDate() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "New Quiz",
                        "description": "A quiz",
                        "endAt": "2026-04-14T23:00",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isNull();
        assertThat(savedQuiz.getEndAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 23, 0));
    }

    @Test
    public void updateQuizInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Updated Quiz",
                        "description": "Updated description",
                        "startAt": "2026-04-15T08:30",
                        "endAt": "2026-04-15T18:00",
                        "questionIds": [%d],
                        "mode": "exam",
                        "passScore": 90,
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(quiz.getId()));

        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Updated Quiz"))
            .andExpect(jsonPath("$.startAt").value("2026-04-15T08:30:00"))
            .andExpect(jsonPath("$.endAt").value("2026-04-15T18:00:00"));
    }

    @Test
    public void updateQuizInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc.perform(put("/api/workspaces/{guid}/quizzes/{id}", workspace2.getGuid(), quiz.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Updated Quiz",
                        "description": "Updated",
                        "questionIds": [%d],
                        "mode": "exam",
                        "passScore": 90,
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId())))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuizBlankTitleReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "  ",
                        "description": "A quiz",
                        "questionIds": [],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 0
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuizRejectsQuestionFromAnotherWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question foreignQuestion = fixtures.save(fixtures.questionIn(otherWorkspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Foreign question",
                        "description": "Should fail",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 1
                    }
                    """.formatted(foreignQuestion.getId())))
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
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Foreign question update",
                        "description": "Should fail",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 1
                    }
                    """.formatted(foreignQuestion.getId())))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuizIgnoresRequestBodyWorkspaceGuid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace bodyWorkspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Body workspace mismatch",
                        "description": "Path workspace wins",
                        "questionIds": [%d],
                        "mode": "learn",
                        "passScore": 80,
                        "workspaceGuid": "%s",
                        "randomQuestionCount": 1
                    }
                    """.formatted(question.getId(), bodyWorkspace.getGuid())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        assertThat(latestQuiz().getWorkspaceGuid()).isEqualTo(workspace.getGuid());
    }

    @Test
    public void createQuizInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc.perform(post("/api/workspaces/{guid}/quizzes", "non-existent-guid")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Quiz",
                        "description": "A quiz",
                        "questionIds": [],
                        "mode": "learn",
                        "passScore": 80,
                        "randomQuestionCount": 0
                    }
                    """))
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuizFromWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/quiz/{id}", quiz.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuizAlsoCascadesAttempts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attempt(quiz));

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isNoContent());

        assertThat(attemptRepository.findById(attempt.getId())).isEmpty();
    }

    @Test
    public void deleteQuizInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc.perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace2.getGuid(), quiz.getId()))
            .andExpect(status().isNotFound());
    }

    private Quiz latestQuiz() {
        return quizRepository.findAll().stream()
            .max(Comparator.comparing(Quiz::getId))
            .orElseThrow();
    }
}
