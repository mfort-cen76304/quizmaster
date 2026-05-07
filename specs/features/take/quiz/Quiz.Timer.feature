Feature: Run timer
  Quizzes with a time limit display a countdown timer. When time expires,
  a "Game over" dialog appears and the quiz is automatically evaluated
  with whatever answers have been submitted so far.

  Scenario Outline: Countdown timer counts down and shows timeout message
    Given quiz "Quiz" with 2 questions
      | time limit | <time limit> |

    When I start the quiz
    Then I see the countdown timer "<start>"

    When <x> seconds pass
    Then I see the countdown timer "<after x>"

    When <y> seconds pass
    Then I see the countdown timer "<after y>"

    When <remaining> seconds pass
    Then I see the timeout message

    Examples:
      | time limit | start | x  | after x | y  | after y | remaining |
      | 60s        | 01:00 | 10 | 00:50   | 20 | 00:30   | 30        |
      | 120s       | 02:00 | 30 | 01:30   | 45 | 00:45   | 45        |


  Scenario: Timed out quiz with no answers scores zero
    Given quiz "Quiz" with 2 questions
      | pass score | 85  |
      | time limit | 60s |
    When I start the quiz
    And 60 seconds pass
    Then I see the timeout message
    When I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 0 / 2           | 0     | failed | 85         |


  Scenario: Partial answers are scored when quiz times out
    Given quiz "Quiz" with 2 questions
      | pass score | 85  |
      | time limit | 60s |
    When I start the quiz
    And I answer correctly
    And 60 seconds pass
    Then I see the timeout message
    When I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 1 / 2           | 50    | failed | 85         |
