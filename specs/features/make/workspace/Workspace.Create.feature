Feature: Create workspace
  A workspace is created by entering a name. After creation, the user
  is redirected to the empty workspace page ready for adding questions.

  Scenario: Create workspace
    Given I start creating a workspace
    * I enter workspace name "My List"
    When I submit the workspace
    Then I see the workspace "My List"
    * I see an empty workspace
