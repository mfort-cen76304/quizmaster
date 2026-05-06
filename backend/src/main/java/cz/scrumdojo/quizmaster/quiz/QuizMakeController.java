package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.workspace.WorkspaceKey;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspace/quizzes")
public class QuizMakeController {

    private final WorkspaceRepository workspaceRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizService quizService;

    public QuizMakeController(
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
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return ResponseHelper.okOrNotFound(quizService.getWorkspaceQuiz(guid, id));
    }

    @PostMapping
    public ResponseEntity<IdResponse> createQuiz(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @Valid @RequestBody QuizRequest request) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        validateQuestionsBelongToWorkspace(request.questionIds(), guid);

        Quiz output = quizRepository.save(request.toEntity(guid));
        return ResponseEntity.ok(new IdResponse(output.getId()));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<IdResponse> updateQuiz(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id,
            @Valid @RequestBody QuizRequest request) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return quizRepository.findByIdAndWorkspaceGuid(id, guid)
            .map(existing -> {
                validateQuestionsBelongToWorkspace(request.questionIds(), guid);
                Quiz quiz = request.toEntity(guid);
                quiz.setId(existing.getId());
                quizRepository.save(quiz);
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id) {
        String guid = WorkspaceKey.require(workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        if (quizRepository.findByIdAndWorkspaceGuid(id, guid).isEmpty())
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
