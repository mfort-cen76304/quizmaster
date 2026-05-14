package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(name = "cohort_id")
    private Integer cohortId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "timed_out_at")
    private LocalDateTime timedOutAt;

    @Builder.Default
    @Column(name = "is_dry_run", nullable = false)
    private Boolean isDryRun = false;

    public static double totalPoints(Stream<AnswerStatus> statuses) {
        return statuses.mapToDouble(AnswerStatus::points).sum();
    }

    public static int percentageScore(List<AttemptQuestion> scores) {
        if (scores.isEmpty()) return 0;
        double earned = totalPoints(scores.stream().map(AttemptQuestion::getStatus));
        return (int) Math.round(earned / scores.size() * 100);
    }
}
