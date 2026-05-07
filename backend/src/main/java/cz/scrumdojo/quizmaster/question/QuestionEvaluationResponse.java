package cz.scrumdojo.quizmaster.question;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionEvaluationResponse(
    boolean correct,
    double score,
    QuestionResponse question
) {}
