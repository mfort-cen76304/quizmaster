package cz.scrumdojo.quizmaster.question;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;

@Service
public class QuestionScoringService {
    private static final double FLOAT_EPSILON = 1e-9;

    public QuestionEvaluationResponse evaluate(Question question, QuestionAnswerRequest answer) {
        double score = score(question, answer);
        return new QuestionEvaluationResponse(score == 1, score, QuestionResponse.feedbackFrom(question));
    }

    public double score(Question question, QuestionAnswerRequest answer) {
        return "numerical".equals(question.getQuestionType())
            ? scoreNumerical(question, answer)
            : scoreChoice(question, answer);
    }

    private double scoreNumerical(Question question, QuestionAnswerRequest answer) {
        if (answer == null || answer.value() == null || question.getAnswers() == null || question.getAnswers().length == 0) {
            return 0;
        }
        double correct = Double.parseDouble(question.getAnswers()[0]);
        double tolerance = question.getTolerance() != null ? question.getTolerance() : 0;
        return Math.abs(answer.value() - correct) <= tolerance + FLOAT_EPSILON ? 1 : 0;
    }

    private double scoreChoice(Question question, QuestionAnswerRequest answer) {
        if (answer == null || answer.selectedIdxs() == null || answer.selectedIdxs().length == 0) {
            return 0;
        }

        var correct = question.getCorrectAnswers();
        if (correct == null || correct.length == 0) {
            return 0;
        }

        var correctSet = new HashSet<Integer>();
        Arrays.stream(correct).forEach(correctSet::add);
        var selectedSet = new HashSet<Integer>();
        Arrays.stream(answer.selectedIdxs()).forEach(selectedSet::add);

        int matched = 0;
        for (int selected : selectedSet) {
            if (correctSet.contains(selected)) matched++;
        }

        int missedCorrect = correct.length - matched;
        int selectedIncorrect = selectedSet.size() - matched;
        int mistakes = missedCorrect + selectedIncorrect;

        if (mistakes == 0) return 1;
        if (mistakes == 1) return 0.5;
        return 0;
    }
}
