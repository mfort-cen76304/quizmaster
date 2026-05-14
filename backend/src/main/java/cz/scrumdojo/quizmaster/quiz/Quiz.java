package cz.scrumdojo.quizmaster.quiz;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;
    private String description;
    private LocalDateTime startAt;
    private LocalDateTime endAt;

    @Column(name = "questions", columnDefinition = "int[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private int[] questionIds;

    @Enumerated(EnumType.STRING)
    private QuizMode mode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty = Difficulty.KEEP_QUESTION;

    private int passScore;
    private Integer timeLimit; // time limit in seconds, null means no limit

    @Column(nullable = true)
    private String workspaceGuid; // Workspace GUID

    @Column(name = "random_question_count")
    private Integer randomQuestionCount;

    @Builder.Default
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Cohort> cohorts = new ArrayList<>();

    public void setCohorts(List<Cohort> cohorts) {
        this.cohorts = cohorts == null ? new ArrayList<>() : new ArrayList<>(cohorts);
        syncCohortOwnership();
    }

    @PrePersist
    @PreUpdate
    private void syncCohortOwnership() {
        if (cohorts == null) {
            cohorts = new ArrayList<>();
            return;
        }
        cohorts.forEach(cohort -> cohort.setQuiz(this));
    }

    public int drawnQuestionCount() {
        int total = questionIds == null ? 0 : questionIds.length;
        return (randomQuestionCount != null && randomQuestionCount > 0) ? Math.min(randomQuestionCount, total) : total;
    }
}
