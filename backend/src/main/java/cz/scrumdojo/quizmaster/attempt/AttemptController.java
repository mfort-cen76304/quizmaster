package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.quiz.QuizAvailability;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/attempt")
public class AttemptController {

    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;

    public AttemptController(AttemptRepository attemptRepository, QuizRepository quizRepository) {
        this.attemptRepository = attemptRepository;
        this.quizRepository = quizRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttemptResponse> getAttempt(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(
                attemptRepository.findById(id).map(AttemptResponse::from)
        );
    }

    @PostMapping
    public ResponseEntity<?> createAttempt(@RequestBody AttemptRequest request) {
        return quizRepository.findById(request.quizId())
                .map(quiz -> {
                    if (!QuizAvailability.isAvailable(quiz, LocalDateTime.now())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Quiz is not currently available."));
                    }

                    Attempt attempt = attemptRepository.save(request.toEntity());
                    return ResponseEntity.ok(AttemptResponse.from(attempt));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AttemptResponse> patchAttempt(@PathVariable Integer id, @RequestBody AttemptPatchRequest request) {
        return attemptRepository.findById(id)
                .map(attempt -> {
                    if (request.correctAnswers() != null) attempt.setCorrectAnswers(request.correctAnswers());
                    if (request.incorrectAnswers() != null) attempt.setIncorrectAnswers(request.incorrectAnswers());
                    if (request.partiallyCorrectAnswers() != null) attempt.setPartiallyCorrectAnswers(request.partiallyCorrectAnswers());
                    if (request.timedOutAt() != null) attempt.setTimedOutAt(request.timedOutAt());
                    if (request.finishedAt() != null) attempt.setFinishedAt(request.finishedAt());
                    return ResponseEntity.ok(AttemptResponse.from(attemptRepository.save(attempt)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
