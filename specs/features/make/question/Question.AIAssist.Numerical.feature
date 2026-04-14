Feature: Generate numerical question using AI
  AI can generate a numerical question and prefill the numerical answer
  from a prompt before the question is saved.

  @ai @slow @skip
  Scenario: Create a numerical question using AI
    Given I start creating a new question
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
