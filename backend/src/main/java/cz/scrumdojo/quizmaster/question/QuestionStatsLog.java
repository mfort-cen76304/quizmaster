package cz.scrumdojo.quizmaster.question;

import jakarta.persistence.*;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import org.hibernate.annotations.Type;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "question_stats_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionStatsLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(name = "quiz_id")
    private Integer quizId;

    @Column(name = "attempt_id")
    private Integer attemptId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "event_type", nullable = false, length = 32)
    private String eventType;

    @Type(JsonBinaryType.class)
    @Column(name = "event_detail", columnDefinition = "jsonb")
    private String eventDetail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (eventDetail == null) eventDetail = "{}";
    }
}
