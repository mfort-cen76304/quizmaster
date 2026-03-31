Feature: Quiz retake after evaluation
  After a quiz is evaluated, the quiz taker can start a follow-up run.
  The follow-up run includes only questions that were answered incorrectly
  in the evaluated attempt.

  Scenario: Exam mode - Retake contains only incorrectly answered questions
    Given workspace "Retake" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
    * a quiz "Retake Quiz" with all questions
      | mode       | exam |
      | pass score | 100    |
    When I start quiz "Retake Quiz"
    * I answer 2 questions correctly
    * I answer 1 questions incorrectly
    * I proceed to the score page
    * I retake only incorrectly answered questions
    Then progress shows 1 of 1
    * I see question "Q3"
    * I do not see question "Q1"
    * I do not see question "Q2"

  Scenario: Learn mode - Retake contains only incorrectly answered questions
    Given workspace "Retake" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
    * a quiz "Retake Quiz" with all questions
      | mode       | learn |
      | pass score | 100   |
    When I start quiz "Retake Quiz"
    * I answer correctly
    * I proceed to the next question
    * I answer correctly
    * I proceed to the next question
    * I answer incorrectly
    * I proceed to the score page
    * I retake only incorrectly answered questions
    Then progress shows 1 of 1
    * I see question "Q3"
    * I do not see question "Q1"
    * I do not see question "Q2"

  Scenario: Exam mode - Retake starts with no preselected answer
    Given workspace "Retake Empty State" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
    * a quiz "Retake Quiz" with all questions
      | mode       | exam |
      | pass score | 100    |
    When I start quiz "Retake Quiz"
    * I answer 2 questions correctly
    * I answer 1 questions incorrectly
    * I proceed to the score page
    * I retake only incorrectly answered questions
    Then I see the submit button as inactive

  Scenario: Learn mode - Retake starts with no preselected answer
    Given workspace "Retake Empty State" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
    * a quiz "Retake Quiz" with all questions
      | mode       | learn |
      | pass score | 100   |
    When I start quiz "Retake Quiz"
    * I answer correctly
    * I proceed to the next question
    * I answer correctly
    * I proceed to the next question
    * I answer incorrectly
    * I proceed to the score page
    * I retake only incorrectly answered questions
    Then I see the submit button as inactive
