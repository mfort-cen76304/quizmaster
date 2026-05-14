package cz.scrumdojo.quizmaster.attempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<Attempt, Integer> {
    Optional<Attempt> findByIdAndQuizId(Integer id, Integer quizId);
    List<Attempt> findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(Integer quizId);
}

