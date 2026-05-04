Feature: Generate question using AI

  @ai @slow
  Scenario: AI-generated question shows explanations
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about nuclear physics |
    Then Question field is not empty
    And I see explanations are enabled
    And all answers have explanations

  @ai @slow
  Scenario: Generate a single-choice question
    Given I start creating a new question
    And the question is single choice
    When I open Robin AI
    And I ask AI:
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
    When I open Robin AI
    And I ask AI:
      | Generate a question about European capitals |
      | and 2 incorrect answers                     |
    Then Question field is not empty
    And the question is multiple choice
    And I see at least 4 answers
    And at least 2 answers are marked correct

  @ai @slow
  Scenario: Save an AI-generated question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                   |
      | and 2 incorrect answers                 |
    And I submit the question
    Then the question is saved in the workspace

  @ai @slow
  Scenario: Edit an AI-generated question before saving
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
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
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                 |
    Then the question is single choice
    And I mark the question as multiple choice
    When I open Robin AI
    And I ask AI:
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
 @ai @slow
 Scenario: After question is generated button previous version is shown
   Given I start creating a new question
   When I open Robin AI
   And I generated a question by AI
   Then button to see previous version is shown
 @ai @slow
 Scenario: After I clicked on button "previous version" I see the previous generated version
   Given I start creating a new question when I already have generated content
   When I open Robin AI
   And I ask AI:
     | Generate a new question about a different topic |
   And I click on previous version button
   Then I see the previous generated version
