Feature: Edit question - validations
  Validation rules for question editing:
  - Question text is required
  - Answer text for each answer is required
  - At least one correct answer is required (single choice: one, multiple choice: at least two)
  - Answer explanations: either all or none

  Scenario: Empty single choice question form
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * with explanation "Czechia is a country in Europe. Czechs love beer."
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I enter question ""
    * I enter answer 1 text "", incorrect, with explanation ""
    * I enter question explanation ""
    * I attempt to submit the question
    Then I see error messages
      | empty-question           |
      | empty-answer             |
      | empty-answer-explanation |

  Scenario: Empty multiple choice question form
    Given question "What are cities of Czech Republic?"
    * with answers:
      | Brno     | * | No Brno |
      | Brussels |   | Yes     |
      | Prague   | * | Yes     |
      | Berlin   |   | Germany |
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I enter question ""
    * I enter answer 1 text "", incorrect, with explanation ""
    * I enter answer 3 text "", incorrect, with explanation ""
    * I enter question explanation ""
    * I attempt to submit the question
    Then I see error messages
      | empty-question           |
      | empty-answer             |
      | no-correct-answer        |
      | empty-answer-explanation |
      | few-correct-answers      |
