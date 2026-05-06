package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRequest;
import cz.scrumdojo.quizmaster.attempt.AttemptResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionEvaluationResponse;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {

    private final QuizService quizService;
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final QuestionScoringService questionScoringService;

    public QuizTakeController(
            QuizService quizService,
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            QuestionScoringService questionScoringService) {
        this.quizService = quizService;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.questionScoringService = questionScoringService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizTakeResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizService.getTakeQuiz(id));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<?> createAttempt(
            @PathVariable Integer id,
            @RequestBody(required = false) AttemptRequest request) {
        return quizRepository.findById(id)
            .map(quiz -> {
                if (!QuizAvailability.isAvailable(quiz, LocalDateTime.now())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Quiz is not currently available."));
                }

                var selectedQuestionIds = quizService.selectQuestions(quiz).stream()
                    .mapToInt(Question::getId)
                    .toArray();
                var startedAt = request != null && request.startedAt() != null ? request.startedAt() : LocalDateTime.now();
                Attempt attempt = Attempt.builder()
                    .quizId(id)
                    .questionIds(selectedQuestionIds)
                    .startedAt(startedAt)
                    .correctAnswers(0)
                    .partiallyCorrectAnswers(0)
                    .incorrectAnswers(0)
                    .build();
                return ResponseEntity.ok(AttemptResponse.from(attemptRepository.save(attempt)));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/attempts/{attemptId}")
    public ResponseEntity<QuizTakeResponse> getAttemptQuiz(
            @PathVariable Integer id,
            @PathVariable Integer attemptId) {
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseHelper.okOrNotFound(quizService.getTakeQuizForAttempt(id, attempt.get().getQuestionIds()));
    }

    @PostMapping("/{id}/attempts/{attemptId}/submit")
    public ResponseEntity<QuizSubmitResponse> submitQuiz(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @RequestBody QuizSubmitRequest request) {
        var quiz = quizRepository.findById(id);
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var updatedAttempt = attempt.get();
        if (updatedAttempt.getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        var expectedQuestionIds = attempt.get().getQuestionIds();
        if (expectedQuestionIds == null || request.questionIds() == null || !Arrays.equals(expectedQuestionIds, request.questionIds())) {
            return ResponseEntity.badRequest().build();
        }

        var questionsById = quizService.loadQuestions(expectedQuestionIds).stream()
            .collect(Collectors.toMap(Question::getId, Function.identity()));
        var answerByQuestionId = request.answers() == null
            ? Map.<Integer, QuestionAnswerRequest>of()
            : Arrays.stream(request.answers())
                .filter(answer -> answer.questionId() != null)
                .collect(Collectors.toMap(QuestionAnswerRequest::questionId, Function.identity(), (left, right) -> right));

        int correct = 0;
        int partial = 0;
        int incorrect = 0;
        double score = 0;
        for (Integer questionId : expectedQuestionIds) {
            var question = questionsById.get(questionId);
            if (question == null) {
                return ResponseEntity.notFound().build();
            }
            double questionScore = questionScoringService.score(question, answerByQuestionId.get(questionId));
            score += questionScore;
            if (questionScore == 1) correct++;
            else if (questionScore == 0.5) partial++;
            else incorrect++;
        }

        updatedAttempt.setCorrectAnswers(correct);
        updatedAttempt.setPartiallyCorrectAnswers(partial);
        updatedAttempt.setIncorrectAnswers(incorrect);
        updatedAttempt.setFinishedAt(request.finishedAt() != null ? request.finishedAt() : LocalDateTime.now());
        if (request.timedOutAt() != null) {
            updatedAttempt.setTimedOutAt(request.timedOutAt());
        }

        var feedbackQuestions = Arrays.stream(expectedQuestionIds)
            .mapToObj(questionsById::get)
            .map(QuestionResponse::feedbackFrom)
            .toArray(QuestionResponse[]::new);

        return ResponseEntity.ok(new QuizSubmitResponse(
            AttemptResponse.from(attemptRepository.save(updatedAttempt)),
            score,
            expectedQuestionIds.length,
            feedbackQuestions
        ));
    }

    @PostMapping("/{id}/attempts/{attemptId}/questions/{questionId}/submit")
    public ResponseEntity<?> submitAttemptQuestion(
            @PathVariable Integer id,
            @PathVariable Integer attemptId,
            @PathVariable Integer questionId,
            @RequestBody QuestionAnswerRequest request) {
        var quiz = quizRepository.findById(id);
        var attempt = attemptRepository.findById(attemptId)
            .filter(existing -> Objects.equals(existing.getQuizId(), id));
        if (quiz.isEmpty() || attempt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (attempt.get().getFinishedAt() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        var expectedQuestionIds = attempt.get().getQuestionIds();
        if (expectedQuestionIds == null || Arrays.stream(expectedQuestionIds).noneMatch(expectedId -> Objects.equals(expectedId, questionId))) {
            return ResponseEntity.badRequest().build();
        }

        var question = quizService.loadQuestions(new int[]{questionId}).stream().findFirst();
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (quiz.get().getMode() == QuizMode.EXAM) {
            double score = questionScoringService.score(question.get(), request);
            var updatedAttempt = attempt.get();
            if (score == 1) updatedAttempt.setCorrectAnswers(updatedAttempt.getCorrectAnswers() + 1);
            else if (score == 0.5) updatedAttempt.setPartiallyCorrectAnswers(updatedAttempt.getPartiallyCorrectAnswers() + 1);
            else updatedAttempt.setIncorrectAnswers(updatedAttempt.getIncorrectAnswers() + 1);
            attemptRepository.save(updatedAttempt);
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(questionScoringService.evaluate(question.get(), request));
    }
}
