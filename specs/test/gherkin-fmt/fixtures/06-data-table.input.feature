Feature: Data table alignment

  Scenario: With table
    Given users:
      | name | role |
      | alice | admin |
      | bob | viewer |
    Then ok
