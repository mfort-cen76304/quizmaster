package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.QuizRequest;
import cz.scrumdojo.quizmaster.quiz.QuizResponse;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/quizzes")
public class WorkspaceQuizController {

    private final WorkspaceRepository workspaceRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizService quizService;

    public WorkspaceQuizController(
            WorkspaceRepository workspaceRepository,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            QuizService quizService) {
        this.workspaceRepository = workspaceRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizService = quizService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        return ResponseHelper.okOrNotFound(quizService.getWorkspaceQuiz(workspaceGuid, id));
    }

    @PostMapping
    public ResponseEntity<IdResponse> createQuiz(
            @PathVariable String workspaceGuid,
            @Valid @RequestBody QuizRequest request) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        validateQuestionsBelongToWorkspace(request.questionIds(), workspaceGuid);

        Quiz output = quizRepository.save(request.toEntity(workspaceGuid));
        return ResponseEntity.ok(new IdResponse(output.getId()));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<IdResponse> updateQuiz(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id,
            @Valid @RequestBody QuizRequest request) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        return quizRepository.findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(existing -> {
                validateQuestionsBelongToWorkspace(request.questionIds(), workspaceGuid);
                Quiz quiz = request.toEntity(workspaceGuid);
                quiz.setId(existing.getId());
                quizRepository.save(quiz);
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        if (quizRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).isEmpty())
            return ResponseEntity.notFound().build();

        quizRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void validateQuestionsBelongToWorkspace(int[] questionIds, String workspaceGuid) {
        if (questionIds == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz questions must belong to the workspace.");
        }

        for (int questionId : questionIds) {
            if (questionRepository.findByIdAndWorkspaceGuid(questionId, workspaceGuid).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz questions must belong to the workspace.");
            }
        }
    }
}
