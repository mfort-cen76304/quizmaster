package cz.scrumdojo.quizmaster.question;

public record QuestionResponse(
    Integer id,
    String question,
    String[] answers,
    String[] explanations,
    String questionExplanation,
    int[] correctAnswers,
    String workspaceGuid,
    boolean easyMode,
    String imageUrl,
    Double tolerance
) {
    public static QuestionResponse from(Question q) {
        return new QuestionResponse(
            q.getId(), q.getQuestion(), q.getAnswers(), q.getExplanations(),
            q.getQuestionExplanation(), q.getCorrectAnswers(), q.getWorkspaceGuid(),
            q.isEasyMode(), q.getImageUrl(), q.getTolerance()
        );
    }
}
