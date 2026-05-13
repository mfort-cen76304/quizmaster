package cz.scrumdojo.quizmaster.attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AttemptQuestionScoreRepository extends JpaRepository<AttemptQuestionScore, Integer> {
    List<AttemptQuestionScore> findByAttemptId(Integer attemptId);
    List<AttemptQuestionScore> findByAttemptIdIn(List<Integer> attemptIds);
    Optional<AttemptQuestionScore> findByAttemptIdAndQuestionId(Integer attemptId, Integer questionId);
}
