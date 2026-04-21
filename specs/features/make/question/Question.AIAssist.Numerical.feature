Feature: Generate numerical question using AI
  AI can generate a numerical question and prefill the numerical answer
  from a prompt before the question is saved.

  @ai @slow
  Scenario: Create a numerical question using AI
    Given I start creating a new question
    And I mark the question as numerical choice
    When I ask AI:
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
    When I ask AI:
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
    When I ask AI:
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





