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

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/quizzes")
public class WorkspaceQuizController {

    private final WorkspaceGuard workspaceGuard;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizService quizService;

    public WorkspaceQuizController(
            WorkspaceGuard workspaceGuard,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            QuizService quizService) {
        this.workspaceGuard = workspaceGuard;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizService = quizService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(quizService.getWorkspaceQuiz(workspaceGuid, id));
    }

    @Transactional
    @PostMapping
    public ResponseEntity<IdResponse> createQuiz(
            @PathVariable String workspaceGuid,
            @Valid @RequestBody QuizRequest request) {
        workspaceGuard.requireExists(workspaceGuid);

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
        workspaceGuard.requireExists(workspaceGuid);

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
        workspaceGuard.requireExists(workspaceGuid);

        int deleted = quizRepository.deleteByIdAndWorkspaceGuid(id, workspaceGuid);
        return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private void validateQuestionsBelongToWorkspace(int[] questionIds, String workspaceGuid) {
        if (questionIds == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz questions must belong to the workspace.");
        }
        if (questionIds.length == 0) {
            return;
        }

        Set<Integer> uniqueIds = Arrays.stream(questionIds).boxed().collect(Collectors.toSet());
        long matched = questionRepository.countByIdInAndWorkspaceGuid(uniqueIds, workspaceGuid);
        if (matched != uniqueIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz questions must belong to the workspace.");
        }
    }
}
