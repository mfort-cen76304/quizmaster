package cz.scrumdojo.quizmaster.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CohortRepository extends JpaRepository<Cohort, String> {

    Optional<Cohort> findByGuidAndQuizId(String guid, Integer quizId);

    List<Cohort> findByQuizIdOrderByName(Integer quizId);
}
