Feature: Create quiz - validations
  The quiz creation form enforces validation rules:
  - Title is required
  - At least two questions must be selected
  - Pass score must be between 0 and 100
  - Time limit must be between 0 and 21600 seconds
  - Randomized question count cannot exceed selected questions
  Defaults: 600 seconds time limit, 80% pass score. Clearing a numeric
  field defaults to 0.

  Background:
    Given workspace "Quiz Validations" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
      | 4 / 2 = ? | 2 (*), 3 |


  Scenario: Create quiz with default values
    When I start creating a new quiz
    Then I see empty quiz title
    * I see empty quiz description
    * I see time limit "600s" seconds
    * I see pass score "80"
    * I see quiz question "2 + 2 = ?"
    * I see quiz question "3 * 3 = ?"
    * I see quiz question "4 / 2 = ?"


  Scenario: Create quiz with more questions in randomized than available
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I select question "2 + 2 = ?"
    * I select question "4 / 2 = ?"
    * I enable question randomization
    * I set randomized question count to 3
    * I submit the quiz
    Then I see error messages in quiz form
      | too-many-randomized-questions |


  Scenario: Quiz form with only default values
    When I start creating a new quiz
    * I submit the quiz
    Then I see error messages in quiz form
      | empty-title   |
      | few-questions |


  Scenario: Display error when score is above 100
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I enter pass score "220"
    * I submit the quiz
    Then I see error messages in quiz form
      | score-above-max |


  Scenario: Display error when limit is over 21600
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I enter time limit "21601s"
    * I submit the quiz
    Then I see error messages in quiz form
      | time-limit-above-max |


  @skip
  Scenario: When time limit is cleared, "0" is automatically set
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I clear time limit
    Then I see no error messages in quiz form
    * I see time limit "0s" seconds


  Scenario: When pass score is cleared, "0" is automatically set
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I clear score
    Then I see no error messages in quiz form
    * I see pass score "0"
