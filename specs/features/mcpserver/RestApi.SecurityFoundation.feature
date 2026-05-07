Feature: REST API security foundation
  Quizmaster authoring APIs require an authenticated principal and workspace
  membership. The MCP server must use the same protected REST API as other
  clients, without a privileged bypass.

  @skip
  Scenario: Unauthenticated client cannot read workspace content
    Given workspace "Training" exists
    When an anonymous REST client reads workspace "Training"
    Then the REST response is denied as unauthenticated


  @skip
  Scenario: Non-member cannot read workspace content
    Given workspace "Training" exists
    And I am authenticated as a user with no membership in workspace "Training"
    When I read workspace "Training" through the REST API
    Then the REST response is denied as forbidden


  @skip
  Scenario: Viewer can read but cannot change workspace content
    Given I am authenticated as a viewer of workspace "Training"
    And workspace "Training" has a question
    When I read workspace "Training" through the REST API
    Then the REST response is successful
    When I create a question through the REST API
    Then the REST response is denied as forbidden


  @skip
  Scenario: Editor can maintain workspace questions and quizzes
    Given I am authenticated as an editor of workspace "Training"
    And workspace "Training" has a question
    When I create a question through the REST API
    Then the REST response is successful
    When I create a quiz through the REST API
    Then the REST response is successful


  @skip
  Scenario: Workspace creator becomes owner
    Given I am authenticated as a workspace creator
    When I create workspace "Training" through the REST API
    Then I can manage workspace "Training" through the REST API


  @skip
  Scenario: Viewer cannot use AI assistant
    Given workspace "Training" exists
    And I am authenticated as a viewer of workspace "Training"
    When I ask the AI assistant through the REST API
    Then the REST response is denied as forbidden


  @skip
  Scenario: Editor can reach AI assistant validation
    Given workspace "Training" exists
    And I am authenticated as an editor of workspace "Training"
    When I ask the AI assistant through the REST API
    Then the REST request reaches AI assistant validation
