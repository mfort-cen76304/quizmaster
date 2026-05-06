package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsResponse;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping({"/api/workspace", "/api/workspaces/{workspaceGuid}"})
public class WorkspaceHeaderController {
    private final WorkspaceRepository workspaceRepository;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizStatsService quizStatsService;

    public WorkspaceHeaderController(
            WorkspaceRepository workspaceRepository,
            QuestionRepository questionRepository,
            QuizRepository quizRepository,
            QuizStatsService quizStatsService) {
        this.workspaceRepository = workspaceRepository;
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.quizStatsService = quizStatsService;
    }

    @GetMapping
    public ResponseEntity<WorkspaceResponse> getWorkspace(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey) {
        String guid = workspaceGuid(pathWorkspaceGuid, workspaceKey);
        return ResponseHelper.okOrNotFound(workspaceRepository.findById(guid).map(WorkspaceResponse::from));
    }

    @Transactional(readOnly = true)
    @GetMapping("/questions")
    public ResponseEntity<List<QuestionListItem>> getWorkspaceQuestions(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey) {
        String guid = workspaceGuid(pathWorkspaceGuid, workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        List<Question> questions = questionRepository.findByWorkspaceGuid(guid);
        Set<Integer> questionIdsInQuizzes = quizRepository.findQuestionIdsInQuizzesByWorkspaceGuid(guid);

        var items = questions.stream()
            .map(q -> new QuestionListItem(q.getId(), q.getQuestion(), questionIdsInQuizzes.contains(q.getId()), q.getImageUrl(), q.getTags()))
            .toList();

        return ResponseEntity.ok(items);
    }

    @Transactional(readOnly = true)
    @GetMapping("/quizzes")
    public ResponseEntity<List<QuizListItem>> getWorkspaceQuizzes(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey) {
        String guid = workspaceGuid(pathWorkspaceGuid, workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        List<Quiz> quizzes = quizRepository.findByWorkspaceGuid(guid);

        var items = quizzes.stream()
            .map(quiz -> new QuizListItem(quiz.getId(), quiz.getTitle()))
            .toList();

        return ResponseEntity.ok(items);
    }

    @GetMapping("/quizzes/{id}/stats")
    public ResponseEntity<QuizStatsResponse> getQuizStats(
            @PathVariable(value = "workspaceGuid", required = false) String pathWorkspaceGuid,
            @RequestHeader(value = WorkspaceKey.HEADER, required = false) String workspaceKey,
            @PathVariable Integer id) {
        String guid = workspaceGuid(pathWorkspaceGuid, workspaceKey);
        if (!workspaceRepository.existsById(guid))
            return ResponseEntity.notFound().build();

        return ResponseHelper.okOrNotFound(quizStatsService.getStats(guid, id));
    }

    private String workspaceGuid(String pathWorkspaceGuid, String workspaceKey) {
        return pathWorkspaceGuid == null
            ? WorkspaceKey.require(workspaceKey)
            : WorkspaceKey.require(pathWorkspaceGuid);
    }
}
