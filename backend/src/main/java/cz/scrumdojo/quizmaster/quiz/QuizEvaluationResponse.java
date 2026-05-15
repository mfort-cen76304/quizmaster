package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionEvaluationResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import java.util.List;
import java.util.stream.IntStream;

public record QuizEvaluationResponse(double score, int totalQuestions, QuestionEvaluationResponse[] questions) {
    public static QuizEvaluationResponse from(List<AttemptQuestion> rows, List<Question> orderedQuestions) {
        QuestionEvaluationResponse[] perQuestion = IntStream.range(0, orderedQuestions.size())
            .mapToObj(i ->
                QuestionEvaluationResponse.from(
                    rows.get(i).getStatus(),
                    QuestionResponse.feedbackFrom(orderedQuestions.get(i))
                )
            )
            .toArray(QuestionEvaluationResponse[]::new);
        return new QuizEvaluationResponse(AttemptQuestion.totalPoints(rows), rows.size(), perQuestion);
    }
}
