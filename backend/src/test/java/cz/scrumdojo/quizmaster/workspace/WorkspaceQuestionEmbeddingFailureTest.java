package cz.scrumdojo.quizmaster.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "ai.token=")
public class WorkspaceQuestionEmbeddingFailureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private QuestionRepository questionRepository;

    @Test
    public void createQuestionSucceedsWithoutEmbeddingWhenAiUnavailable() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        var result = mockMvc
            .perform(
                post("/api/workspaces/{guid}/questions", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "What is the capital of Italy?",
                            "answers": ["Naples", "Rome"],
                            "correctAnswers": [1],
                            "explanations": ["No", "Correct!"],
                            "isEasy": false,
                            "questionType": "single"
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer questionId = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id");

        Question saved = questionRepository.findById(questionId).orElseThrow();
        assertThat(saved.getEmbedding()).isNull();
        assertThat(saved.getEmbeddingModel()).isNull();
        assertThat(saved.getEmbeddingTextHash()).isNull();
    }
}
