Feature: Generate numerical question using AI
  AI can generate a numerical question and prefill the numerical answer
  from a prompt before the question is saved.

  @ai @slow
  Scenario: Create a numerical question using AI
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 7 + 7?"       |
      | with correct answer 14        |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical answer field
    And I see numerical correct answer "14"
    When I submit the question
    Then the question is saved in the workspace


  @ai @slow
  Scenario: AI-generated numerical question with tolerance in prompt
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question   |
      | asking "What is 5 + 5?"         |
      | with correct answer 10          |
      | and tolerance of 1              |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "10"
    And I see tolerance "1"
    When I submit the question
    Then the question is saved in the workspace


  @ai @slow
  Scenario: AI-generated numerical question with Question explanation in prompt
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question   |
      | asking "What is 5 + 5?"         |
      | with correct answer 10          |
      | and explanation "Addition combines two numbers into a single value." |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "10"
    And I see question explanation "Addition combines two numbers into a single value."
    When I submit the question
    Then the question is saved in the workspace

  @ai @slow
  Scenario: AI-generated numerical question defaults tolerance to 0 when not requested
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 6 + 6?"      |
      | with correct answer 12       |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "12"
    And I see tolerance "0"

  @ai @slow
  Scenario: AI-generated numerical question fills question explanation by default
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 8 + 8?"      |
      | with correct answer 16       |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "16"
    And I see empty question explanation

  @ai @slow
  Scenario: AI-generated numerical question resets tolerance to 0 when the next prompt does not ask for it
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 5 + 5?"      |
      | with correct answer 10       |
      | and tolerance of 1           |
    Then I see tolerance "1"
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 6 + 6?"      |
      | with correct answer 12       |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "12"
    And I see tolerance "0"

  @ai @slow
  Scenario: AI-generated numerical question clears existing question explanation when the next prompt does not ask for it
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 5 + 5?"      |
      | with correct answer 10       |
      | and explanation "Addition combines two numbers into a single value." |
    Then I see question explanation "Addition combines two numbers into a single value."
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 6 + 6?"      |
      | with correct answer 12       |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "12"
    And I see empty question explanation

  @ai @slow
  Scenario: AI-generated numerical question proposes tolerance when requested without a specific value
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking "What is 70 + 70?"    |
      | with correct answer 140      |
      | and include tolerance        |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "140"
    And I see non-empty tolerance

  @ai @slow
  Scenario: AI-generated numerical question proposes question explanation when requested without a specific text
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question   |
      | asking "What is 9 + 9?"        |
      | with correct answer 18         |
      | and include question explanation |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer "18"
    And I see non-empty question explanation

  @ai @slow
  Scenario Outline: AI-generated numerical question proposes unrounded tolerance for fractional or negative answers
    Given I start creating a new question
    And I mark the question as numerical choice
    When I open Robin AI
    And I ask AI:
      | Generate a numerical question |
      | asking <prompt>               |
      | with correct answer <answer>  |
      | and include tolerance         |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer <answer>
    And I see tolerance <tolerance>

    Examples:
      | prompt             | answer | tolerance |
      | "What is 5 / 2?"  | "2.5" | "0.25"  |
      | "What is -5 / 2?" | "-2.5" | "0.25" |





