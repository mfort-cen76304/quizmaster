package cz.scrumdojo.quizmaster.question;

public record QuestionAnswerRequest(Integer questionId, String type, int[] selectedIdxs, Double value) {}
