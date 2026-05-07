Feature: Quiz skipped questions
  When a quiz taker skips a question (proceeds without answering), the skipped
  question is bookmarked and revisited after the last question. Skipped questions
  that have since been answered are not shown again.

  Background:
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions


  Scenario: Skip first question and see bookmark
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    And I see bookmark to previous question "Which animal has long nose?"
    And I see bookmark link "Which animal has long nose?"


  Scenario: Last question is not answered and there are skipped questions
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    Then I see buttons "Back, Next"


  Scenario: Last question is answered and there are skipped questions
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    When I answer "Paris"
    Then I see buttons "Back, Next"


  Scenario: Last question is answered and show skipped question
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    When I answer "Paris"
    Then I see buttons "Back, Next"
    When I proceed to the next question
    Then I see question "Which animal has long nose?"


  Scenario: Last question is skipped and there are skipped questions
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    Then I see buttons "Back, Next"
    When I skip the question
    Then I see question "Which animal has long nose?"


  Scenario: Do not show skipped question which was submitted
    When I start quiz "Quiz"
    And I skip the question
    Then I see question "What is capital of France?"
    When I answer "Paris"
    Then I see buttons "Back, Next"
    When I proceed to the next question
    Then I see question "Which animal has long nose?"
    When I answer "Elephant"
    Then I see buttons "Back, Evaluate"
