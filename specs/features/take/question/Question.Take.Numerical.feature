Feature: Take a numerical question
  Numerical questions accept a typed number rather than choices. The user
  enters a value, submits, and gets immediate correct/incorrect feedback.
  An optional tolerance widens the accepted range around the correct answer.
  The user can retake the same question by entering a different value.

  Scenario: Without tolerance, only the exact answer is accepted
    Given a numerical question "What is 7 × 8?" with correct answer "56" bookmarked as "multiplication"
    When I take question "multiplication"
    And I retake with answers:
      | answer | feedback   |
      | 55     | Incorrect! |
      | 56     | Correct!   |
      | 57     | Incorrect! |

  Scenario: Tolerance widens the accepted range, boundaries inclusive
    Given a numerical question "Value of π to two decimal places?" with correct answer "3.14" and tolerance "0.01" bookmarked as "pi"
    When I take question "pi"
    And I retake with answers:
      | answer | feedback   |
      | 3.12   | Incorrect! |
      | 3.13   | Correct!   |
      | 3.14   | Correct!   |
      | 3.15   | Correct!   |
      | 3.16   | Incorrect! |
