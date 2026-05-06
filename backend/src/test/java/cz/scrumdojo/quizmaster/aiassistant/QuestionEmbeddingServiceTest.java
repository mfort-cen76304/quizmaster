package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.workspace.Workspace;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

@SpringBootTest
class QuestionEmbeddingServiceTest {

    @Autowired
    private QuestionEmbeddingService questionEmbeddingService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Value("${ai.token:}")
    private String apiToken;

    @Value("${ai.embedding.model:openai/text-embedding-3-small}")
    private String embeddingModel;

    @Tag("ai")
    @Test
    void attachesEmbeddingMetadataBeforeSave() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Question question = fixtures.question()
            .question("Which country is the largest producer of coffee?")
            .build();

        questionEmbeddingService.embedForSave(question);

        assertThat(question.getEmbedding()).isNotEmpty();
        assertThat(question.getEmbeddingModel()).isEqualTo(embeddingModel);
        assertThat(question.getEmbeddingTextHash())
            .isEqualTo(QuestionEmbeddingText.hash("Which country is the largest producer of coffee?"));
        assertThat(questionEmbeddingService.hasUsableEmbedding(question)).isTrue();
    }

    @Tag("ai")
    @Test
    void loadsUsableWorkspaceEmbeddingsAndExcludesEditedQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = fixtures.save(fixtures.workspace());
        Question editedQuestion = saveEmbeddedQuestion(workspace, "What is Scrum?");
        Question otherQuestion = saveEmbeddedQuestion(workspace, "What is Kanban?");

        List<QuestionEmbeddingService.UsableQuestionEmbedding> embeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspace.getGuid(), editedQuestion.getId());

        assertThat(embeddings)
            .extracting(QuestionEmbeddingService.UsableQuestionEmbedding::questionId)
            .containsExactly(otherQuestion.getId());
    }

    @Tag("ai")
    @Test
    void staleEmbeddingIsIgnoredWhenQuestionTextChanges() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = saveEmbeddedQuestion(workspace, "What is Scrum?");
        question.setQuestion("What is Kanban?");
        questionRepository.save(question);

        List<QuestionEmbeddingService.UsableQuestionEmbedding> embeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspace.getGuid(), null);

        assertThat(embeddings).isEmpty();
        assertThat(questionEmbeddingService.hasUsableEmbedding(question)).isFalse();
    }

    private Question saveEmbeddedQuestion(Workspace workspace, String questionText) {
        Question question = fixtures.questionIn(workspace).question(questionText).build();
        questionEmbeddingService.embedForSave(question);
        return questionRepository.save(question);
    }
}
