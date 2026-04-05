Feature: Generate question and answers using AI

  @ai @slow
  Scenario: Generate single-choice question and answers using AI assist
    Given I start creating a question
    When I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    Then Question field is not empty
    And the question is single choice
    And AI assistant returns at least 2 generated answers
    And AI assistant returns generated answers with only one correct answer

  @ai @slow
  Scenario: Generate multiple-choice question and answers using AI assist
    Given I start creating a question
    When I ask AI:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then the question is multiple choice
    And Question field is not empty
    And AI assistant returns at least 2 generated answers
    And AI assistant returns at least 2 correct answers

  Scenario: AI prompt section is hidden when editing question
    Given a question "What is the capital of Czech Republic?"
      * with answers:
        | Brno   |   | No Brno |
        | Prague | * | Yes     |
        | Berlin |   | Germany |
      * with explanation "Czechia is a country in Europe. Czechs love beer."
      * saved and bookmarked as "Czechia"
    When I enter question "What is the capital of Slovakia?"
    Then I do not see AI section

  @ai
  Scenario: Generate multiple-choice question and answers and explanations using AI assist
      Given I start creating a question
      When I ask AI:
        | Generate a question about European capitals |
        | with 2 correct answers   |
        | and 2 incorrect answers  |
        | with explanations        |
      Then the question is multiple choice
      And Question field is not empty
      And AI assistant returns at least 2 generated answers with explanations
      And AI assistant returns at least 2 correct answers with explanations
