package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
@Table(
    name = "attempt_question",
    uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
)
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
}
