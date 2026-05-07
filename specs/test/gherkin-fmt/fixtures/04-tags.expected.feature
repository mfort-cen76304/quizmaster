@feature-tag
Feature: Tags

  @ai @slow
  Scenario: Multi-tag on one line
    Given x
    Then y


  @skip
  @wip
  Scenario: Stacked tags
    Given x
    Then y
