Feature: Scenario outline

  Scenario Outline: Calculation
    Given input <a>
    When divided by <b>
    Then result is <c>

    Examples:
      | a   | b | c  |
      | 10  | 2 | 5  |
      | 100 | 4 | 25 |
      | -8  | 2 | -4 |
