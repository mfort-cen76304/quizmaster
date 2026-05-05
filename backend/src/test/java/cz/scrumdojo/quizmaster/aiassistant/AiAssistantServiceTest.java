package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionResponse;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

@SpringBootTest
public class AiAssistantServiceTest {

    @Autowired
    private AiAssistantService aiAssistantService;

    @Value("${ai.token:}")
    private String apiToken;

    @Tag("ai")
    @Test
    void generateSingleChoiceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about capital cities of Europe with 1 correct answer and 3 incorrect answers"
        );

        assertNotNull(response.question());
        assertFalse(response.question().isBlank());
        assertEquals(4, response.answers().length);
        assertEquals(1, response.correctAnswers().length);
    }

    @Tag("ai")
    @Test
    void generateMultipleChoiceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about European capitals with 2 correct answers and 2 incorrect answers"
        );

        assertNotNull(response.question());
        assertFalse(response.question().isBlank());
        assertEquals(4, response.answers().length);
        assertEquals(2, response.correctAnswers().length);
    }

    @Test
    void generateQuestionFailsOnEmptyPrompt() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("   "));
    }

    @Test
    void generateQuestionFailsOnUnknownQuestionType() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("Topic", "wat"));
    }

    @Tag("ai")
    @Test
    void generateSingleChoiceWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about capital cities and 2 incorrect answers",
            "single"
        );

        assertGeneralChoiceResponse(response);
        assertEquals(1, response.correctAnswers().length);
        assertEquals("single", response.questionType());
    }

    @Tag("ai")
    @Test
    void generateMultipleChoiceWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about European capitals with 2 correct answers and 2 incorrect answers",
            "multiple"
        );

        assertGeneralChoiceResponse(response);
        assertTrue(response.correctAnswers().length >= 2, "Expected at least 2 correct answers");
        assertEquals("multiple", response.questionType());
    }

    @Tag("ai")
    @Test
    void generateNumericalWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a numerical question about basic arithmetic",
            "numerical"
        );

        assertNotNull(response.question());
        assertFalse(response.question().isBlank());
        assertEquals(1, response.answers().length, "Numerical must have exactly 1 answer");
        assertDoesNotThrow(() -> Double.parseDouble(response.answers()[0].trim()));
        assertArrayEquals(new int[]{0}, response.correctAnswers());
        assertEquals("numerical", response.questionType());
    }

    @Tag("ai")
    @Test
    void generateMultipleCorrectAnswersWithSpecificCount() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a question on exoplanets. There must be exactly 2 correct answers and exactly 2 incorrect answers. Total: 4 answers."
        );

        assertFalse(response.question().isBlank());
        assertEquals(4, response.answers().length, "Expected exactly 4 answers");
        assertEquals(2, response.correctAnswers().length, "Expected exactly 2 correct answers");
    }

    @Tag("ai")
    @Test
    void generateSingleCorrectAnswerWithExactCount() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a question about European capitals. There must be exactly 1 correct answer and exactly 2 incorrect answers. Total: 3 answers."
        );

        assertFalse(response.question().isBlank());
        assertEquals(3, response.answers().length, "Expected exactly 3 answers");
        assertEquals(1, response.correctAnswers().length, "Expected exactly 1 correct answer");
    }

    @Tag("ai")
    @Test
    void generateSingleChoiceQuestionWithGeneralExpectedShape() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a single choice question about world geography. Return 4 answers total. Exactly 1 answer must be correct."
        );

        assertGeneralChoiceResponse(response);
        assertEquals(4, response.answers().length);
        assertEquals(1, response.correctAnswers().length);
    }

    @Tag("ai")
    @Test
    void generateMultipleChoiceQuestionWithGeneralExpectedShape() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a multiple choice question about world geography. Return 4 answers total. At least 2 answers must be correct."
        );

        assertGeneralChoiceResponse(response);
        assertEquals(4, response.answers().length);
        assertTrue(response.correctAnswers().length >= 2, "Expected at least 2 correct answers");
    }

    @Test
    void validateResponse_valid() {
        assertDoesNotThrow(() -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("What is 2+2?", new String[]{"4", "5"}, new int[]{0}, new String[]{"", ""}, null, null)
        ));
    }

    @Test
    void validateResponse_emptyQuestion() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("", new String[]{"4", "5"}, new int[]{0}, new String[]{"", ""}, null, null)
        ));
    }

    @Test
    void validateResponse_nullQuestion() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse(null, new String[]{"4", "5"}, new int[]{0}, new String[]{"", ""}, null, null)
        ));
    }

    @Test
    void validateResponse_tooFewAnswers() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("Question?", new String[]{"only one"}, new int[]{0}, new String[]{""}, null, null)
        ));
    }

    @Test
    void validateResponse_noCorrectAnswers() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("Question?", new String[]{"a", "b"}, new int[]{}, new String[]{"", ""}, null, null)
        ));
    }

    @Test
    void validateResponse_indexOutOfBounds() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("Question?", new String[]{"a", "b"}, new int[]{5}, new String[]{"", ""}, null, null)
        ));
    }

    @Test
    void validateResponse_negativeIndex() {
        assertThrows(ResponseStatusException.class, () -> AiAssistantService.validateResponse(
            new AiAssistantService.AssistantResponse("Question?", new String[]{"a", "b"}, new int[]{-1}, new String[]{"", ""}, null, null)
        ));
    }

    private static void assertGeneralChoiceResponse(QuestionResponse response) {
        assertNotNull(response.question());
        assertFalse(response.question().isBlank(), "Expected a non-empty question");
        assertNotNull(response.answers());
        assertTrue(response.answers().length >= 2, "Expected at least 2 answers");
        assertNotNull(response.correctAnswers());
        assertTrue(response.correctAnswers().length >= 1, "Expected at least 1 correct answer");
        assertNotNull(response.explanations());
        assertEquals(response.answers().length, response.explanations().length, "Expected one explanation slot per answer");

        for (int index : response.correctAnswers()) {
            assertTrue(index >= 0, "Expected non-negative correct answer indexes");
            assertTrue(index < response.answers().length, "Expected correct answer indexes to stay within answers array bounds");
        }
    }
}
