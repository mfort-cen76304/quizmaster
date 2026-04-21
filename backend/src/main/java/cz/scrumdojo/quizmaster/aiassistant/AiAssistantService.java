package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;

@Service
public class AiAssistantService {

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiToken;
    private final String model;
    private final int maxTokens;
    private final String systemPrompt;

    public AiAssistantService(
        ObjectMapper objectMapper,
        @Value("${ai.token:}") String apiToken,
        @Value("${ai.model}") String model,
        @Value("${ai.max-tokens}") int maxTokens
    ) throws IOException {
        this.objectMapper = objectMapper;
        this.apiToken = apiToken.strip();
        this.model = model;
        this.maxTokens = maxTokens;
        this.httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        this.systemPrompt = new ClassPathResource("prompts/question-generation.md")
            .getContentAsString(StandardCharsets.UTF_8);
    }

    public AiAssistantResponse generateQuestion(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question must not be empty.");
        }
        if (apiToken == null || apiToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI token is not configured.");
        }

        try {
            String body = objectMapper.writeValueAsString(new ChatRequest(
                model,
                new Message[]{new Message("system", systemPrompt), new Message("user", prompt)},
                new ResponseFormat("json_object"),
                maxTokens
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_URL))
                .timeout(TIMEOUT)
                .header("Authorization", "Bearer " + apiToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
            AssistantResponse assistantResponse = objectMapper.readValue(content, AssistantResponse.class);
            validateResponse(assistantResponse);
            String[] explanations = normalizeExplanations(assistantResponse);

            return new AiAssistantResponse(
                assistantResponse.question(),
                assistantResponse.answers(),
                assistantResponse.correctAnswers(),
                explanations,
                assistantResponse.tolerance(),
                assistantResponse.questionExplanation()
            );
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
        }
    }

    static void validateResponse(AssistantResponse response) {
        if (response.question() == null || response.question().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: missing question.");
        }
        if (response.answers() == null || response.answers().length < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: need at least 2 answers.");
        }
        if (response.correctAnswers() == null || response.correctAnswers().length < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: need at least 1 correct answer.");
        }
        if (response.explanations() != null && response.explanations().length != response.answers().length) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: explanations length mismatch.");
        }
        boolean allInBounds = Arrays.stream(response.correctAnswers())
            .allMatch(i -> i >= 0 && i < response.answers().length);
        if (!allInBounds) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: correctAnswers index out of bounds.");
        }
    }

    private static String[] normalizeExplanations(AssistantResponse response) {
        if (response.explanations() == null) {
            return new String[response.answers().length];
        }
        if (response.explanations().length != response.answers().length) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: explanations length mismatch.");
        }
        return Arrays.stream(response.explanations())
            .map(e -> e == null ? "" : e)
            .toArray(String[]::new);
    }

    private record ChatRequest(String model, Message[] messages, @JsonProperty("response_format") ResponseFormat responseFormat, @JsonProperty("max_tokens") int maxTokens) {}

    private record ResponseFormat(String type) {}

    private record Message(String role, String content) {}

    record AssistantResponse(
        String question,
        String[] answers,
        int[] correctAnswers,
        String[] explanations,
        @JsonProperty("tolerance")
        Double tolerance,
        @JsonProperty("questionExplanation")
        String questionExplanation
    ) {}
}
