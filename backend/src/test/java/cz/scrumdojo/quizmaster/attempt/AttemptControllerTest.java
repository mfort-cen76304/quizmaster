package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AttemptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void createAndGetAttempt() throws Exception {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));

        var result = mockMvc.perform(post("/api/attempt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "quizId": %d,
                        "startedAt": "2026-01-01T10:00:00"
                    }
                    """.formatted(quiz.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.quizId").value(quiz.getId()))
            .andExpect(jsonPath("$.correctAnswers").value(0))
            .andExpect(jsonPath("$.incorrectAnswers").value(0))
            .andReturn();

        Integer id = com.jayway.jsonpath.JsonPath
            .read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/attempt/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.quizId").value(quiz.getId()));
    }

    @Test
    public void createAttemptWhenQuizIsWithinAvailabilityWindow() throws Exception {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .startAt(LocalDateTime.now().minusDays(1))
            .endAt(LocalDateTime.now().plusDays(1))
            .build());

        mockMvc.perform(post("/api/attempt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "quizId": %d,
                        "startedAt": "2026-01-01T10:00:00"
                    }
                    """.formatted(quiz.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    public void createAttemptBeforeQuizAvailabilityWindowReturnsForbidden() throws Exception {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question)
            .startAt(LocalDateTime.now().plusDays(1))
            .endAt(LocalDateTime.now().plusDays(2))
            .build());

        mockMvc.perform(post("/api/attempt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "quizId": %d,
                        "startedAt": "2026-01-01T10:00:00"
                    }
                    """.formatted(quiz.getId())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Quiz is not currently available."));
    }

    @Test
    public void createAttemptForNonExistentQuizReturnsNotFound() throws Exception {
        mockMvc.perform(post("/api/attempt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "quizId": -1,
                        "startedAt": "2026-01-01T10:00:00"
                    }
                    """))
            .andExpect(status().isNotFound());
    }

    @Test
    public void patchAttemptAppliesTimingFieldsAndIgnoresCounterFields() throws Exception {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        mockMvc.perform(patch("/api/attempt/{id}", attempt.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "correctAnswers": 2,
                        "incorrectAnswers": 1,
                        "partiallyCorrectAnswers": 3,
                        "finishedAt": "2026-01-01T10:03:00",
                        "timedOutAt": "2026-01-01T10:02:00"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.correctAnswers").value(0))
            .andExpect(jsonPath("$.incorrectAnswers").value(0))
            .andExpect(jsonPath("$.partiallyCorrectAnswers").value(0))
            .andExpect(jsonPath("$.finishedAt").value("2026-01-01T10:03:00"))
            .andExpect(jsonPath("$.timedOutAt").value("2026-01-01T10:02:00"));
    }

    @Test
    public void getAttemptNotFound() throws Exception {
        mockMvc.perform(get("/api/attempt/{id}", -1))
            .andExpect(status().isNotFound());
    }
}
