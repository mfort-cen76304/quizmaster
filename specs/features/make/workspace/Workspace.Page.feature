Feature: Workspace page management
  The workspace page is the central hub for managing questions and quizzes.
  From here, a quiz maker can:
  - Take, edit, or delete individual questions
  - View updated question text after edits
  Questions used in a quiz cannot be deleted.

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
      | question                       | answers            |
      | Jaký nábytek má Ikea?          | Stůl (*), Auto     |
      | Jaké nádobí má Ikea?           | Talíř (*), Kolo    |
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
      | question              | answers      | image                                 |
      | Which animal is this? | Cat (*), Dog | https://placekitten.com/300/200.jpg   |
      | 2 + 2 = ?             | 4 (*), 5     |                                       |
    Then I see image thumbnail for question "Which animal is this?"
    And I do not see image thumbnail for question "2 + 2 = ?"
