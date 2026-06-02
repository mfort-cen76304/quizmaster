Feature: Workspace tabs
  The workspace page organizes its contents into two tabs —
  Quizzes and Questions — so a maker can focus on one at a time.

  Scenario: Workspace shows Quizzes and Questions tabs
    Given workspace "Workspace"
    When I open the workspace
    Then I see the "Quizzes" tab
    And I see the "Questions" tab
