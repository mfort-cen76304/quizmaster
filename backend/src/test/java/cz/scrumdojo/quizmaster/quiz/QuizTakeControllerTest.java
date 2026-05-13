package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class QuizTakeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private AttemptRepository attemptRepository;

    @Test
    public void getQuizReturnsMetadataWithoutLeakingQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2)
            .workspaceGuid(workspace.getGuid())
            .startAt(LocalDateTime.of(2026, 4, 14, 10, 0))
            .endAt(LocalDateTime.of(2026, 4, 14, 23, 0))
            .randomQuestionCount(1)
            .build());

        mockMvc.perform(get("/api/quiz/{id}", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                {
                    "title": "Test Quiz",
                    "description": "Test Description",
                    "startAt": "2026-04-14T10:00:00",
                    "endAt": "2026-04-14T23:00:00",
                    "mode": "learn",
                    "passScore": 85,
                    "randomQuestionCount": 1,
                    "questionCount": 1
                }
                """))
            .andExpect(jsonPath("$.id").value(quiz.getId()))
            .andExpect(jsonPath("$.questions").doesNotExist());
    }

    @Test
    public void getQuizQuestionCountFallsBackToFullPoolWhenNoRandomSubset() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Question q3 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3)
            .workspaceGuid(workspace.getGuid())
            .randomQuestionCount(null)
            .build());

        mockMvc.perform(get("/api/quiz/{id}", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questionCount").value(3))
            .andExpect(jsonPath("$.questions").doesNotExist());
    }

    @Test
    public void getQuizNotFound() throws Exception {
        mockMvc.perform(get("/api/quiz/{id}", -1))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getQuizLeaderboardReturnsMockedCohortsWrappedInResponse() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1)
            .workspaceGuid(workspace.getGuid())
            .randomQuestionCount(null)
            .build());

        mockMvc.perform(get("/api/quiz/{id}/leaderboard", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                {
                    "cohorts": [
                        {"rank": 1, "cohort": "Team Rocket", "score": 92},
                        {"rank": 2, "cohort": "Scrum Ninjas", "score": 88},
                        {"rank": 3, "cohort": "Retro Masters", "score": 75}
                    ]
                }
                """));
    }

    @Test
    public void getQuizLeaderboardNotFound() throws Exception {
        mockMvc.perform(get("/api/quiz/{id}/leaderboard", -1))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createAttemptReturnsAttemptIdAndFrozenQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Question q3 = fixtures.save(fixtures.questionIn(workspace).question("Q3"));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3)
            .workspaceGuid(workspace.getGuid())
            .randomQuestionCount(2)
            .build());

        var result = mockMvc.perform(post("/api/quiz/{id}/attempts", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attemptId").isNumber())
            .andExpect(jsonPath("$.questions.length()").value(2))
            .andExpect(jsonPath("$.questions[0].id").isNumber())
            .andExpect(content().string(not(containsString("correctAnswers"))))
            .andExpect(content().string(not(containsString("explanations"))))
            .andExpect(content().string(not(containsString("workspaceGuid"))))
            .andReturn();

        Integer attemptId = JsonPath.read(result.getResponse().getContentAsString(), "$.attemptId");
        var attempt = attemptRepository.findById(attemptId).orElseThrow();
        assertThat(attempt.getQuestionIds()).hasSize(2);

        mockMvc.perform(get("/api/quiz/{id}/attempts/{attemptId}", quiz.getId(), attemptId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions.length()").value(2))
            .andExpect(jsonPath("$.questions[0].id").value(attempt.getQuestionIds()[0]))
            .andExpect(jsonPath("$.questions[1].id").value(attempt.getQuestionIds()[1]));
    }

    @Test
    public void createAttemptAcceptsOptionalCohortGuidAndIgnoresItForNow() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2)
            .workspaceGuid(workspace.getGuid())
            .randomQuestionCount(null)
            .build());

        var result = mockMvc.perform(post("/api/quiz/{id}/attempts", quiz.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "cohortGuid": "f5d8d75d-21b9-47c3-b1d7-d6b0da5a6f72"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attemptId").isNumber())
            .andReturn();

        Integer attemptId = JsonPath.read(result.getResponse().getContentAsString(), "$.attemptId");
        var attempt = attemptRepository.findById(attemptId).orElseThrow();

        assertThat(attempt.getCohortId()).isNull();
    }

    @Test
    public void recordTimeoutStampsServerSideTimestamp() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        var before = LocalDateTime.now();
        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", quiz.getId(), attempt.getId()))
            .andExpect(status().isNoContent());

        var stored = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(stored.getTimedOutAt()).isNotNull();
        assertThat(stored.getTimedOutAt()).isAfterOrEqualTo(before);
        assertThat(stored.getFinishedAt()).isNull();
    }

    @Test
    public void recordTimeoutOnFinishedAttemptReturnsConflict() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attempt(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", quiz.getId(), attempt.getId()))
            .andExpect(status().isConflict());

        assertThat(attemptRepository.findById(attempt.getId()).orElseThrow().getTimedOutAt()).isNull();
    }

    @Test
    public void recordTimeoutOnAttemptForDifferentQuizReturnsNotFound() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Quiz otherQuiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", otherQuiz.getId(), attempt.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void recordTimeoutForUnknownAttemptReturnsNotFound() throws Exception {
        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", -1, -1))
            .andExpect(status().isNotFound());
    }

    @Test
    public void evaluateQuizScoresPersistedAttemptQuestionsOnly() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace)
            .question("Which are cities in Italy?")
            .answers(new String[]{"Naples", "Rome", "Paris", "Berlin"})
            .correctAnswers(new int[]{0, 1})
            .explanations(new String[]{"Yes", "Yes", "No", "No"})
            .questionType("multiple"));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{q1.getId(), q2.getId()}));

        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/evaluate", quiz.getId(), attempt.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "questionIds": [%d, %d],
                        "answers": [
                            {"questionId": %d, "type": "choice", "selectedIdxs": [1]},
                            {"questionId": %d, "type": "choice", "selectedIdxs": [0]}
                        ]
                    }
                    """.formatted(q1.getId(), q2.getId(), q1.getId(), q2.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").value(1.5))
            .andExpect(jsonPath("$.totalQuestions").value(2))
            .andExpect(jsonPath("$.attempt.correctAnswers").value(1))
            .andExpect(jsonPath("$.attempt.partiallyCorrectAnswers").value(1))
            .andExpect(jsonPath("$.questions.length()").value(2))
            .andExpect(jsonPath("$.questions[0].correctAnswers[0]").value(1))
            .andExpect(jsonPath("$.questions[1].correctAnswers.length()").value(2))
            .andExpect(jsonPath("$.questions[0].workspaceGuid").doesNotExist());
    }

    @Test
    public void evaluateQuizRejectsQuestionIdsOutsidePersistedAttempt() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{q1.getId()}));

        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/evaluate", quiz.getId(), attempt.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "questionIds": [%d],
                        "answers": []
                    }
                    """.formatted(q2.getId())))
            .andExpect(status().isBadRequest());

        assertThat(attemptRepository.findById(attempt.getId()).orElseThrow().getQuestionIds())
            .containsExactly(q1.getId());
    }

    @Test
    public void evaluateQuizRejectsFinishedAttempt() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        var attempt = fixtures.save(fixtures.attempt(quiz)
            .questionIds(new int[]{question.getId()})
            .correctAnswers(1)
            .incorrectAnswers(0)
            .partiallyCorrectAnswers(0));

        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/evaluate", quiz.getId(), attempt.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "questionIds": [%d],
                        "answers": [
                            {"questionId": %d, "type": "choice", "selectedIdxs": [0]}
                        ]
                    }
                    """.formatted(question.getId(), question.getId())))
            .andExpect(status().isConflict());

        var storedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(storedAttempt.getCorrectAnswers()).isEqualTo(1);
        assertThat(storedAttempt.getIncorrectAnswers()).isEqualTo(0);
        assertThat(storedAttempt.getPartiallyCorrectAnswers()).isEqualTo(0);
    }

    @Test
    public void submitAttemptQuestionReturnsEvaluationForLearnQuizQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .workspaceGuid(workspace.getGuid())
            .mode(QuizMode.LEARN)
            .randomQuestionCount(null)
            .build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [1]}
                    """))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                {"correct": true, "score": 1.0}
                """))
            .andExpect(jsonPath("$.correctAnswers").doesNotExist());
    }

    @Test
    public void submitAttemptQuestionInExamReturnsScoreWithoutLeakingFeedback() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .workspaceGuid(workspace.getGuid())
            .mode(QuizMode.EXAM)
            .randomQuestionCount(null)
            .build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [1]}
                    """))
            .andExpect(status().isOk())
            .andExpect(content().json("""
                {"correct": true, "score": 1.0}
                """))
            .andExpect(jsonPath("$.question").doesNotExist());

        var storedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(storedAttempt.getCorrectAnswers()).isEqualTo(1);
        assertThat(storedAttempt.getIncorrectAnswers()).isEqualTo(0);
        assertThat(storedAttempt.getPartiallyCorrectAnswers()).isEqualTo(0);
    }

    @Test
    public void submitAttemptQuestionInExamRetakeOverwritesPriorOutcome() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .workspaceGuid(workspace.getGuid())
            .mode(QuizMode.EXAM)
            .randomQuestionCount(null)
            .build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [0]}
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [1]}
                    """))
            .andExpect(status().isOk());

        var storedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(storedAttempt.getCorrectAnswers()).isEqualTo(1);
        assertThat(storedAttempt.getIncorrectAnswers()).isEqualTo(0);
        assertThat(storedAttempt.getPartiallyCorrectAnswers()).isEqualTo(0);
    }

    @Test
    public void submitAttemptQuestionInLearnRetakePreservesFirstOutcome() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .workspaceGuid(workspace.getGuid())
            .mode(QuizMode.LEARN)
            .randomQuestionCount(null)
            .build());
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz).questionIds(new int[]{question.getId()}));

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [0]}
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type": "choice", "selectedIdxs": [1]}
                    """))
            .andExpect(status().isOk());

        var storedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(storedAttempt.getCorrectAnswers()).isEqualTo(0);
        assertThat(storedAttempt.getIncorrectAnswers()).isEqualTo(1);
        assertThat(storedAttempt.getPartiallyCorrectAnswers()).isEqualTo(0);
    }
}
