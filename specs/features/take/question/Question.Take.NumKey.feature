Feature: Answer question using numeric keys
  Quiz takers can answer single choice questions by pressing numeric keys (1-9)
  on the keys, matching the answer's position in the list.
  Impossible to answer 10th option.

Background:
    Given questions
      | bookmark  | question                              | answers                           |
      | Single    | Which country is in Europe?           | Italy (*), Mexico, Morocco, USA, Canada, Iran, China, Japan, Israel, Kuwait |
      | Multiple  | Which countries are in Europe?        | Italy (*), Mexico, Germany (*), USA, Canada, Iran, China, Japan, Israel, Kuwait |
    And a question "How many regions does Czechia have?"
      * with numerical answer "14"
      * saved and bookmarked as "Numerical"


  Scenario Outline: Single choice question - numeric key selects an answer
    When I take question "Single"
    And I press the key <key>
    Then I see feedback "<feedback>"

    Examples:
      | key | feedback   |
      | 1   | Correct!   |
      | 2   | Incorrect! |
      | 5   | Incorrect! |
      | 9   | Incorrect! |

Scenario Outline: Multiple choice question - numeric key selects an answer
    When I take question "Multiple"
    And I press the key <key>
    And I press enter to submit
    Then I see feedback "<feedback>"
    Examples:
      | key | feedback   |
      | 1,3   | Correct!   |
      | 1,2   | Incorrect! |
      | 2,3   | Incorrect! |
      | 2,4   | Incorrect! |

Scenario Outline: Numerical question - numeric input submits an answer
    When I take question "Numerical"
    Then I see a number input
    And I enter "<answer>"
    And I press enter to submit
    Then I see feedback "<feedback>"

    Examples:
      | answer | feedback   |
      | 48     | Incorrect! |
      | 14     | Correct!   |


