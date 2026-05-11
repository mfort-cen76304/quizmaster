package cz.scrumdojo.quizmaster.quiz;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Cohort {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, updatable = false)
    private String guid;

    @Column(nullable = false, length = 30)
    private String name;

    @PrePersist
    private void onPrePersist() {
        if (this.guid == null) {
            this.guid = UUID.randomUUID().toString();
        }
    }
}
