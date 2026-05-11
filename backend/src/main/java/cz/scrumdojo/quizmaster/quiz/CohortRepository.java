package cz.scrumdojo.quizmaster.quiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CohortRepository extends JpaRepository<Cohort, Integer> {

    @Modifying
    @Query(value = "DELETE FROM cohort WHERE quiz_id = :quizId", nativeQuery = true)
    void deleteByQuizId(@Param("quizId") Integer quizId);
}
