package cz.scrumdojo.quizmaster.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CohortRepository extends JpaRepository<Cohort, Integer> {

    Optional<Cohort> findByGuidAndQuizId(UUID guid, Integer quizId);
}