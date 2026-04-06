package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempt")
public class AttemptController {

    private final AttemptRepository attemptRepository;

    public AttemptController(AttemptRepository attemptRepository) {
        this.attemptRepository = attemptRepository;
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<AttemptResponse>> getAttemptsByQuiz(@PathVariable Integer quizId) {
        List<AttemptResponse> attempts = attemptRepository.findByQuizIdOrderByStartedAtDesc(quizId)
                .stream()
                .map(AttemptResponse::from)
                .toList();
        return ResponseEntity.ok(attempts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttemptResponse> getAttempt(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(
                attemptRepository.findById(id).map(AttemptResponse::from)
        );
    }

    @PostMapping
    public ResponseEntity<AttemptResponse> createAttempt(@RequestBody AttemptRequest request) {
        Attempt attempt = attemptRepository.save(request.toEntity());
        return ResponseEntity.ok(AttemptResponse.from(attempt));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AttemptResponse> patchAttempt(@PathVariable Integer id, @RequestBody AttemptPatchRequest request) {
        return attemptRepository.findById(id)
                .map(attempt -> {
                    if (request.correctAnswers() != null) attempt.setCorrectAnswers(request.correctAnswers());
                    if (request.incorrectAnswers() != null) attempt.setIncorrectAnswers(request.incorrectAnswers());
                    return ResponseEntity.ok(AttemptResponse.from(attemptRepository.save(attempt)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AttemptResponse> updateAttempt(@PathVariable Integer id, @RequestBody AttemptRequest request) {
        return attemptRepository.findById(id)
                .map(existing -> {
                    Attempt attempt = request.toEntity();
                    attempt.setId(id);
                    attempt.setCorrectAnswers(existing.getCorrectAnswers());
                    attempt.setIncorrectAnswers(existing.getIncorrectAnswers());
                    return ResponseEntity.ok(AttemptResponse.from(attemptRepository.save(attempt)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(@PathVariable Integer id) {
        if (!attemptRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        attemptRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

