package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/question")
public class QuestionTakeController {

    private final QuestionRepository questionRepository;
    private final QuestionScoringService questionScoringService;
    private final QuizRepository quizRepository;

    public QuestionTakeController(
        QuestionRepository questionRepository,
        QuestionScoringService questionScoringService,
        QuizRepository quizRepository
    ) {
        this.questionRepository = questionRepository;
        this.questionScoringService = questionScoringService;
        this.quizRepository = quizRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionTakeResponse> getQuestion(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(questionRepository.findById(id).map(QuestionTakeResponse::from));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuestionEvaluationResponse> submitQuestion(
        @PathVariable Integer id,
        @RequestBody QuestionAnswerRequest request
    ) {
        if (quizRepository.existsQuizWithQuestionId(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseHelper.okOrNotFound(
            questionRepository.findById(id).map(question -> questionScoringService.evaluate(question, request))
        );
    }
}
