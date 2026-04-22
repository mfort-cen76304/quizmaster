Feature: Quiz dry run
  A quiz maker can dry-run their own quiz to preview it as a taker would.
  Dry-run attempts are excluded from statistics and bypass the quiz's scheduled
  availability window. Time limit and all other quiz rules still apply.


  Scenario: Maker starts a dry run from the workspace
    Given workspace "Preview" with questions
      | bookmark | question  | answers   |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz" with questions "Q1, Q2"
    When I start a dry run of quiz "Quiz"
    Then I see the welcome page
    * I see a dry-run indicator
    * I can start the quiz


  Scenario: Dry run ignores scheduling before the availability window
    Given workspace "Preview" with questions
      | bookmark | question  | answers   |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz" with questions "Q1, Q2"
      | start date | today + 1 |
      | end date   | today + 2 |
    When I start a dry run of quiz "Quiz"
    Then I see the welcome page
    * I see a dry-run indicator
    * I can start the quiz


  Scenario: Dry run ignores scheduling after the availability window
    Given workspace "Preview" with questions
      | bookmark | question  | answers   |
      | Q1       | 1 + 1 = ? | 2 (*), 3  |
      | Q2       | 2 + 2 = ? | 4 (*), 5  |
    And quiz "Quiz" with questions "Q1, Q2"
      | start date | today - 2 |
      | end date   | today - 1 |
    When I start a dry run of quiz "Quiz"
    Then I see the welcome page
    * I see a dry-run indicator
    * I can start the quiz


  Scenario: Dry run still enforces the time limit
    Given quiz "Quiz" with 2 questions
      | time limit | 5s |
    When I start a dry run of quiz "Quiz"
    * I start the dry run
    * I answer correctly
    * 5 seconds pass
    Then I see the timeout message


  Scenario: Dry-run attempts are excluded from statistics
    Given quiz "Quiz" with 2 questions

    # A normal attempt that should count
    When I start the quiz
    * I answer 2 questions correctly
    * I finish the quiz in 10 seconds

    # A dry run that should NOT count
    When I start a dry run of quiz "Quiz"
    * I start the dry run
    * I answer 2 questions incorrectly
    * I finish the quiz in 20 seconds

    When I open quiz "Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Incorrect Answers | Score | Status   |
      | 10s      | 2/2    | 2 (100%)        | 0 (0%)            | 100   | Finished |
    And I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       1 |        1 |          0 |       0 |
