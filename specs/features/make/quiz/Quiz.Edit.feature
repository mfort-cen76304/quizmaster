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


  Scenario: Add a cohort to a quiz
    When I navigate to edit quiz "Math Quiz"
    * I create a new cohort "Girls"
    * I create a new cohort "Boys"
    * I submit the quiz
    Then quiz "Math Quiz" contains cohort "Girls"
    And quiz "Math Quiz" contains cohort "Boys"


  Scenario: Reject duplicate cohort name
    Given quiz "Math Quiz" has a cohort named "Girls"
    When I navigate to edit quiz "Math Quiz"
    * I create a new cohort "Girls"
    Then quiz "Math Quiz" has 1 cohort
    And quiz "Math Quiz" contains cohort "Girls"
    And I see error "duplicate-cohort-name" in quiz form


  Scenario: Discard unsaved cohort on leaving the edit page
    When I navigate to edit quiz "Math Quiz"
    * I create a new cohort "Girls"
    * I cancel editing by navigating back to workspace
    Then quiz "Math Quiz" does not contain cohort "Girls"


  Scenario: Accept cohort name at the 30-character limit
    When I create a new cohort "30 chars: 12345678901234567890" for quiz "Math Quiz"
    And I submit the quiz
    Then quiz "Math Quiz" contains cohort "30 chars: 12345678901234567890"


  Scenario: Reject cohort name longer than 30 characters
    When I create a new cohort "31 chars: 123456789012345678901" for quiz "Math Quiz"
    Then quiz "Math Quiz" does not contain cohort "31 chars: 123456789012345678901"
    And I see error "cohort-name-too-long" in quiz form
