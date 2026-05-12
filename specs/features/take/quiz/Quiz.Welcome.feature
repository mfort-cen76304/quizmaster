Feature: Quiz Welcome page
  Before starting a quiz, the welcome page displays key information:
  quiz name, description, question count, time limit, pass score, and
  feedback type (exam vs. learn mode).

  Scenario Outline: Quiz welcome page
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
      | Q4       | 4 + 4 = ? | 8 (*), 9 |
    And quiz "Quiz A" with questions "Q1, Q2, Q3"
      | description | Description A |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
    # | start date | 2026-04-14T10:00 |
    # | end date | 2026-04-15T10:00 |
    And quiz "Quiz B" with questions "Q1, Q2, Q3, Q4"
      | description | Description B |
      | mode        | learn         |
      | pass score  | 75            |
      | time limit  | 60s           |
    When I open quiz "<quiz>"
    Then I see the welcome page
    * I see quiz name "<name>"
    * I see quiz description "<description>"
    * I see question count <count>
    * I see time limit set to "<time limit>" seconds
    * I see pass score <score> %
    * I see feedback type "<mode>"

    # * I see availability time "<period>"
    Examples:
      | quiz   | name   | description   | count | score | mode                | time limit |
      | Quiz A | Quiz A | Description A | 3     | 66    | Feedback at the end | 120        |
      | Quiz B | Quiz B | Description B | 4     | 75    | Continuous feedback | 60         |


  @feature-flag
  Scenario: Quiz welcome page shows cohort leaderboard before start
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
    And quiz "Quiz A" with questions "Q1"
    When I open quiz "Quiz A"
    Then I see the welcome page
    And I see the cohort leaderboard
      | Rank | Cohort        | Score |
      | 1    | Team Rocket   | 92    |
      | 2    | Scrum Ninjas  | 88    |
      | 3    | Retro Masters | 75    |
