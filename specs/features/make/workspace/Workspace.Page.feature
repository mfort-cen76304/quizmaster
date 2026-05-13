Feature: Workspace page management
  The workspace page is the central hub for managing questions and quizzes.
  From here, a quiz maker can:
  - Take, edit, or delete individual questions
  - View updated question text after edits
  - View answer statistics (success rate, average time, skipped count) per question
  Questions used in a quiz cannot be deleted.

  Scenario: Workspace summary shows zero questions and zero quizzes by default
    Given workspace "Workspace"
    Then I see workspace question count 0
    And I see workspace quiz count 0


  Scenario: Workspace summary shows one question after creating a question
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
    Then I see workspace question count 1
    And I see workspace quiz count 0


  Scenario: Workspace summary shows two questions and one quiz
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    And quiz "Math Quiz" with all questions
    Then I see workspace question count 2
    And I see workspace quiz count 1


  Scenario: Workspace summary updates after removing a question
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    When I delete question "What is 2 + 2?" from the list
    Then I see workspace question count 1
    And I see workspace quiz count 0


  Scenario: Workspace summary updates after removing a quiz
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    And quiz "Math Quiz" with all questions
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I see workspace question count 2
    And I see workspace quiz count 0


  Scenario: Take question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I take question "2 + 2 = ?" from the list
    Then I see the question and the answers


  Scenario: Delete question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I delete question "2 + 2 = ?" from the list
    Then I see an empty workspace


  Scenario: Do not show delete button for question used in a quiz
    Given workspace "Workspace" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    When I start creating a new quiz
    And I enter quiz name "Math Quiz"
    And I select exam mode
    And I select question "Jaký nábytek má Ikea?"
    And I select question "Jaké nádobí má Ikea?"
    And I submit the quiz
    Then I see the quiz "Math Quiz" in the workspace
    Then I cannot delete question "Jaký nábytek má Ikea?"


  Scenario: Edit question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I edit question "2 + 2 = ?" from the list
    Then I see question edit page
    And I see question text "2 + 2 = ?"


  Scenario: Show edited question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I edit question "2 + 2 = ?" from the list
    Then I see question edit page
    And I enter question "A + B = ?"
    When I submit the question
    Then I see question in list "A + B = ?"


  Scenario: Question with image shows thumbnail in workspace
    Given workspace "Workspace" with questions
      | question              | answers      | image                               |
      | Which animal is this? | Cat (*), Dog | https://placekitten.com/300/200.jpg |
      | 2 + 2 = ?             | 4 (*), 5     |                                     |
    Then I see image thumbnail for question "Which animal is this?"
    And I do not see image thumbnail for question "2 + 2 = ?"


  Scenario: Question with no attempts shows zero stats
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 + 3? | 6 (*), 7 |
    Then I see stats for question "What is 2 + 2?"
      | Times asked | Success rate | Average time | Skipped |
      | 0           | 0%           | 0s           | 0       |


  Scenario: Question stats reflect correct and incorrect answers across attempts
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 + 3? | 6 (*), 7 |
    And quiz "Math Quiz" with all questions

    When I start the quiz
    * I answer correctly
    * I answer correctly
    * I finish the quiz in 10 seconds

    When I start the quiz
    * I answer incorrectly
    * I answer correctly
    * I finish the quiz in 20 seconds

    And I open the workspace
    Then I see stats for question "What is 2 + 2?"
      | Times asked | Success rate | Average time | Skipped |
      | 2           | 50%          | 0s           | 0       |


  Scenario: Question stats count skipped answers
    Given workspace "Workspace" with questions
      | question        | answers  |
      | What is 2 + 2?  | 4 (*), 5 |
      | What is 10 - 5? | 5 (*), 6 |
    And quiz "Math Quiz" with all questions
      | time limit | 10s |

    When I start the quiz
    * I answer correctly
    * 10 seconds pass
    * I evaluate the quiz

    And I open the workspace
    Then I see stats for question "What is 10 - 5?"
      | Times asked | Success rate | Average time | Skipped |
      | 1           | 0%           | 0s           | 1       |


  Scenario: Average time is measured per question
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 + 3? | 6 (*), 7 |
    And quiz "Math Quiz" with all questions

    When I start the quiz
    * 10 seconds elapse
    * I answer correctly
    * 15 seconds elapse
    * I answer correctly
    * I evaluate the quiz

    And I open the workspace
    Then I see stats for question "What is 2 + 2?"
      | Times asked | Success rate | Average time | Skipped |
      | 1           | 100%         | 10s          | 0       |
    And I see stats for question "What is 3 + 3?"
      | Times asked | Success rate | Average time | Skipped |
      | 1           | 100%         | 15s          | 0       |
