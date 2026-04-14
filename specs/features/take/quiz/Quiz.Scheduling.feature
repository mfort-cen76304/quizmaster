Feature: Quiz scheduling
  Before starting a quiz, the app checks whether the quiz is currently available based on its configured start and end date and time.
  The Start button is disabled and grayed out when the quiz is unavailable.

  @skip
  Scenario: Quiz Available
    Given workspace "Welcome" with questions
      | bookmark | question  | answers    |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description A |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s           |
      | start date  | today - 1 |
      | end date    | today + 1 |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I can start the quiz

  @skip
  Scenario: Quiz Unavailable
    Given workspace "Welcome" with questions
      | bookmark | question  | answers    |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description B |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s           |
      | start date  | today + 1 |
      | end date    | today + 2 |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I cannot start the quiz
