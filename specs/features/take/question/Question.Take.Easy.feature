Feature: Take an easy question
  An easy question reveals the number of correct answers for a multiple choice question,
  helping the quiz taker narrow down their selection.
  - Multiple choice + easy: displays count of correct answers
  - Multiple choice + not easy: no count displayed
  - Single choice: not applicable (always one correct answer)

  Scenario: Multiple choice easy question - correct answers is 3
    Given question "Which of these countries are in Europe?"
    * with answers:
      | Italy   | * |
      | France  | * |
      | Morocco |   |
      | Spain   | * |
      | Canada  |   |
    * marked as easy
    * saved and bookmarked as "Europe"

    When I take question "Europe"
    Then I see that the question has 3 correct answers


  Scenario: Multiple choice easy question - correct answers is 2
    Given question "Which of these countries are in Europe?"
    * with answers:
      | Italy   | * |
      | France  | * |
      | Morocco |   |
      | Spain   |   |
      | Canada  |   |
    * marked as easy
    * saved and bookmarked as "Europe"

    When I take question "Europe"
    Then I see that the question has 2 correct answers


  Scenario: Multiple choice question not easy - no correct answers count
    Given question "Which of these countries are in Europe?"
    * with answers:
      | Italy   | * |
      | France  | * |
      | Morocco |   |
      | Spain   |   |
      | Canada  |   |
    * saved and bookmarked as "Europe"

    When I take question "Europe"
    Then I do not see correct answers count


  Scenario: Single choice question - no correct answers count
    Given question "Which of these countries is not in Europe?"
    * with answers:
      | Italy   |   |
      | France  |   |
      | Morocco | * |
      | Spain   |   |
    * saved and bookmarked as "Europe"

    When I take question "Europe"
    Then I do not see correct answers count
