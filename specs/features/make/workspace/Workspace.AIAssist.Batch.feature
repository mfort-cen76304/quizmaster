Feature: Generate multiple questions from workspace using AI
  Robin AI can create more than one question from a single workspace prompt.
  The generated questions are saved directly into the workspace without opening the question form.
  Batch generation must work regardless of the language used in the prompt.

  @ai @slow
  Scenario: Generate two single-choice questions from one prompt directly in workspace
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2

  @ai @slow
  Scenario: Generate two multiple-choice questions from one prompt directly in workspace
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask AI for multiple choice questions:
      | Generate 2 questions about European capitals |
      | each with 2 correct answers                  |
      | and 2 incorrect answers                      |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2

  @ai @slow
  Scenario: Batch generation appends new questions to the existing workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I remember workspace question count
    And I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2

  @ai @slow
  Scenario: One of the questions generated from a batch can be edited from workspace
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2
    When I edit one of the AI-generated questions from the workspace
    Then I see question edit page
    And Question field is not empty

  @ai @slow
  Scenario Outline: Generate two single-choice questions from one non-English prompt directly in workspace
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask AI to generate multiple questions:
      | <line-1> |
      | <line-2> |
      | <line-3> |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2

    Examples:
      | line-1                                         | line-2                               | line-3                              |
      | Vygeneruj 2 otazky o hlavnych mestach         | kazda ma 1 spravnu odpoved          | a 2 nespravne odpovede              |
      | Vygeneruj 2 otázky o hlavních městech         | každá má 1 správnou odpověď         | a 2 nesprávné odpovědi              |

  @ai @slow
  Scenario Outline: Generate two multiple-choice questions from one non-English prompt directly in workspace
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask AI for multiple choice questions:
      | <line-1> |
      | <line-2> |
      | <line-3> |
    Then I see the workspace "Workspace"
    And workspace question count increased by 2

    Examples:
      | line-1                                             | line-2                               | line-3                              |
      | Vygeneruj 2 otazky o europskych hlavnych mestach  | kazda ma 2 spravne odpovede         | a 2 nespravne odpovede              |
      | Vygeneruj 2 otázky o evropských hlavních městech  | každá má 2 správné odpovědi         | a 2 nesprávné odpovědi              |
