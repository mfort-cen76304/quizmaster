Feature: Quiz progress bar
  As a quiz taker, I want to see
  - how much of the quiz I have completed, and,
  - how much I have still left to answer.

  Scenario: Exam mode
    - In exam mode, next question is shown after answering the current question
    - Progress bar shows the current page of the quiz

    Given workspace "Progress Exam" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 + 3 = ? | 6 (*), 7 |
    And a quiz "Exam" with all questions
      | pass score | 85 |

    When I start the quiz
    Then progress shows 1 of 3

    When I answer correctly
    Then progress shows 2 of 3

    When I answer correctly
    Then progress shows 3 of 3


  Scenario: Learning mode
    - In learning mode, progress bar updates after navigating to the next question
    - Progress bar updates after navigating to the next question

    Given workspace "Progress Learn" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 + 3 = ? | 6 (*), 7 |
    And a quiz "Learn" with all questions
      | mode       | learn |
      | pass score | 85    |

    When I start the quiz
    Then progress shows 1 of 3

    When I answer correctly
    Then progress shows 1 of 3

    When I proceed to the next question
    Then progress shows 2 of 3
