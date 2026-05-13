package cz.scrumdojo.quizmaster.workspace;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.question.QuestionStatsLog;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
class WorkspaceQuestionStatsCalculationTest {
    private final WorkspaceQuestionController controller = new WorkspaceQuestionController(
        null,
        null,
        null,
        null,
        null,
        new ObjectMapper()
    );
    @Test
    void timeoutCountsAsAskedAndSkipped() {
        var stats = controller.toQuestionStats(List.of(
            log("TIMEOUT", "{}")
        ));
        assertEquals(1, stats.timesAsked());
        assertEquals(0, stats.successRate());
        assertEquals(1, stats.skipped());
    }
    @Test
    void correctAnswerStillUsesAskedCountIncludingSkippedAndTimeout() {
        var stats = controller.toQuestionStats(List.of(
            log("ANSWERED", "{\"correct\":true}"),
            log("SKIPPED", "{}"),
            log("TIMEOUT", "{}")
        ));
        assertEquals(3, stats.timesAsked());
        assertEquals(33, stats.successRate());
        assertEquals(2, stats.skipped());
    }
    private static QuestionStatsLog log(String eventType, String eventDetail) {
        return QuestionStatsLog.builder()
            .questionId(1)
            .quizId(1)
            .attemptId(1)
            .eventType(eventType)
            .eventDetail(eventDetail)
            .createdAt(LocalDateTime.now())
            .build();
    }
}
