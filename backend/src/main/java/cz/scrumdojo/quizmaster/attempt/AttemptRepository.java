package cz.scrumdojo.quizmaster.attempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttemptRepository extends JpaRepository<Attempt, Integer> {
    List<Attempt> findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(Integer quizId);
}

