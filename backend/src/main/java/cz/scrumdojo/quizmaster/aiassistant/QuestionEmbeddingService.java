package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.Question;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionEmbeddingService {

    public void embedForSave(Question question) {
        throw new UnsupportedOperationException("Question embedding persistence is not implemented yet.");
    }

    public boolean hasUsableEmbedding(Question question) {
        throw new UnsupportedOperationException("Question embedding usability check is not implemented yet.");
    }

    public List<UsableQuestionEmbedding> usableWorkspaceEmbeddings(String workspaceGuid, Integer excludedQuestionId) {
        throw new UnsupportedOperationException("Workspace embedding lookup is not implemented yet.");
    }

    public record UsableQuestionEmbedding(Integer questionId, String questionText, double[] embedding) {}
}
