package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuizService(QuestionRepository questionRepository, QuizRepository quizRepository) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
    }

    public Optional<QuizResponse> getQuiz(Integer id) {
        return quizRepository.findById(id).map(this::toQuizResponse);
    }

    private QuizResponse toQuizResponse(Quiz quiz) {
        List<Question> questions = new ArrayList<>(loadQuestions(quiz));

        Integer randomCount = quiz.getRandomQuestionCount();
        if (randomCount != null && randomCount > 0 && !questions.isEmpty()) {
            Collections.shuffle(questions);
            questions = questions.subList(0, Math.min(randomCount, questions.size()));
        }

        QuestionResponse[] questionResponses = questions.stream()
            .map(QuestionResponse::from)
            .toArray(QuestionResponse[]::new);

        return new QuizResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getStartAt(),
            quiz.getEndAt(),
            questionResponses,
            quiz.getMode(),
            quiz.getDifficulty(),
            quiz.getPassScore(),
            quiz.getTimeLimit(),
            quiz.getRandomQuestionCount()
        );
    }

    private List<Question> loadQuestions(Quiz quiz) {
        List<Integer> ids = Arrays.stream(quiz.getQuestionIds()).boxed().toList();
        Map<Integer, Question> questionsById = questionRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Question::getId, Function.identity()));
        return ids.stream()
            .map(questionsById::get)
            .filter(Objects::nonNull)
            .toList();
    }
}
