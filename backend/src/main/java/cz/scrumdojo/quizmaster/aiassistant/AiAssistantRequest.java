package cz.scrumdojo.quizmaster.aiassistant;

public record AiAssistantRequest(String question, String questionType, String workspaceGuid, Integer excludedQuestionId) {
    public AiAssistantRequest(String question, String questionType) {
        this(question, questionType, null, null);
    }

    public AiAssistantRequest(String question, String questionType, String workspaceGuid) {
        this(question, questionType, workspaceGuid, null);
    }
}
