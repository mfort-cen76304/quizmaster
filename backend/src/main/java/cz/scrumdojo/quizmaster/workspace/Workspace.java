package cz.scrumdojo.quizmaster.workspace;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String guid;

    private String title;
}
