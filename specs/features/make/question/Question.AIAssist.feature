Feature: Generate question using AI

  Scenario: Generate Explanations button is hidden by default
    Given I start creating a new question
    Then I do not see Generate Explanations button

  @ai @slow
  Scenario: Generate Explanations button appears after clicking Generate in AI Prompt
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    Then I see Generate Explanations button
    And I do not see explanation fields

  @ai @slow
  Scenario: Explanations stay empty after enabling explanation fields
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    Then I see Generate Explanations button
    When I enable explanations
    Then I see explanation fields
    And all explanation fields are empty

  @ai @slow
  Scenario: Clicking Generate Explanations shows generated explanations
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    Then I see Generate Explanations button
    When I click Generate Explanations
    Then I see explanations are enabled
    And all answers have explanations

  @ai @slow @skip
  Scenario: Generate Explanations fills previously empty explanation fields
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    And I enable explanations
    Then all explanation fields are empty
    When I click Generate Explanations
    Then all answers have explanations

  @ai @slow @skip
  Scenario: Generate Explanations fills explanations after adding a new answer manually
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    And I add another answer
    And I enter the last answer's text "example"
    And I enable explanations
    Then all explanation fields are empty
    When I click Generate Explanations
    Then all answers have explanations

  @ai @slow @skip
  Scenario: Generate Explanations updates explanation after manual answer text change
    Given I start creating a new question
    When I ask AI:
      | Generate a question about nuclear physics |
    And I click Generate Explanations
    And I remember explanation for answer 1
    When I enter answer 1 text "manually changed answer"
    And I click Generate Explanations
    Then all answers have explanations
    And explanation for answer 1 has changed

  @ai @slow
  Scenario: Generate a single-choice question
    Given I start creating a new question
    And the question is single choice
    When I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                 |
    Then Question field is not empty
    And the question is single choice
    And I see at least 3 answers
    And exactly 1 answer is marked correct

  @ai @slow
  Scenario: Generate a multiple-choice question
    Given I start creating a new question
    And I mark the question as multiple choice
    When I ask AI:
      | Generate a question about European capitals |
      | and 2 incorrect answers                     |
    Then Question field is not empty
    And the question is multiple choice
    And I see at least 4 answers
    And at least 2 answers are marked correct

  @ai @slow
  Scenario: Generate a question with explanations
    Given I start creating a new question
    When I ask AI:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
      | with explanations                           |
    Then Question field is not empty
    And I see Generate Explanations button
    And I do not see explanation fields
    When I click Generate Explanations
    Then I see explanations are enabled
    And all answers have explanations

  @ai @slow
  Scenario: Save an AI-generated question
    Given I start creating a new question
    When I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    And I submit the question
    Then the question is saved in the workspace

  @ai @slow
  Scenario: Edit an AI-generated question before saving
    Given I start creating a new question
    When I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    And I enter question "What is the capital of France?"
    And I submit the question
    Then I see question in list "What is the capital of France?"

  @ai @slow
  Scenario: Regenerate replaces previous AI response
    Given I start creating a new question
    And the question is single choice
    When I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                 |
    Then the question is single choice
    And I mark the question as multiple choice
    When I ask AI:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then the question is multiple choice
    And at least 2 answers are marked correct

  Scenario: AI section is not available when editing
    Given question "What is the capital of Czech Republic?"
      * with answers:
        | Brno   |   | No Brno |
        | Prague | * | Yes     |
        | Berlin |   | Germany |
      * with explanation "Czechia is a country in Europe. Czechs love beer."
      * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    Then I do not see AI section
