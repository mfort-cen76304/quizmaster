package cz.scrumdojo.quizmaster.quiz.leaderboard;

import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QuizLeaderboardService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;

    public QuizLeaderboardService(
            QuizRepository quizRepository,
            AttemptRepository attemptRepository,
            AttemptQuestionRepository attemptQuestionRepository) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
    }

    @Transactional(readOnly = true)
    public Optional<QuizLeaderboardResponse> getLeaderboard(Integer quizId) {
        return quizRepository.findById(quizId)
            .map(quiz -> new QuizLeaderboardResponse(rankCohorts(quiz)));
    }

    private QuizLeaderboardCohortResponse[] rankCohorts(Quiz quiz) {
        var finishedCohortAttempts = attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId()).stream()
            .filter(a -> a.getFinishedAt() != null && a.getCohortGuid() != null)
            .toList();
        var attemptIds = finishedCohortAttempts.stream().map(Attempt::getId).toList();
        var scoresByAttemptId = attemptIds.isEmpty()
            ? Map.<Integer, List<AttemptQuestion>>of()
            : attemptQuestionRepository.findByAttemptIdInOrderByPosition(attemptIds).stream()
                .collect(Collectors.groupingBy(AttemptQuestion::getAttemptId));
        var scoresByCohort = new HashMap<String, List<Integer>>();
        for (Attempt attempt : finishedCohortAttempts) {
            scoresByCohort
                .computeIfAbsent(attempt.getCohortGuid(), ignored -> new ArrayList<>())
                .add(AttemptQuestion.percentageScore(scoresByAttemptId.getOrDefault(attempt.getId(), List.of())));
        }

        var rankedCohorts = quiz.getCohorts().stream()
            .map(cohort -> new CohortLeaderboardRow(
                cohort.getName(),
                averageScore(scoresByCohort.get(cohort.getGuid()))
            ))
            .sorted(Comparator.comparingInt(CohortLeaderboardRow::score).reversed()
                .thenComparing(CohortLeaderboardRow::name))
            .toList();

        QuizLeaderboardCohortResponse[] response = new QuizLeaderboardCohortResponse[rankedCohorts.size()];
        for (int index = 0; index < rankedCohorts.size(); index++) {
            var cohort = rankedCohorts.get(index);
            response[index] = new QuizLeaderboardCohortResponse(index + 1, cohort.name(), cohort.score());
        }
        return response;
    }

    private int averageScore(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) {
            return 0;
        }
        int total = scores.stream().mapToInt(Integer::intValue).sum();
        return Math.round((float) total / scores.size());
    }

    private record CohortLeaderboardRow(String name, int score) {}
}
