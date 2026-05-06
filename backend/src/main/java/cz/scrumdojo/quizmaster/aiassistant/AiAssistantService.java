package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;

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
import java.util.List;
import java.util.Set;

@Service
public class AiAssistantService {

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_EXISTING_QUESTIONS = 50;

    static final Set<String> KNOWN_TYPES = Set.of("single", "multiple", "numerical");

    private final ObjectMapper objectMapper;
    private final QuestionRepository questionRepository;
    private final HttpClient httpClient;
    private final String apiToken;
    private final String model;
    private final int maxTokens;
    private final String singleChoicePrompt;
    private final String multipleChoicePrompt;
    private final String numericalPrompt;
    private final String singleChoiceBatchPrompt;
    private final String multipleChoiceBatchPrompt;
    private final String numericalBatchPrompt;

    public AiAssistantService(
        ObjectMapper objectMapper,
        QuestionRepository questionRepository,
        @Value("${ai.token:}") String apiToken,
        @Value("${ai.model}") String model,
        @Value("${ai.max-tokens}") int maxTokens
    ) throws IOException {
        this.objectMapper = objectMapper;
        this.questionRepository = questionRepository;
        this.apiToken = apiToken.strip();
        this.model = model;
        this.maxTokens = maxTokens;
        this.httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        this.singleChoicePrompt = loadPrompt("prompts/single-choice.md");
        this.multipleChoicePrompt = loadPrompt("prompts/multiple-choice.md");
        this.numericalPrompt = loadPrompt("prompts/numerical.md");
        this.singleChoiceBatchPrompt = loadPrompt("prompts/single-choice-batch.md");
        this.multipleChoiceBatchPrompt = loadPrompt("prompts/multiple-choice-batch.md");
        this.numericalBatchPrompt = loadPrompt("prompts/numerical-batch.md");
    }

    private static String loadPrompt(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }

    public QuestionResponse generateQuestion(String prompt, String questionType) {
        return generateQuestion(prompt, questionType, null);
    }

    public QuestionResponse generateQuestion(String prompt, String questionType, String workspaceGuid) {
        validatePromptAndToken(prompt);
        String resolvedType = resolveType(questionType);
        List<String> existingQuestions = existingWorkspaceQuestions(workspaceGuid);
        if (existingQuestions.isEmpty()) {
            AssistantResponse assistantResponse = requestAssistant(
                prompt,
                chooseSystemPrompt(resolvedType),
                AssistantResponse.class
            );
            validateForType(assistantResponse, resolvedType);
            return toDraftResponse(assistantResponse, normalizeExplanations(assistantResponse), resolvedType);
        }

        AssistantResponse assistantResponse = generateUniqueCandidate(prompt, resolvedType, existingQuestions, null);
        validateForType(assistantResponse, resolvedType);
        SimilarityCheck similarityCheck = checkSimilarity(assistantResponse.question(), existingQuestions);
        if (!similarityCheck.similar()) {
            return toDraftResponse(assistantResponse, normalizeExplanations(assistantResponse), resolvedType);
        }

        AssistantResponse retryResponse = generateUniqueCandidate(prompt, resolvedType, existingQuestions, similarityCheck);
        validateForType(retryResponse, resolvedType);
        SimilarityCheck retrySimilarityCheck = checkSimilarity(retryResponse.question(), existingQuestions);
        if (!retrySimilarityCheck.similar()) {
            return toDraftResponse(retryResponse, normalizeExplanations(retryResponse), resolvedType);
        }

        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "AI assistant could not generate a question that is different from existing workspace questions."
        );
    }

    public QuestionResponse[] generateQuestions(String prompt, String questionType) {
        validatePromptAndToken(prompt);
        String resolvedType = resolveType(questionType);
        AssistantBatchResponse assistantResponse = requestAssistant(
            prompt,
            chooseBatchSystemPrompt(resolvedType),
            AssistantBatchResponse.class
        );
        validateBatchResponses(assistantResponse.questions(), resolvedType);

        return Arrays.stream(assistantResponse.questions())
            .map(response -> toDraftResponse(response, normalizeExplanations(response), resolvedType))
            .toArray(QuestionResponse[]::new);
    }

    private void validatePromptAndToken(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question must not be empty.");
        }
        if (apiToken == null || apiToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI token is not configured.");
        }
    }

    private <T> T requestAssistant(String prompt, String systemPrompt, Class<T> responseType) {
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
            return objectMapper.readValue(content, responseType);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
        }
    }

    private List<String> existingWorkspaceQuestions(String workspaceGuid) {
        if (workspaceGuid == null || workspaceGuid.isBlank()) {
            return List.of();
        }

        return questionRepository.findByWorkspaceGuid(workspaceGuid.strip()).stream()
            .map(Question::getQuestion)
            .filter(question -> question != null && !question.isBlank())
            .map(String::strip)
            .limit(MAX_EXISTING_QUESTIONS)
            .toList();
    }

    private AssistantResponse generateUniqueCandidate(
        String prompt,
        String resolvedType,
        List<String> existingQuestions,
        SimilarityCheck retryFeedback
    ) {
        String systemPrompt = chooseSystemPrompt(resolvedType)
            + "\n\n"
            + uniquenessRule(existingQuestions, retryFeedback);
        return requestAssistant(prompt, systemPrompt, AssistantResponse.class);
    }

    private SimilarityCheck checkSimilarity(String generatedQuestion, List<String> existingQuestions) {
        SimilarityCheck response = requestAssistant(
            similarityPrompt(generatedQuestion, existingQuestions),
            """
                You are checking whether an AI-generated quiz question is too similar to existing workspace questions.
                Similar means the generated question tests the same knowledge, fact, or calculation as an existing question.
                The same broad topic is allowed when the concrete question is different.
                Respond only with JSON shaped as {"similar": false, "matchedQuestion": "", "reason": ""}.
                """,
            SimilarityCheck.class
        );

        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid similarity check.");
        }
        return new SimilarityCheck(
            response.similar(),
            response.matchedQuestion() == null ? "" : response.matchedQuestion(),
            response.reason() == null ? "" : response.reason()
        );
    }

    private static String uniquenessRule(List<String> existingQuestions, SimilarityCheck retryFeedback) {
        StringBuilder rule = new StringBuilder();
        rule.append("""
            Workspace uniqueness rule, which overrides any user request for an exact duplicate:
            Do not create a question that is similar to any existing workspace question.
            Similar means the generated question tests the same knowledge, fact, or calculation as an existing question.
            The same broad topic is allowed when the concrete question is different.
            Existing workspace questions:
            """);
        appendQuestionList(rule, existingQuestions);
        if (retryFeedback != null) {
            rule.append("\nYour previous draft was too similar to an existing question.\n");
            rule.append("Matched question: ").append(retryFeedback.matchedQuestion()).append("\n");
            rule.append("Reason: ").append(retryFeedback.reason()).append("\n");
            rule.append("Generate a clearly different question while still following the user's topic and answer-count request.\n");
        }
        return rule.toString();
    }

    private static String similarityPrompt(String generatedQuestion, List<String> existingQuestions) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generated question:\n");
        prompt.append(generatedQuestion == null ? "" : generatedQuestion.strip()).append("\n\n");
        prompt.append("Existing workspace questions:\n");
        appendQuestionList(prompt, existingQuestions);
        prompt.append("""

            Decide whether the generated question is similar to any existing question.
            Return JSON only with:
            {
              "similar": false,
              "matchedQuestion": "",
              "reason": ""
            }
            """);
        return prompt.toString();
    }

    private static void appendQuestionList(StringBuilder target, List<String> questions) {
        for (int i = 0; i < questions.size(); i++) {
            target.append(i + 1).append(". ").append(questions.get(i)).append("\n");
        }
    }

    private static String resolveType(String questionType) {
        if (questionType == null || questionType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "questionType is required.");
        }
        String normalized = questionType.trim().toLowerCase();
        if (!KNOWN_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown questionType: " + questionType);
        }
        return normalized;
    }

    private String chooseSystemPrompt(String resolvedType) {
        return switch (resolvedType) {
            case "single" -> singleChoicePrompt;
            case "multiple" -> multipleChoicePrompt;
            case "numerical" -> numericalPrompt;
            default -> throw new IllegalStateException("Unhandled questionType: " + resolvedType);
        };
    }

    private String chooseBatchSystemPrompt(String resolvedType) {
        return switch (resolvedType) {
            case "single" -> singleChoiceBatchPrompt;
            case "multiple" -> multipleChoiceBatchPrompt;
            case "numerical" -> numericalBatchPrompt;
            default -> throw new IllegalStateException("Unhandled questionType: " + resolvedType);
        };
    }

    private static void validateForType(AssistantResponse response, String resolvedType) {
        switch (resolvedType) {
            case "single" -> validateSingleChoiceResponse(response);
            case "multiple" -> validateMultipleChoiceResponse(response);
            case "numerical" -> validateNumericalResponse(response);
            default -> throw new IllegalStateException("Unhandled questionType: " + resolvedType);
        }
    }

    static void validateBatchResponses(AssistantResponse[] responses, String resolvedType) {
        if (responses == null || responses.length < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid batch response: need at least 1 question.");
        }
        for (AssistantResponse response : responses) {
            validateForType(response, resolvedType);
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

    static void validateSingleChoiceResponse(AssistantResponse response) {
        validateResponse(response);
        if (response.correctAnswers().length != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: single-choice must have exactly 1 correct answer.");
        }
    }

    static void validateMultipleChoiceResponse(AssistantResponse response) {
        validateResponse(response);
        if (response.correctAnswers().length < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: multiple-choice must have at least 2 correct answers.");
        }
    }

    static void validateNumericalResponse(AssistantResponse response) {
        if (response.question() == null || response.question().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: missing question.");
        }
        if (response.answers() == null || response.answers().length != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: numerical must have exactly 1 answer.");
        }
        if (response.answers()[0] == null || response.answers()[0].isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: numerical answer must not be empty.");
        }
        try {
            Double.parseDouble(response.answers()[0].trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: numerical answer must parse as a number.");
        }
        if (response.correctAnswers() == null || response.correctAnswers().length != 1 || response.correctAnswers()[0] != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: numerical correctAnswers must be [0].");
        }
        if (response.explanations() != null && response.explanations().length != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: numerical explanations length must be 1.");
        }
        if (response.tolerance() != null && response.tolerance() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned invalid response: tolerance must be non-negative.");
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

    private static QuestionResponse toDraftResponse(AssistantResponse assistantResponse, String[] explanations, String resolvedType) {
        return QuestionResponse.draft(
            assistantResponse.question(),
            assistantResponse.answers(),
            assistantResponse.correctAnswers(),
            explanations,
            assistantResponse.questionExplanation(),
            assistantResponse.tolerance(),
            resolvedType
        );
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

    record AssistantBatchResponse(AssistantResponse[] questions) {}

    private record SimilarityCheck(boolean similar, String matchedQuestion, String reason) {}
}
