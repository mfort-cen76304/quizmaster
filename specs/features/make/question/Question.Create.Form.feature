Feature: Create question form
  The question creation form starts with sensible defaults: empty question text,
  two empty answer fields, single choice mode, and no explanations visible.
  Answers can be added and removed. The explanation checkbox controls whether
  explanation fields are shown.

  Scenario: Default values
    Given I start creating a new question
    * I enable explanations
    Then I see empty question text
    * the question is single choice
    * I see 2 default empty answers
    * I see empty question explanation

  Scenario: Delete second answer out of three
    Given I start creating a new question
    * I enter answers
      | AA | * |
      | BB |   |
      | CC |   |
    Then I delete answer 2
    * I see the answers fields
      | AA | * |
      | CC |   |

  Scenario: Explanation fields are hidden by default
    When I start creating a new question
    Then I see explanations are disabled
    And I do not see explanation fields

  Scenario: Explanation fields are visible when enabling explanations
    When I start creating a new question
    And I enable explanations
    Then I see explanations are enabled
    And I see explanation fields

  Scenario: Tag field is empty by default
    When I start creating a new question
    Then I see empty tag

  Scenario: Test backButton
    Given workspace "Testworkspace"
    And page "Question Creation"
    When I start creating a new question
    And I see the question creation page
    And I go back to the workspace "Testworkspace"
    Then I see the workspace "Testworkspace"
