package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiAssistantResponse(
    String question,
    String[] answers,
    int[] correctAnswers,
    String[] explanations,
    @JsonProperty("tolerance")
    Double tolerance,
    @JsonProperty("questionExplanation")
    String questionExplanation
) {
    public AiAssistantResponse(String question, String[] answers, int[] correctAnswers, String[] explanations) {
        this(question, answers, correctAnswers, explanations, null, null);
    }
}
