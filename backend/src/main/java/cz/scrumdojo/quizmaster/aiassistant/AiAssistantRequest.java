package cz.scrumdojo.quizmaster.aiassistant;

public record AiAssistantRequest(String question, String questionType, String workspaceGuid) {
    public AiAssistantRequest(String question, String questionType) {
        this(question, questionType, null);
    }
}
