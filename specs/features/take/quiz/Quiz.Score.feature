Feature: Evaluate quiz score
  After completing all quiz questions, the score is calculated:
  - Overall result: number correct, percentage, pass/fail against the pass score
  - Partial scoring: multiple choice questions can award 0, 0.5, or 1 point
  - Numerical questions: 0 or 1 point (correct if within tolerance)

  Scenario Outline: Quiz score with mixed question types
    Given workspace "Mixed" with questions
      | bookmark | question                           | answers                                      |
      | Capital  | What is the capital of Italy?       | Rome (*), Naples, Florence                   |
      | Planets  | Which are planets in solar system?  | Mars (*), Pluto, Venus (*), Titan, Earth (*) |
      | Boiling  | What is the boiling point of water? | 100 ±5                                       |
    And a quiz "Mixed Quiz" with all questions
      | pass score | 66 |
    When I start the quiz
    * I answer "<capital>"
    * I answer "<planets>"
    * I answer "<boiling>"
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score        | Result   | Pass Score |
      | <points> / 3    | <percentage> | <result> | 66         |

    Examples:
      | capital | planets                      | boiling | points | percentage | result |
      | Rome    | Mars, Venus, Earth           | 100     | 3      | 100        | passed |
      | Rome    | Mars, Venus, Earth           | 106     | 2      | 67         | passed |
      | Rome    | Mars, Venus                  | 100     | 2.5    | 83         | passed |
      | Naples  | Mars, Pluto                  | 95      | 1      | 33         | failed |
      | Naples  | Mars, Venus, Earth, Pluto    | 106     | 0.5    | 17         | failed |
      | Naples  | Pluto, Titan                 | 106     | 0      | 0          | failed |

  @skip
  Scenario: Quiz score in learning mode
    - In learning mode, quiz taker can retake questions
    - Score page shows two separate results:
      - score for the first answers of each question, and,
      - score for the corrected answers.

    Given workspace "Learn Score" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And a quiz "Learn Quiz" with all questions
      | mode       | learn |
      | pass score | 100   |
    When I start the quiz
    * I answer correctly
    * I proceed to the next question
    * I answer incorrectly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 2 / 2           | 100   | passed | 100        |
    And I see the original result 1, 50%, failed

