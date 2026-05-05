package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-assistant")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> generate(@RequestBody AiAssistantRequest request) {
        return ResponseEntity.ok(aiAssistantService.generateQuestion(request.question(), request.questionType()));
    }

    @PostMapping("/batch")
    public ResponseEntity<QuestionResponse[]> generateBatch(@RequestBody AiAssistantRequest request) {
        return ResponseEntity.ok(aiAssistantService.generateQuestions(request.question(), request.questionType()));
    }
}
