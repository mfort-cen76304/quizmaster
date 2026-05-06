package cz.scrumdojo.quizmaster.question;

public record QuestionEvaluationResponse(
    boolean correct,
    double score,
    QuestionResponse question
) {}
