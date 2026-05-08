package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(name = "question_ids", columnDefinition = "int[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private int[] questionIds;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers;

    @Column(name = "partially_correct_answers", nullable = false)
    private Integer partiallyCorrectAnswers;

    @Column(name = "incorrect_answers", nullable = false)
    private Integer incorrectAnswers;

    @Column(name = "timed_out_at")
    private LocalDateTime timedOutAt;

    @Builder.Default
    @Column(name = "is_dry_run", nullable = false)
    private Boolean isDryRun = false;
}
