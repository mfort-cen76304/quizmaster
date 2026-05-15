package cz.scrumdojo.quizmaster.attempt;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptQuestionRepository extends JpaRepository<AttemptQuestion, Integer> {
    List<AttemptQuestion> findByAttemptIdOrderByPosition(Integer attemptId);
    List<AttemptQuestion> findByAttemptIdInOrderByPosition(List<Integer> attemptIds);
    Optional<AttemptQuestion> findByAttemptIdAndQuestionId(Integer attemptId, Integer questionId);
}
