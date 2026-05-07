Feature: Quiz question pool size
  The quiz question pool can be limited using the "size" (finalCount) setting.
  When set, a random subset of questions is selected from the full pool.
  The welcome page and scoring reflect the actual number of questions served.

  Background:
    Given workspace "Quiz Length" with questions
      | bookmark  | question                                              | answers                   |
      | Planet    | Which planet is known as the Red Planet?              | Mars (*), Venus           |
      | Australia | What's the capital city of Australia?                 | Canberra (*), Sydney      |
      | Fruit     | Which fruit is known for having seeds on the outside? | Strawberry (*), Blueberry |
    And quiz "Normal" with all questions
      | pass score | 100 |
      | size       | 2   |
    And quiz "Full" with all questions
      | pass score | 100 |


  Scenario: Normal mode
    - Quiz with question pool size displayed same value in question count at welcome page.

    When I open quiz "Normal"
    Then I see the welcome page
    * I see question count 2
    When I start quiz "Normal"
    * I answer correctly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 2 / 2           | 100   | passed | 100        |


  Scenario: Empty mode
    - Quiz with question pool size displayed same value in question count at welcome page.

    When I open quiz "Full"
    Then I see the welcome page
    * I see question count 3
    When I start quiz "Full"
    * I answer correctly
    * I answer correctly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 3 / 3           | 100   | passed | 100        |
