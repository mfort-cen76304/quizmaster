package cz.scrumdojo.quizmaster.aiassistant;

public final class EmbeddingSimilarity {

    private EmbeddingSimilarity() {}

    public static double cosine(double[] left, double[] right) {
        if (left == null || right == null || left.length == 0 || left.length != right.length) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double leftMagnitude = 0.0;
        double rightMagnitude = 0.0;
        for (int index = 0; index < left.length; index++) {
            dotProduct += left[index] * right[index];
            leftMagnitude += left[index] * left[index];
            rightMagnitude += right[index] * right[index];
        }

        if (leftMagnitude == 0.0 || rightMagnitude == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
    }
}
