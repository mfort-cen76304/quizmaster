package cz.scrumdojo.quizmaster.question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface QuestionStatsLogRepository extends JpaRepository<QuestionStatsLog, Integer> {
    List<QuestionStatsLog> findByQuestionIdIn(List<Integer> questionIds);
    List<QuestionStatsLog> findByQuizIdAndQuestionIdIn(Integer quizId, List<Integer> questionIds);
    Optional<QuestionStatsLog> findByAttemptIdAndQuestionId(Integer attemptId, Integer questionId);
}
