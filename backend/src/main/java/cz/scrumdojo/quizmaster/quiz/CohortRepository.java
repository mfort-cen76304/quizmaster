package cz.scrumdojo.quizmaster.quiz;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CohortRepository extends JpaRepository<Cohort, String> {
    Optional<Cohort> findByGuidAndQuizId(String guid, Integer quizId);

    List<Cohort> findByQuizIdOrderByName(Integer quizId);
}
