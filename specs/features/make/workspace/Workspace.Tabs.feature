Feature: Workspace tabs
  The workspace page organizes its contents into two tabs —
  Quizzes and Questions — so a maker can focus on one at a time.

  Scenario: Workspace shows Quizzes and Questions tabs
    Given workspace "Workspace"
    When I open the workspace
    Then I see the "Quizzes" tab
    And I see the "Questions" tab


  Scenario: Quizzes tab is open by default
    Given workspace "Workspace"
    When I open the workspace
    Then the "Quizzes" tab is open by default


  Scenario: Clicking the Questions tab opens it
    Given workspace "Workspace"
    When I open the workspace
    And I click the "Questions" tab
    Then the "Questions" tab is open
    And the "Quizzes" tab is closed


  Scenario: Quizzes tab shows only the quizzes section
    Given workspace "Workspace"
    When I open the workspace
    And I click the "Quizzes" tab
    Then I see the "Quizzes" section
    And I do not see the "Questions" section


  Scenario: Questions tab shows only the questions section
    Given workspace "Workspace"
    When I open the workspace
    And I click the "Questions" tab
    Then I see the "Questions" section
    And I do not see the "Quizzes" section
