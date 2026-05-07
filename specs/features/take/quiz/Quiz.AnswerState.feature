Feature: Quiz answer state
  Answer selection state across quiz navigation events:
  - New question displays with no answer pre-selected
  - Page refresh clears the selected (unsubmitted) answer
  - Submitted answers are remembered when navigating back
  - Proceeding to the next question submits the current answer
  - Restarting a completed quiz begins from scratch

  Scenario: Quiz question is displayed and not answered
    Given workspace "Regression" with questions
      | bookmark | question                            | answers                              |
      | Sky      | What is the standard colour of sky? | Red, Blue (*), Green, Black          |
      | France   | What is capital of France?          | Marseille, Lyon, Paris (*), Toulouse |
    And quiz "Quiz" with all questions
      | pass score | 85 |
    Given I start quiz "Quiz"
    Then I see question "Sky"
    And no answer is selected


  Scenario: After page refresh no answer is selected
    Given workspace "Regression" with questions
      | bookmark | question                            | answers                              |
      | Sky      | What is the standard colour of sky? | Red, Blue (*), Green, Black          |
      | France   | What is capital of France?          | Marseille, Lyon, Paris (*), Toulouse |
    And quiz "Quiz" with all questions
      | pass score | 85 |
    Given I start quiz "Quiz"
    When I answer "Green"
    And I refresh the page
    Then no answer is selected


  Scenario: After next page is displayed, no answer and explanation is displayed
    Given workspace "Regression" with questions
      | bookmark | question                            | answers                              |
      | Sky      | What is the standard colour of sky? | Red, Blue (*), Green, Black          |
      | France   | What is capital of France?          | Marseille, Lyon, Paris (*), Toulouse |
    And quiz "Quiz" with all questions
      | pass score | 85 |
    Given I start quiz "Quiz"
    When I answer "Green"
    Then no answer is selected


  Scenario: After completing the quiz and restarting, the quiz starts from the beginning
    Given workspace "Regression" with questions
      | bookmark | question                            | answers                              |
      | Sky      | What is the standard colour of sky? | Red, Blue (*), Green, Black          |
      | France   | What is capital of France?          | Marseille, Lyon, Paris (*), Toulouse |
    And quiz "Quiz" with all questions
      | pass score | 85 |
    Given I start quiz "Quiz"
    When I answer "Green"
    And I answer "Paris"
    And I evaluate the quiz
    And I start quiz "Quiz"
    Then I see question "Sky"
    And no answer is selected


  Scenario: User reloads page on answered question
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions
    When I start quiz "Quiz"
    And I answer "Elephant"
    * I check answer "Lyon,Paris"
    * I uncheck answer "Lyon"
    * I refresh the page
    Then no answer is selected


  Scenario: Remembered answer after back button
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions
    When I start quiz "Quiz"
    And I answer "Elephant"
    Then I see question "What is capital of France?"
    When I go back to previous question
    Then I see answer "Elephant" checked


  Scenario: Remembered multiple choices after back button
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions
    When I start quiz "Quiz"
    Then I see question "Which animal has long nose?"
    When I answer "Elephant, Anteater"
    Then I see question "What is capital of France?"
    When I go back to previous question
    Then I see answer "Elephant" checked
    Then I see answer "Anteater" checked


  Scenario: When proceeding answer is submitted
    Given workspace "Flow" with questions
      | question                    | answers                                            |
      | Which animal has long nose? | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?  | Marseille, Lyon, Paris (*), Toulouse               |
    And quiz "Quiz" with all questions
    When I start quiz "Quiz"
    Then I see question "Which animal has long nose?"
    When I check answer "Elephant"
    And I proceed to the next question
    Then I see question "What is capital of France?"
    When I go back to previous question
    Then I see answer "Elephant" checked


  Scenario: When going back answer is submitted
    Given workspace "Flow 3Q" with questions
      | question                       | answers                                            |
      | Which animal has long nose?    | Elephant (*), Anteater (*), Swordfish (*), Bulldog |
      | What is capital of France?     | Marseille, Lyon, Paris (*), Toulouse               |
      | What is capital of Madagascar? | Antananarivo (*), Nairobi, Cairo, Dakar            |
    And quiz "Three Questions" with all questions
    When I start quiz "Three Questions"
    Then I see question "Which animal has long nose?"
    And I skip the question
    Then I see question "What is capital of France?"
    And I check answer "Paris"
    When I skip the question
    Then I see question "What is capital of Madagascar?"
    When I go back to previous question
    Then I see answer "Paris" checked
