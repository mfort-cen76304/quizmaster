package cz.scrumdojo.quizmaster.aiassistant;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OpenRouterEmbeddingClient {

    public List<double[]> embed(List<String> inputs) {
        throw new UnsupportedOperationException("OpenRouter embedding API client is not implemented yet.");
    }
}
