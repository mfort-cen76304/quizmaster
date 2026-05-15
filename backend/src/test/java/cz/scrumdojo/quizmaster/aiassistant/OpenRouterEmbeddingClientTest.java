package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Tag("ai")
class OpenRouterEmbeddingClientTest {

    @Autowired
    private OpenRouterEmbeddingClient embeddingClient;

    @Value("${ai.token:}")
    private String apiToken;

    @Value("${ai.embedding.similarity-threshold:0.90}")
    private double similarityThreshold;

    @Test
    void embedsOneQuestionText() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        List<double[]> embeddings = embeddingClient.embed(List.of("Which country is the largest producer of coffee?"));

        assertThat(embeddings).hasSize(1);
        assertThat(embeddings.getFirst()).isNotEmpty();
        for (double value : embeddings.getFirst()) {
            assertThat(Double.isFinite(value)).isTrue();
        }
    }

    @Test
    void embedsBatchInputInOrder() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        List<double[]> embeddings = embeddingClient.embed(
            List.of("Which country is the largest producer of coffee?", "What is the capital of France?")
        );

        assertThat(embeddings).hasSize(2);
        assertThat(embeddings.get(0)).isNotEmpty();
        assertThat(embeddings.get(1)).isNotEmpty();
    }

    @Test
    void exactSameTextIsAboveDuplicateThreshold() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        List<double[]> embeddings = embeddingClient.embed(
            List.of(
                "Which country is the largest producer of coffee?",
                "Which country is the largest producer of coffee?"
            )
        );

        assertThat(EmbeddingSimilarity.cosine(embeddings.get(0), embeddings.get(1))).isGreaterThanOrEqualTo(
            similarityThreshold
        );
    }

    @Test
    void unrelatedQuestionIsBelowDuplicateThreshold() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        List<double[]> embeddings = embeddingClient.embed(
            List.of(
                "Which country is the largest producer of coffee?",
                "What is the Scrum Master's primary accountability?"
            )
        );

        assertThat(EmbeddingSimilarity.cosine(embeddings.get(0), embeddings.get(1))).isLessThan(similarityThreshold);
    }
}
