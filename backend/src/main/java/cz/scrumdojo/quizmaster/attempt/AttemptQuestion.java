package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class AttemptQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "attempt_id", nullable = false)
    private Integer attemptId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AnswerStatus status;

    @Column
    private Integer position;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    public void recordOutcome(QuizMode mode, AnswerStatus newStatus, LocalDateTime when) {
        if (mode == QuizMode.LEARN && status != AnswerStatus.UNANSWERED) return;
        status = newStatus;
        answeredAt = when;
    }

    public static AttemptQuestion drawn(Integer attemptId, Integer questionId, int position) {
        return AttemptQuestion.builder()
            .attemptId(attemptId)
            .questionId(questionId)
            .status(AnswerStatus.UNANSWERED)
            .position(position)
            .build();
    }

    public static double totalPoints(List<AttemptQuestion> rows) {
        return rows.stream()
            .map(AttemptQuestion::getStatus)
            .mapToDouble(AnswerStatus::points)
            .sum();
    }

    public static int percentageScore(List<AttemptQuestion> rows) {
        if (rows.isEmpty()) return 0;
        return (int) Math.round(totalPoints(rows) / rows.size() * 100);
    }
}
