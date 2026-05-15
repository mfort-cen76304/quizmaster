package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class QuestionEmbeddingTextTest {

    @Test
    void normalizesWhitespaceWithoutLowercasing() {
        assertThat(QuestionEmbeddingText.normalize("  What\tis\nScrum?  ")).isEqualTo("What is Scrum?");
    }

    @Test
    void emptyNormalizedTextShouldNotBeEmbedded() {
        assertThat(QuestionEmbeddingText.normalize(" \n\t ")).isEmpty();
        assertThat(QuestionEmbeddingText.shouldEmbed(" \n\t ")).isFalse();
    }

    @Test
    void hashIsStableForWhitespaceEquivalentText() {
        String first = QuestionEmbeddingText.hash("What is Scrum?");
        String second = QuestionEmbeddingText.hash("  What   is\tScrum?  ");

        assertThat(second).isEqualTo(first);
    }

    @Test
    void hashChangesForMeaningfullyDifferentText() {
        String first = QuestionEmbeddingText.hash("What is Scrum?");
        String second = QuestionEmbeddingText.hash("What is Kanban?");

        assertThat(second).isNotEqualTo(first);
    }
}
