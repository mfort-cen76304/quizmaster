Feature: Generate multiple questions from workspace using AI
  Robin AI can create more than one question from a single workspace prompt.
  The generated questions are saved directly into the workspace without opening the question form.

  @ai @slow
  Scenario: Generate two single-choice questions from one prompt directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    And I see workspace question count 2

  @ai @slow
  Scenario: Generate two multiple-choice questions from one prompt directly in workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI for multiple choice questions:
      | Generate 2 questions about European capitals |
      | each with 2 correct answers                  |
      | and 2 incorrect answers                      |
    Then I see the workspace "Workspace"
    And I see workspace question count 2

  @ai @slow
  Scenario: Batch generation appends new questions to the existing workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    And I see workspace question count 3

  @ai @slow
  Scenario: One of the questions generated from a batch can be edited from workspace
    Given workspace "Workspace"
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    When I edit one of the AI-generated questions from the workspace
    Then I see question edit page
    And Question field is not empty
