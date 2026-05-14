package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class QuizServiceTest {

    @Autowired
    private QuizService quizService;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void quizWithNoRandomizationReturnsAllQuestions() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).randomQuestionCount(null).build());

        QuizResponse response = quizService.getQuiz(quiz.getId()).orElseThrow();

        assertEquals(2, response.questions().length);
    }

    @Test
    public void adminQuizReturnsAllQuestionsWhenRandomQuestionCountIsSet() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Question q3 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3).randomQuestionCount(2).build());

        QuizResponse response = quizService.getQuiz(quiz.getId()).orElseThrow();

        assertEquals(3, response.questions().length);
    }

    @Test
    public void drawQuestionsWithRandomCountReturnsExactCount() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Question q3 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3).randomQuestionCount(2).build());

        List<Question> selected = quizService.drawQuestions(quiz);

        assertEquals(2, selected.size());
    }

    @Test
    public void drawQuestionsWithRandomCountReturnsSubsetOfPool() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Question q3 = fixtures.save(fixtures.question());
        Set<Integer> poolIds = Set.of(q1.getId(), q2.getId(), q3.getId());

        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3).randomQuestionCount(2).build());

        Set<Integer> selectedIds = quizService.drawQuestions(quiz).stream()
            .map(Question::getId)
            .collect(Collectors.toSet());
        assertTrue(poolIds.containsAll(selectedIds));
    }

    @Test
    public void nonExistentQuizReturnsEmpty() {
        Optional<QuizResponse> response = quizService.getQuiz(-1);

        assertTrue(response.isEmpty());
    }

    @Test
    public void quizWithMissingQuestionSkipsIt() {
        Question q1 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1).questionIds(new int[]{q1.getId(), -999}).randomQuestionCount(null).build());

        QuizResponse response = quizService.getQuiz(quiz.getId()).orElseThrow();

        assertEquals(1, response.questions().length);
        assertEquals(q1.getId(), response.questions()[0].id());
    }
}
