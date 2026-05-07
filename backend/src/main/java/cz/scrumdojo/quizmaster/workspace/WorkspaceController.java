package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsResponse;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizStatsService quizStatsService;

    public WorkspaceController(
            WorkspaceRepository workspaceRepository,
            QuestionRepository questionRepository,
            QuizRepository quizRepository,
            QuizStatsService quizStatsService) {
        this.workspaceRepository = workspaceRepository;
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.quizStatsService = quizStatsService;
    }

    @PostMapping
    public ResponseEntity<WorkspaceCreateResponse> saveWorkspace(@Valid @RequestBody WorkspaceRequest request) {
        var createdWorkspace = workspaceRepository.save(request.toEntity());
        return ResponseEntity.ok(new WorkspaceCreateResponse(createdWorkspace.getGuid()));
    }

    @GetMapping("/{workspaceGuid}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(@PathVariable String workspaceGuid) {
        return ResponseHelper.okOrNotFound(workspaceRepository.findById(workspaceGuid).map(WorkspaceResponse::from));
    }

    @Transactional(readOnly = true)
    @GetMapping("/{workspaceGuid}/questions")
    public ResponseEntity<List<QuestionListItem>> getWorkspaceQuestions(@PathVariable String workspaceGuid) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        List<Question> questions = questionRepository.findByWorkspaceGuid(workspaceGuid);
        Set<Integer> questionIdsInQuizzes = quizRepository.findQuestionIdsInQuizzesByWorkspaceGuid(workspaceGuid);

        var items = questions.stream()
            .map(q -> QuestionListItem.from(q, questionIdsInQuizzes.contains(q.getId())))
            .toList();

        return ResponseEntity.ok(items);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{workspaceGuid}/quizzes")
    public ResponseEntity<List<QuizListItem>> getWorkspaceQuizzes(@PathVariable String workspaceGuid) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        List<Quiz> quizzes = quizRepository.findByWorkspaceGuid(workspaceGuid);

        var items = quizzes.stream()
            .map(quiz -> new QuizListItem(quiz.getId(), quiz.getTitle()))
            .toList();

        return ResponseEntity.ok(items);
    }

    @GetMapping("/{workspaceGuid}/quizzes/{id}/stats")
    public ResponseEntity<QuizStatsResponse> getQuizStats(
            @PathVariable String workspaceGuid,
            @PathVariable Integer id) {
        if (!workspaceRepository.existsById(workspaceGuid))
            return ResponseEntity.notFound().build();

        return ResponseHelper.okOrNotFound(quizStatsService.getStats(workspaceGuid, id));
    }
}
