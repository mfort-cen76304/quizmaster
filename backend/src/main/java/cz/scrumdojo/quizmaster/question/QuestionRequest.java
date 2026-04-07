package cz.scrumdojo.quizmaster.question;

import jakarta.validation.constraints.NotBlank;

public record QuestionRequest(
    @NotBlank String question,
    String[] answers,
    int[] correctAnswers,
    String[] explanations,
    String questionExplanation,
    boolean isEasy,
    String imageUrl,
    String questionType,
    Double tolerance,
    String[] tags
) {
    public Question toEntity(String workspaceGuid) {
        return Question.builder()
            .question(question)
            .answers(answers)
            .correctAnswers(correctAnswers)
            .explanations(explanations)
            .questionExplanation(questionExplanation)
            .isEasy(isEasy)
            .workspaceGuid(workspaceGuid)
            .imageUrl(imageUrl)
            .tolerance(tolerance)
            .questionType(resolveQuestionType())
            .tags(tags != null ? tags : new String[0])
            .build();
    }

    private String resolveQuestionType() {
        if (questionType != null) return questionType;
        if (correctAnswers != null && correctAnswers.length >= 2) return "multiple";
        if (answers != null && answers.length == 1 && correctAnswers != null && correctAnswers.length == 1)
            return "numerical";
        return "single";
    }
}
