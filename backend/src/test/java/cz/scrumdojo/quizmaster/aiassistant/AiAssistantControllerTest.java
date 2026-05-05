package cz.scrumdojo.quizmaster.aiassistant;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AiAssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${ai.token:}")
    private String apiToken;

    @Tag("ai")
    @Test
    public void generateReturnsQuestionShape() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        mockMvc.perform(post("/api/ai-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "Generate a question about capital cities of Europe with 1 correct answer and 2 incorrect answers",
                        "questionType": "single"
                    }
"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").isNotEmpty())
            .andExpect(jsonPath("$.answers").isArray())
            .andExpect(jsonPath("$.answers.length()").value(3))
            .andExpect(jsonPath("$.correctAnswers").isArray())
            .andExpect(jsonPath("$.correctAnswers.length()").value(1))
            .andExpect(jsonPath("$.explanations").isArray())
            .andExpect(jsonPath("$.explanations.length()").value(3));
    }

    @Tag("ai")
    @Test
    public void generateReturnsQuestionShape_questionOnly() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        mockMvc.perform(post("/api/ai-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "question": "Generate a question about European geography with 1 correct answer and 3 incorrect answers",
                        "questionType": "single"
                    }
"""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").isNotEmpty())
            .andExpect(jsonPath("$.answers").isArray())
            .andExpect(jsonPath("$.answers.length()").value(4))
            .andExpect(jsonPath("$.correctAnswers").isArray())
            .andExpect(jsonPath("$.correctAnswers.length()").value(1))
            .andExpect(jsonPath("$.explanations").isArray())
            .andExpect(jsonPath("$.explanations.length()").value(4));
    }

    @Test
    public void emptyInputReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/ai-assistant")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"question": "   ", "questionType": "single"}
"""))
            .andExpect(status().isBadRequest());
    }
}
