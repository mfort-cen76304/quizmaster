Feature: Bookmark questions during a quiz
  During a quiz, users can bookmark questions to revisit later.
  - Bookmarked questions appear as links in the quiz navigation
  - Bookmarks can be removed by clicking the bookmark again or deleting from the list

  Background:
    Given workspace "Bookmarks" with questions
      | bookmark  | question                                 | answers              |
      | Planet    | Which planet is known as the Red Planet? | Mars (*), Venus      |
      | Australia | What's the capital city of Australia?    | Sydney, Canberra (*) |
    And quiz "Quiz" with questions "Planet, Australia"
      | pass score | 85 |


  Scenario: Mark bookmark and return to bookmark
    When I start quiz "Quiz"
    Then I see question "Planet"

    When I bookmark question "Planet"
    Then I see bookmarked question "Planet"
    Then I see bookmark link "Planet"

    When I skip the question
    Then I see bookmark link "Planet"

    When I click bookmark "Planet"
    Then I see question "Planet"


  Scenario: Remove bookmark
    When I start quiz "Quiz"
    Then I see question "Planet"

    When I bookmark question "Planet"
    Then I see bookmarked question "Planet"
    Then I see bookmark link "Planet"

    When I delete bookmark "Which planet is known as the Red Planet?"
    Then I don't see bookmark link "Which planet is known as the Red Planet?"


  Scenario: Unmark bookmark
    When I start quiz "Quiz"
    Then I see question "Planet"

    When I bookmark question "Planet"
    Then I see bookmarked question "Planet"
    Then I see bookmark link "Planet"

    When I bookmark question "Planet"
    Then I don't see bookmark link "Planet"
