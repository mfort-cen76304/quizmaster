package cz.scrumdojo.quizmaster.workspace;

public record QuestionListItem(Integer id, String question, Boolean isInAnyQuiz, String imageUrl, String[] tags) {}
