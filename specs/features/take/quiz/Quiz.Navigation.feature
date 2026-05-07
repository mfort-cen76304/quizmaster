Feature: Quiz navigation buttons
  Back, Next, and Evaluate buttons appear based on the quiz taker's position:
  - First question: only Next is visible
  - Middle questions: Back and Next are visible
  - Last question (all answered): Back and Evaluate are visible
  Submit button is active only when an answer is selected.
  Browser back and forward buttons navigate between questions.

  Background:
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions


  Scenario: Back button is not visible on the first question
    When I start quiz "Quiz"
    Then I see buttons "Next"


  Scenario: Back button is visible after first question
    When I start quiz "Quiz"
    And I answer "Elephant"
    Then I see buttons "Back"


  Scenario: Back button navigates to previous question
    When I start quiz "Quiz"
    And I answer "Elephant"
    Then I see question "What is capital of France?"
    And I go back to previous question
    Then I see question "Which animal has long nose?"


  Scenario: User proceed to last question
    When I start quiz "Quiz"
    And I answer "Elephant"
    Then I see question "What is capital of France?"
    Then I see buttons "Back"
    When I answer "Lyon"
    Then I see buttons "Back, Evaluate"


  Scenario: User navigate to evaluation page
    When I start quiz "Quiz"
    And I answer "Elephant"
    Then I see question "What is capital of France?"
    Then I see buttons "Back"
    When I answer "Lyon"
    When I evaluate the quiz


  Scenario: Submit button is visible as active when answer is checked
    When I start quiz "Quiz"
    Then I see question "Which animal has long nose?"
    When I check answer "Elephant"
    Then I see the submit button as active


  Scenario: Submit button is visible as inactive when no answer is checked
    When I start quiz "Quiz"
    Then I see question "Which animal has long nose?"
    Then I see the submit button as inactive
    When I check answer "Elephant"
    Then I see the submit button as active
    When I uncheck answer "Elephant"
    Then I see the submit button as inactive


  Scenario: Browser navigation during quiz
    Given quiz "Learn Quiz" with all questions
      | mode | learn |
    When I start quiz "Learn Quiz"
    And I see question "Which animal has long nose?"
    When I answer "Elephant, Anteater, Swordfish"
    Then I see feedback "Correct!"
    When I proceed to the next question
    Then I see question "What is capital of France?"
    When I use the browser back button
    Then I see question "Which animal has long nose?"
    When I use the browser forward button
    Then I see question "What is capital of France?"
