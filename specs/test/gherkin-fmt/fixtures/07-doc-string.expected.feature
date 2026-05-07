Feature: Doc string

  Scenario: With docstring
    Given a payload:
      """
      line one
        indented line
      line three
      """
    Then ok
