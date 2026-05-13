package cz.scrumdojo.quizmaster.workspace;
import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScore;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionScoreRepository;
import cz.scrumdojo.quizmaster.attempt.ScoreOutcome;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionStatsLog;
import cz.scrumdojo.quizmaster.question.QuestionStatsLogRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDateTime;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceQuizStatsTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private QuestionStatsLogRepository questionStatsLogRepository;
    @Autowired
    private AttemptQuestionScoreRepository attemptQuestionScoreRepository;
    @Test
    public void emptyStatsForQuizWithNoAttempts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "summary": { "started": 0, "finished": 0, "unfinished": 0, "timeout": 0 },
                        "attempts": []
                    }
                """));
    }
    @Test
    public void derivesSummaryAndAttemptFields() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attempt(quiz).correctAnswers(1).incorrectAnswers(1));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "attempts": [
                            {
                                "totalQuestions": 2,
                                "correctAnswers": 1,
                                "incorrectAnswers": 1,
                                "score": 50
                            }
                        ],
                        "summary": { "started": 1, "finished": 1 }
                    }
                    """));
    }
    @Test
    public void finishedAttemptHasStatusFinished() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attempt(quiz).correctAnswers(1));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {"attempts": [{"status": "FINISHED"}]}
                    """))
                .andExpect(jsonPath("$.attempts[0].durationSeconds").isNumber());
    }
    @Test
    public void timedOutAttemptHasStatusTimeout() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attemptTimedOut(quiz));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "attempts": [{"status": "TIMEOUT"}],
                        "summary": {"timeout": 1}
                    }
                    """));
    }
    @Test
    public void inProgressAttemptHasStatusInProgress() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attemptInProgress(quiz));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "attempts": [{"status": "IN_PROGRESS"}],
                        "summary": {"unfinished": 1}
                    }
                    """))
                .andExpect(jsonPath("$.attempts[0].durationSeconds").isEmpty());
    }
    @Test
    public void abandonedAttemptHasStatusAbandoned() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attemptAbandoned(quiz));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "attempts": [{"status": "ABANDONED"}],
                        "summary": {"unfinished": 1}
                    }
                    """));
    }
    @Test
    public void dryRunAttemptsAreExcludedFromStats() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build());
        fixtures.save(fixtures.attempt(quiz).correctAnswers(1));
        fixtures.save(fixtures.attempt(quiz).correctAnswers(0).incorrectAnswers(1).isDryRun(true));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                        "summary": { "started": 1, "finished": 1 },
                        "attempts": [{ "correctAnswers": 1 }]
                    }
                """))
                .andExpect(jsonPath("$.attempts.length()").value(1));
    }
    @Test
    public void questionStatisticsAreSeparatedForEachQuiz() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question shared = fixtures.save(fixtures.questionIn(workspace).question("Which are planets in solar system?"));
        Question skipped = fixtures.save(fixtures.questionIn(workspace).question("What is the capital of Italy?"));
        Question timeout = fixtures.save(fixtures.questionIn(workspace).question("What color is the sky?"));
        Question correct = fixtures.save(fixtures.questionIn(workspace).question("What is 2 + 2?"));
        Quiz firstQuiz = fixtures.save(fixtures.quiz(shared, skipped, timeout)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .build());
        Quiz secondQuiz = fixtures.save(fixtures.quiz(shared, correct)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .build());
        LocalDateTime now = LocalDateTime.now();
        Attempt firstQuizTimeoutAttempt = fixtures.save(fixtures.attempt(firstQuiz)
                .questionIds(new int[]{shared.getId(), skipped.getId(), timeout.getId()})
                .correctAnswers(0)
                .partiallyCorrectAnswers(1)
                .incorrectAnswers(0)
                .startedAt(now.minusSeconds(10))
                .finishedAt(now.minusSeconds(5))
                .timedOutAt(now.minusSeconds(5)));
        saveScore(firstQuizTimeoutAttempt, shared, ScoreOutcome.PARTIAL, now.minusSeconds(8));
        saveLog(firstQuizTimeoutAttempt, shared, firstQuiz, "ANSWERED");
        saveLog(firstQuizTimeoutAttempt, skipped, firstQuiz, "SKIPPED");
        saveLog(firstQuizTimeoutAttempt, timeout, firstQuiz, "TIMEOUT");
        Attempt firstQuizAbandonedAttempt = fixtures.save(fixtures.attemptAbandoned(firstQuiz)
                .questionIds(new int[]{shared.getId(), skipped.getId(), timeout.getId()})
                .correctAnswers(1)
                .partiallyCorrectAnswers(0)
                .incorrectAnswers(0)
                .startedAt(now.minusSeconds(4))
                .timedOutAt(now.minusSeconds(1)));
        saveScore(firstQuizAbandonedAttempt, shared, ScoreOutcome.CORRECT, now.minusSeconds(3));
        saveLog(firstQuizAbandonedAttempt, shared, firstQuiz, "ANSWERED");
        saveLog(firstQuizAbandonedAttempt, skipped, firstQuiz, "ABANDONED");
        saveLog(firstQuizAbandonedAttempt, timeout, firstQuiz, "ABANDONED");
        Attempt secondQuizFinishedAttempt = fixtures.save(fixtures.attempt(secondQuiz)
                .questionIds(new int[]{shared.getId(), correct.getId()})
                .correctAnswers(1)
                .partiallyCorrectAnswers(0)
                .incorrectAnswers(1)
                .startedAt(now.minusSeconds(20))
                .finishedAt(now.minusSeconds(12)));
        saveScore(secondQuizFinishedAttempt, shared, ScoreOutcome.INCORRECT, now.minusSeconds(18));
        saveScore(secondQuizFinishedAttempt, correct, ScoreOutcome.CORRECT, now.minusSeconds(14));
        saveLog(secondQuizFinishedAttempt, shared, secondQuiz, "ANSWERED");
        saveLog(secondQuizFinishedAttempt, correct, secondQuiz, "ANSWERED");
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), firstQuiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                      "questionStatistics": [
                        {
                          "question": "Which are planets in solar system?",
                          "shown": 2,
                          "answered": 2,
                          "skipped": 0,
                          "timeout": 0,
                          "abandoned": 0,
                          "correctAnswers": 1,
                          "partiallyCorrectAnswers": 1,
                          "incorrectAnswers": 0
                        },
                        {
                          "question": "What is the capital of Italy?",
                          "shown": 2,
                          "answered": 0,
                          "skipped": 1,
                          "timeout": 0,
                          "abandoned": 1,
                          "correctAnswers": 0,
                          "partiallyCorrectAnswers": 0,
                          "incorrectAnswers": 0
                        },
                        {
                          "question": "What color is the sky?",
                          "shown": 2,
                          "answered": 0,
                          "skipped": 0,
                          "timeout": 1,
                          "abandoned": 1,
                          "correctAnswers": 0,
                          "partiallyCorrectAnswers": 0,
                          "incorrectAnswers": 0
                        }
                      ]
                    }
                """));
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), secondQuiz.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                    {
                      "questionStatistics": [
                        {
                          "question": "Which are planets in solar system?",
                          "shown": 1,
                          "answered": 1,
                          "skipped": 0,
                          "timeout": 0,
                          "abandoned": 0,
                          "correctAnswers": 0,
                          "partiallyCorrectAnswers": 0,
                          "incorrectAnswers": 1
                        },
                        {
                          "question": "What is 2 + 2?",
                          "shown": 1,
                          "answered": 1,
                          "skipped": 0,
                          "timeout": 0,
                          "abandoned": 0,
                          "correctAnswers": 1,
                          "partiallyCorrectAnswers": 0,
                          "incorrectAnswers": 0
                        }
                      ]
                    }
                """));
    }
    @Test
    public void nonExistentQuizReturns404() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), -1))
                .andExpect(status().isNotFound());
    }
    @Test
    public void missingWorkspaceReturns404() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", "non-existent-guid", -1))
                .andExpect(status().isNotFound());
    }
    private void saveScore(Attempt attempt, Question question, ScoreOutcome scoreOutcome, LocalDateTime answeredAt) {
        attemptQuestionScoreRepository.save(AttemptQuestionScore.builder()
                .attemptId(attempt.getId())
                .questionId(question.getId())
                .score(scoreOutcome)
                .answeredAt(answeredAt)
                .build());
    }
    private void saveLog(Attempt attempt, Question question, Quiz quiz, String eventType) {
        questionStatsLogRepository.save(QuestionStatsLog.builder()
                .questionId(question.getId())
                .quizId(quiz.getId())
                .attemptId(attempt.getId())
                .eventType(eventType)
                .eventDetail("{}")
                .createdAt(LocalDateTime.now())
                .build());
    }
}
