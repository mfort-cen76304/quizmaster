Feature: Show stats
  After completing a quiz, statistics are available showing results per attempt.
  The stats page displays a table with duration and score percentage. An empty
  stats page is shown when no attempts have been recorded yet.


  Scenario: Show empty stats page for quiz
    Given a quiz "Quiz" with 2 questions
    When I open quiz "Quiz" statistics
    Then I see summary stats table
      | Started | Finished | Timeout |
      |       0 |        0 |       0 |
    And I see empty attempt stats table


  Scenario: Quiz attempt statistics
    Given a quiz "Stats Quiz" with 2 questions
      | time limit | 120s |

    When I start the quiz
    * I answer 2 questions correctly
    * I answer 0 questions incorrectly
    * I evaluate the quiz

    When I start the quiz
    * I answer 1 questions correctly
    * I answer 1 questions incorrectly
    * I finish the quiz in 10 seconds

    When I start the quiz
    * I answer 0 questions correctly
    * I answer 2 questions incorrectly
    * I finish the quiz in 5 seconds

    When I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration   | Points | Correct Answers | Incorrect Answers | Score | Status   |
      | 5 seconds  | 0/2    | 0 (0%)          | 2 (100%)          | 0     | Finished |
      | 10 seconds | 1/2    | 1 (50%)         | 1 (50%)           | 50    | Finished |
      | 0 seconds  | 2/2    | 2 (100%)        | 0 (0%)            | 100   | Finished |


  # Summary stats
  Scenario: Summary stats for completed quiz
    Given a quiz "Stats Quiz" with 2 questions
    When I start the quiz
    And I answer 2 questions correctly
    And I evaluate the quiz
    And I open quiz "Stats Quiz" statistics
    Then I see summary stats table
      | Started | Finished | Timeout |
      |       1 |        1 |       0 |

  @skip
  Scenario: Summary stats for timed out quiz
    Given workspace "Stats Summary Timeout" with questions
      | bookmark | question   | answers  |
      | Q1       | 1 + 1 = ?  | 2 (*), 3 |
      | Q2       | 2 + 2 = ?  | 4 (*), 5 |
    And a quiz "Stats Quiz" with all questions
      | time limit | 5 |
    When I take quiz "Stats Quiz" which I do not complete in time limit
      | question  | answers |
      | 1 + 1 = ? | 2       |
    And I open quiz "Stats Quiz" statistics
    Then I see summary stats table
      | Started | Finished | Timeout |
      |       1 |        0 |       1 |

# Status should show Timeout but we are unable to simulate waiting
  @skip
  Scenario: Status shows Timeout for timed out quiz
    Given workspace "Stats Status Timeout" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And a quiz "Stats Quiz" with all questions
      | time limit |
      | 5          |
    When I take quiz "Stats Quiz" which I do not complete in time limit
      | question              | answers |
      | Jaký nábytek má Ikea? | Stůl    |
    And I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Incorrect Answers | Score | Status  |
      |          |        |                 |                   |       | Timeout |
