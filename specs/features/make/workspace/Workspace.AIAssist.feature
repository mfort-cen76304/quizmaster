Feature: Generate question from workspace using AI
  Robin AI is available directly on the workspace page, so a quiz maker
  can generate and save a new question without opening the question form first.

  @ai @slow
  Scenario: Open Robin AI from workspace
    Given workspace "Workspace"
    When I open Robin AI
    Then I see AI section

  @ai @slow
  Scenario: Generate a single-choice question directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    And I see workspace question count 1

  @ai @slow
  Scenario: Generate a multiple-choice question directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then I see the workspace "Workspace"
    And the question is saved in the workspace
    And I see workspace question count 1

  @ai @slow
  Scenario: Generated question can be edited from workspace after direct creation
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    Then I see the workspace "Workspace"
    When I edit the AI-generated question from the workspace
    Then I see question edit page
    And Question field is not empty

  @ai @slow
  Scenario: Repeated generation from workspace creates another question
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    Then I see workspace question count 1
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then I see workspace question count 2
