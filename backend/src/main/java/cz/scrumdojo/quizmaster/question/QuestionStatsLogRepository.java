package cz.scrumdojo.quizmaster.question;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionStatsLogRepository extends JpaRepository<QuestionStatsLog, Integer> {
    List<QuestionStatsLog> findByQuestionIdIn(List<Integer> questionIds);
}
