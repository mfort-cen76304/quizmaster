Feature: Generate numerical question from workspace using AI
  Robin AI can generate and save a numerical question directly from the
  workspace page without navigating to the question form first.

  @ai @slow
  Scenario: Generate a numerical question directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about basic arithmetic |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    And I see workspace question count 1

  @ai @slow
  Scenario: Generate a numerical question with tolerance directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about a physics calculation |
      | and include tolerance                                     |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    When I edit the AI-generated question from the workspace
    Then the question is numerical choice
    And I see non-empty numerical correct answer
    And I see non-empty tolerance

  @ai @slow
  Scenario: Generate a numerical question with question explanation directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about geometry |
      | and include question explanation             |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    When I edit the AI-generated question from the workspace
    Then the question is numerical choice
    And I see non-empty numerical correct answer
    And I see non-empty question explanation

  @ai @slow
  Scenario Outline: Vague tolerance request from workspace yields a non-zero tolerance bounded by the answer
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question |
      | asking <prompt>               |
      | with correct answer <answer>  |
      | and include tolerance         |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    When I edit the AI-generated question from the workspace
    Then the question is numerical choice
    And I see numerical correct answer <answer>
    And tolerance is greater than "0"
    And tolerance is less than <answer-magnitude>

    Examples:
      | prompt             | answer | answer-magnitude |
      | "What is 5 / 2?"   | "2.5"  | "2.5"            |
      | "What is -5 / 2?"  | "-2.5" | "2.5"            |
