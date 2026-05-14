package cz.scrumdojo.quizmaster.attempt;

public record AttemptEvaluation(double totalPoints, int totalQuestions, int[] questionIds) {}
