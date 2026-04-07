package cz.scrumdojo.quizmaster.question;

public record QuestionResponse(
    Integer id,
    String question,
    String[] answers,
    String[] explanations,
    String questionExplanation,
    int[] correctAnswers,
    String workspaceGuid,
    boolean isEasy,
    String imageUrl,
    Double tolerance,
    String questionType,
    String[] tags
) {
    public static QuestionResponse from(Question q) {
        return new QuestionResponse(
            q.getId(), q.getQuestion(), q.getAnswers(), q.getExplanations(),
            q.getQuestionExplanation(), q.getCorrectAnswers(), q.getWorkspaceGuid(),
            q.isEasy(), q.getImageUrl(), q.getTolerance(), q.getQuestionType(), q.getTags()
        );
    }
}
