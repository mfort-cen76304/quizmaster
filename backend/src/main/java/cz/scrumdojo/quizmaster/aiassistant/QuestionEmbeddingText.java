package cz.scrumdojo.quizmaster.aiassistant;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class QuestionEmbeddingText {

    private QuestionEmbeddingText() {}

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.trim().replaceAll("\\s+", " ");
    }

    public static boolean shouldEmbed(String text) {
        return !normalize(text).isBlank();
    }

    public static String hash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(normalize(text).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available.", e);
        }
    }
}
