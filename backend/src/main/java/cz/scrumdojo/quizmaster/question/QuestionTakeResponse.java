package cz.scrumdojo.quizmaster.question;

public record QuestionTakeResponse(
    Integer id,
    String question,
    String[] answers,
    boolean isEasy,
    String imageUrl,
    String questionType,
    String[] tags,
    int correctAnswerCount,
    int requiredDecimalDigits
) {
    public static QuestionTakeResponse from(Question question) {
        var type = question.getQuestionType();
        var answers = "numerical".equals(type) ? new String[0] : question.getAnswers();
        var correctAnswers = question.getCorrectAnswers();
        return new QuestionTakeResponse(
            question.getId(),
            question.getQuestion(),
            answers,
            question.isEasy(),
            question.getImageUrl(),
            type,
            question.getTags(),
            correctAnswers != null ? correctAnswers.length : 0,
            "numerical".equals(type) ? requiredDecimalDigits(question) : 0
        );
    }

    private static int requiredDecimalDigits(Question question) {
        if (question.getAnswers() == null || question.getAnswers().length == 0 || question.getAnswers()[0] == null) {
            return 0;
        }
        var answer = question.getAnswers()[0];
        var dotIndex = answer.indexOf('.');
        return dotIndex == -1 ? 0 : Math.max(0, answer.length() - dotIndex - 1);
    }
}
