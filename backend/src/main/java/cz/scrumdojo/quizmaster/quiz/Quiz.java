package cz.scrumdojo.quizmaster.quiz;

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
}
