Feature: Show stats
  After completing a quiz, statistics are available showing results per attempt.
  The stats page displays a table with duration and score percentage. An empty
  stats page is shown when no attempts have been recorded yet.

  Scenario: Show empty stats page for quiz
    - Shows empty stats page for brand new created quiz.

    Given workspace "Stats Empty" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And a quiz "Quiz" with all questions
    When I open stats for quiz "Quiz"
    And I see stats page for quiz "Quiz"

  # Duration (individual): full, half, zero
  Scenario: Duration for full correct attempt
    Given workspace "Stats Duration Full" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And a quiz "Stats Quiz" with all questions
    When I take quiz "Stats Quiz" with answers in 10 seconds
      | question              | answers |
      | Jaký nábytek má Ikea? | Stůl    |
      | Jaké nádobí má Ikea?  | Talíř   |
    And I open stats for quiz "Stats Quiz"
    Then I see stats page for quiz "Stats Quiz"
    And I see attempt stats table
      | Attempts   |          |                 |                   |       |          |
      | Duration   |          |                 |                   |       | Status   |
      | 10 seconds |          |                 |                   |       | Finished |

  Scenario: Duration for half correct attempt
    Given workspace "Stats Duration Half" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And a quiz "Stats Quiz" with all questions
    When I take quiz "Stats Quiz" with answers in 10 seconds
      | question              | answers |
      | Jaký nábytek má Ikea? | Stůl    |
      | Jaké nádobí má Ikea?  | Kolo    |
    And I open stats for quiz "Stats Quiz"
    Then I see stats page for quiz "Stats Quiz"
    And I see attempt stats table
      | Attempts   |          |                 |                   |       |          |
      | Duration   |          |                 |                   |       | Status   |
      | 10 seconds |          |                 |                   |       | Finished |

  Scenario: Duration for zero correct attempt
    Given workspace "Stats Duration Zero" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And a quiz "Stats Quiz" with all questions
    When I take quiz "Stats Quiz" with answers in 10 seconds
      | question              | answers |
      | Jaký nábytek má Ikea? | Auto    |
      | Jaké nádobí má Ikea?  | Kolo    |
    And I open stats for quiz "Stats Quiz"
    Then I see stats page for quiz "Stats Quiz"
    And I see attempt stats table
      | Attempts   |          |                 |                   |       |          |
      | Duration   |          |                 |                   |       | Status   |
      | 10 seconds |          |                 |                   |       | Finished |

  Scenario Outline: Attempt stats for <label> correct answers
    Given a quiz "Stats Quiz" with 2 questions
    When I start the quiz
    And I answer <correct> questions correctly
    And I answer <incorrect> questions incorrectly
    And I evaluate the quiz
    And I open stats for quiz "Stats Quiz"
    Then I see stats page for quiz "Stats Quiz"
    And I see attempt stats table
      | Attempts |          |                   |                     |         |          |
      |          | Points   | Correct Answers   | Incorrect Answers   | Score   | Status   |
      |          | <points> | <correct_answers> | <incorrect_answers> | <score> | Finished |

    Examples:
      | label | correct | incorrect | points | correct_answers | incorrect_answers | score |
      | all   | 2       | 0         | 2/2    | 2 (100%)        | 0 (0%)            | 100   |
      | half  | 1       | 1         | 1/2    | 1 (50%)         | 1 (50%)           | 50    |
      | zero  | 0       | 2         | 0/2    | 0 (0%)          | 2 (100%)          | 0     |

  # Summary stats
  Scenario: Summary stats for completed quiz
    Given a quiz "Stats Quiz" with 2 questions
    When I start the quiz
    And I answer 2 questions correctly
    And I evaluate the quiz
    And I open stats for quiz "Stats Quiz"
    Then I see summary stats table
      | Summary |          |         |
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
    And I open stats for quiz "Stats Quiz"
    Then I see summary stats table
      | Summary |          |         |
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
    And I open stats for quiz "Stats Quiz"
    Then I see stats page for quiz "Stats Quiz"
    And I see attempt stats table
      | Attempts |       |                 |                   |     |          |
      | Duration | Points| Correct Answers | Incorrect Answers | Score| Status   |
      |          |       |                 |                   |     | Timeout  |
