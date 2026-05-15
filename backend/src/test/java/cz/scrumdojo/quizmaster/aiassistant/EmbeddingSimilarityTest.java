package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmbeddingSimilarityTest {

    @Test
    void exactSameVectorHasSimilarityOne() {
        double similarity = EmbeddingSimilarity.cosine(new double[] { 1.0, 2.0, 3.0 }, new double[] { 1.0, 2.0, 3.0 });

        assertThat(similarity).isCloseTo(1.0, withinTinyTolerance());
    }

    @Test
    void orthogonalVectorsHaveSimilarityZero() {
        double similarity = EmbeddingSimilarity.cosine(new double[] { 1.0, 0.0 }, new double[] { 0.0, 1.0 });

        assertThat(similarity).isCloseTo(0.0, withinTinyTolerance());
    }

    @Test
    void zeroVectorHasSimilarityZero() {
        double similarity = EmbeddingSimilarity.cosine(new double[] { 0.0, 0.0 }, new double[] { 1.0, 1.0 });

        assertThat(similarity).isEqualTo(0.0);
    }

    @Test
    void unequalDimensionsAreNotComparable() {
        double similarity = EmbeddingSimilarity.cosine(new double[] { 1.0, 2.0 }, new double[] { 1.0, 2.0, 3.0 });

        assertThat(similarity).isEqualTo(0.0);
    }

    private static org.assertj.core.data.Offset<Double> withinTinyTolerance() {
        return org.assertj.core.data.Offset.offset(0.0000001);
    }
}
