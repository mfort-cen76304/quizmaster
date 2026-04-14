Feature: Quiz Scheduling
  Before starting a quiz, availability of the quiz is checked against the configured start and end date-time.
  The start button is disabled and qrayed out when quiz is unavailable.

  @skip
  Scenario Outline: Quiz Availability validation
    Given workspace "Welcome" with questions
      | bookmark | question  | answers    |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz A" with questions "Q1, Q2"
      | description | Description A |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s           |
      | start date  | today - 1 |
      | end date    | today + 1 |
    And quiz "Quiz B" with questions "Q1, Q2"
      | description | Description B |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s           |
      | start date  | today + 1 |
      | end date    | today + 2 |
    When I open quiz "<quiz>"
    Then I see the welcome page
    * I can "<action>" the quiz

    Examples:
      | quiz   | action    |
      | Quiz A | start    |
      | Quiz B | not_start |
