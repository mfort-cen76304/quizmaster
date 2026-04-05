Feature: Delete Quiz
  A quiz can be deleted from the workspace along with all its recorded attempts.
  Questions that were part of the deleted quiz are not affected.

  Background:
    Given workspace "Delete Quiz" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    And a quiz "Math Quiz" with all questions

  Scenario: Delete quiz removes it from the workspace
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I do not see quiz "Math Quiz" in the workspace

  Scenario: Cancelling deletion keeps the quiz
    When I delete quiz "Math Quiz" from the workspace
    And I cancel the deletion
    Then I see the quiz "Math Quiz" in the workspace

  Scenario: Deleting a quiz does not delete its questions
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I see question in list "2 + 2 = ?"
    And I see question in list "3 * 3 = ?"

  Scenario: Questions become deletable after their quiz is deleted
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    And I delete question "2 + 2 = ?" from the list
    Then I do not see question "2 + 2 = ?" in the list

  Scenario: Question in another quiz stays non-deletable
    And a quiz "Another Quiz" with all questions
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I cannot delete question "2 + 2 = ?"

  Scenario: Deleting a quiz with attempts succeeds
    When I take quiz "Math Quiz"
    * I start the quiz
    * I answer 2 questions correctly
    * I evaluate the quiz
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I do not see quiz "Math Quiz" in the workspace
