Feature: Question answer feedback
  After submitting an answer, the quiz taker receives feedback indicating
  whether their answer is correct or incorrect.
  - Single choice: overall Correct!/Incorrect! feedback
  - Multiple choice: overall feedback (all correct must be selected, no
    incorrect selected) plus per-answer color coding (green for correct,
    red for selected-incorrect, neutral for unselected-incorrect)


  Scenario Outline: Single choice question feedback
    Question is answered correctly if the correct answer is selected

    Given a question "What's the capital city of Australia?"
    * with answers:
      | Sydney    |   |
      | Canberra  | * |
      | Melbourne |   |
    * saved and bookmarked as "Australia"
    When I take question "Australia"
    And I answer "<answer>"
    Then I see feedback "<feedback>"

    Examples:
      | answer   | feedback   |
      | Sydney   | Incorrect! |
      | Canberra | Correct!   |


  Scenario Outline: Multiple choice question feedback
    - 1 point, correct: if all correct answers are selected and no incorrect answer is selected
    - 0.5 points, partially correct: with one mistake (either one missing correct answer or one incorrect answer selected)
    - 0 points, incorrect: with two or more mistakes

    Given a question "Which of the following are planets?"
    * with answers:
      | Mars    | * |
      | Pluto   |   |
      | Titan   |   |
      | Venus   | * |
    * saved and bookmarked as "Planets"
    When I take question "Planets"
    And I answer "<answer>"
    Then I see feedback "<feedback>"
    And I see score "Score: <score>"
    Examples:
      | answer                    | score | feedback           |
      | Mars, Venus               | 1     | Correct!           |
      | Mars                      | 0.5   | Partially correct! |
      | Mars, Venus, Titan        | 0.5   | Partially correct! |
      | Mars, Pluto               | 0     | Incorrect!         |
      | Mars, Pluto, Venus, Titan | 0     | Incorrect!         |
      | Pluto, Titan              | 0     | Incorrect!         |


  Scenario Outline: Multiple choice question per-answer feedback
    Upon submitting the question, each answer is marked with a color:
    - 🟩 green if the answer is correct
    - 🟥 red if the answer is selected while incorrect
    - ◼️ no color if the answer is not selected while incorrect

    Given a question "Which of the following are planets?"
    * with answers:
      | Mars    | * |
      | Pluto   |   |
      | Titan   |   |
      | Venus   | * |
    * saved and bookmarked as "Planets"
    When I take question "Planets"
    And I answer "<answer>"
    Then I see individual color feedback per answer:
      | answer | color   |
      | Mars   | <mars>  |
      | Pluto  | <pluto> |
      | Venus  | <venus> |
      | Titan  | <titan> |

    Examples:
      | answer                    | mars    | pluto   | venus   | titan   |
      | Mars, Venus               | 🟩🟩🟩 | ◼️◼️◼️ | 🟩🟩🟩 | ◼️◼️◼️ |
      | Mars, Venus, Titan        | 🟩🟩🟩 | ◼️◼️◼️ | 🟩🟩🟩 | 🟥🟥🟥 |
      | Mars, Pluto               | 🟩🟩🟩 | 🟥🟥🟥 | 🟩🟩🟩 | ◼️◼️◼️ |
      | Mars, Pluto, Venus, Titan | 🟩🟩🟩 | 🟥🟥🟥 | 🟩🟩🟩 | 🟥🟥🟥 |
      | Pluto, Titan              | 🟩🟩🟩 | 🟥🟥🟥 | 🟩🟩🟩 | 🟥🟥🟥 |
