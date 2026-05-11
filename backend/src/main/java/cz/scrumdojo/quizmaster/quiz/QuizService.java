package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
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
        return quizRepository.findById(id).map(quiz -> toQuizResponse(quiz, loadQuestions(quiz)));
    }

    public Optional<QuizResponse> getWorkspaceQuiz(String workspaceGuid, Integer id) {
        return quizRepository.findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(quiz -> toQuizResponse(quiz, loadQuestions(quiz)));
    }

    public Optional<QuizMetadataResponse> getTakeQuiz(Integer id) {
        return quizRepository.findById(id).map(QuizService::toQuizMetadataResponse);
    }

    public Optional<QuizTakeResponse> getTakeQuizForAttempt(Integer quizId, int[] questionIds) {
        return quizRepository.findById(quizId)
            .map(quiz -> toQuizTakeResponse(quiz, loadQuestions(questionIds)));
    }

    private QuizResponse toQuizResponse(Quiz quiz, List<Question> questions) {
        QuestionResponse[] questionResponses = questions.stream()
            .map(QuestionResponse::from)
            .toArray(QuestionResponse[]::new);

        String[] cohortNames = quiz.getCohorts() == null
            ? new String[0]
            : quiz.getCohorts().stream().map(Cohort::getName).toArray(String[]::new);

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
            quiz.getRandomQuestionCount(),
            cohortNames
        );
    }

    private static QuizMetadataResponse toQuizMetadataResponse(Quiz quiz) {
        int total = quiz.getQuestionIds() == null ? 0 : quiz.getQuestionIds().length;
        Integer randomCount = quiz.getRandomQuestionCount();
        int questionCount = (randomCount != null && randomCount > 0) ? Math.min(randomCount, total) : total;

        return new QuizMetadataResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getStartAt(),
            quiz.getEndAt(),
            quiz.getMode(),
            quiz.getDifficulty(),
            quiz.getPassScore(),
            quiz.getTimeLimit(),
            quiz.getRandomQuestionCount(),
            questionCount
        );
    }

    public List<Question> selectQuestions(Quiz quiz) {
        List<Question> questions = new ArrayList<>(loadQuestions(quiz));

        Integer randomCount = quiz.getRandomQuestionCount();
        if (randomCount != null && randomCount > 0 && !questions.isEmpty()) {
            Collections.shuffle(questions);
            questions = questions.subList(0, Math.min(randomCount, questions.size()));
        }

        return questions;
    }

    public List<Question> loadQuestions(Quiz quiz) {
        return loadQuestions(quiz.getQuestionIds());
    }

    public List<Question> loadQuestions(int[] questionIds) {
        if (questionIds == null) {
            return List.of();
        }

        List<Integer> ids = Arrays.stream(questionIds).boxed().toList();
        Map<Integer, Question> questionsById = questionRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Question::getId, Function.identity()));
        return ids.stream()
            .map(questionsById::get)
            .filter(Objects::nonNull)
            .toList();
    }

    private QuizTakeResponse toQuizTakeResponse(Quiz quiz, List<Question> questions) {
        QuestionTakeResponse[] questionResponses = questions.stream()
            .map(QuestionTakeResponse::from)
            .toArray(QuestionTakeResponse[]::new);

        return new QuizTakeResponse(
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
}
