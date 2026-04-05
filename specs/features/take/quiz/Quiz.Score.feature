Feature: Evaluate quiz score
  After completing all quiz questions, the score is calculated:
  - Overall result: number correct, percentage, pass/fail against the pass score
  - Partial scoring: multiple choice questions can award 0, 0.5, or 1 point

  Scenario Outline: Quiz score
    Given workspace "Score" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
      | Q4       | 4 + 4 = ? | 8 (*), 9 |
    And a quiz "Score Quiz" with all questions
      | pass score | 75 |
    When I start the quiz
    * I answer <correct> questions correctly
    * I answer <incorrect> questions incorrectly
    * I evaluate the quiz
    Then I see the result <correct> correct out of 4, <percentage>%, <result>, required passScore 75%

    Examples:
      | correct | incorrect | percentage | result |
      | 4       | 0         | 100        | passed |
      | 3       | 1         | 75         | passed |
      | 2       | 2         | 50         | failed |
      | 0       | 4         | 0          | failed |

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
    Then I see the result 2 correct out of 2, 100%, passed, required passScore 100%
    Then I see the original result 1, 50%, failed

  Scenario Outline: Quiz with multiple choice question with partial score
    Partial scoring applies to multiple choice questions within a quiz.
    - All correct answers: 1 point
    - One error: 0.5 points
    - More than one error: 0 points

    Given workspace "Partial Score" with questions
      | bookmark | question                                              | answers                                      | explanation |
      | Planets  | Which of the following are planets?                    | Mars (*), Pluto, Titan, Venus (*), Earth (*) | Planets     |
      | Sky      | What is the standard colour of sky?                   | Red, Blue (*), Green, Black                  | Rayleigh    |
    And a quiz "Quiz" with all questions
      | pass score | 75 |
    When I start the quiz
    And I answer "<answer>"
    And I answer "Blue"
    And I evaluate the quiz
    Then I see the result <correct> correct out of 2, <percentage>%, <result>, required passScore 75%

    Examples:
      | answer                    | correct | percentage | result |
      | Mars, Venus, Earth        | 2       | 100        | passed |
      | Mars, Venus, Titan, Earth | 1.5     | 75         | passed |
      | Mars, Venus               | 1.5     | 75         | passed |
      | Mars, Pluto               | 1       | 50         | failed |
      | Mars, Pluto, Venus, Titan | 1       | 50         | failed |
      | Pluto, Titan              | 1       | 50         | failed |
