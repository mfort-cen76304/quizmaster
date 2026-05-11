Feature: Edit Quiz in Workspace
  An existing quiz's title and description can be edited from the workspace.
  After saving, the updated information is reflected in both the workspace
  quiz list and the quiz welcome page.

  Background:
    Given workspace "Edit Quiz" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
      | 4 / 2 = ? | 2 (*), 3 |
    And quiz "Math Quiz" with all questions


  Scenario: Edit quiz title and description
    When I navigate to edit quiz "Math Quiz"
    * I enter quiz name "Advanced Math"
    * I enter quiz description "Challenging mathematics questions"
    * I submit the quiz
    Then I see the quiz "Advanced Math" in the workspace
    * I take quiz "Advanced Math"
    * I see quiz description "Challenging mathematics questions"

  @skip
  Scenario: Add Cohort to Quiz in Workspace
    When I create a new cohort "Girls" to quiz "Math Quiz"
    * I submit the quiz
    Then quiz "Math Quiz" contains cohort "Girls"
