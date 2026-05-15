package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.question.Question;
import java.util.List;

public record AttemptStart(Attempt attempt, List<Question> drawnQuestions) {}
