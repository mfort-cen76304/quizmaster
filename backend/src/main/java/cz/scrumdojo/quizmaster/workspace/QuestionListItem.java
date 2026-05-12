package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.question.Question;
import java.util.Arrays;
import java.util.List;

public record QuestionListItem(
    int id,
    String question,
    boolean isInAnyQuiz,
    String imageUrl,
    List<String> tags,
    QuestionStats stats
) {
    public static QuestionListItem from(Question question, boolean isInAnyQuiz, QuestionStats stats) {
        String[] tags = question.getTags();
        return new QuestionListItem(
            question.getId(),
            question.getQuestion(),
            isInAnyQuiz,
            question.getImageUrl(),
            tags == null ? List.of() : Arrays.asList(tags),
            stats
        );
    }
}
