
Feature: Take a numerical question
  Numerical questions accept a typed number as the answer instead of selecting
  from choices. The user sees a number input field and receives correct/incorrect
  feedback based on the entered value.

  Scenario Outline: Quizmaker-created numerical question uses number input for quiz taker
    Given a numerical question "How many regions does Czechia have?" with correct answer "14" bookmarked as "regions"
    When I take question "regions"
    Then I see a number input
    When I enter "<answer>"
    Then I see feedback "<feedback>"

    Examples:
      | answer | feedback   |
      | 11     | Incorrect! |
      | 14     | Correct!   |

  Scenario Outline: Numerical question with tolerance accepts values inside range
    Given a numerical question "What is the boiling point of water in Celsius?" with correct answer "100" and tolerance "10" bookmarked as "boiling-point"
    When I take question "boiling-point"
    Then I see a number input
    When I enter "<answer>"
    Then I see feedback "<feedback>"

    Examples:
      | answer | feedback   |
      | 89     | Incorrect! |
      | 90     | Correct!   |
      | 101    | Correct!   |
      | 110    | Correct!   |
      | 111    | Incorrect! |

Scenario Outline: Numerical question with decimal answer
    Given a numerical question "What is the value of Ludolf's number?" with correct answer "3.141592" bookmarked as "ludolfs-number"
    When I take question "ludolfs-number"
    Then I see a number input
    When I enter "<answer>"
    Then I see feedback "<feedback>"
    Examples:
      | answer | feedback   |
      | 3    | Incorrect! |
      | 3.141592 | Correct!   |
      | 3.141593 | Incorrect! |
      | 3.14 | Incorrect! |


  @skip
  Scenario Outline: Numerical question with decimal answer
    Given a numerical question "How many fingers does a healthy human have?" with correct answer "10" bookmarked as "fingers"
    When I take question "fingers"
    Then I see a number input
    When I enter "<answer>"
    Then I see feedback "<feedback>"
    Examples:
      | answer | feedback   |
      | 9.5    | Incorrect! |
      | 10     | Correct!   |
      | 10.0   | Correct!   |
      | 10.1   | Incorrect! |
