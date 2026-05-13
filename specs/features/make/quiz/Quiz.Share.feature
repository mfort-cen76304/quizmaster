Feature: Share URL for cohort
  Share a unique URL for a cohort member to take a quiz.

  @skip
  Scenario: Share quiz to cohort
    Given workspace "Edit Quiz" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
      | 4 / 2 = ? | 2 (*), 3 |
    And quiz "Math Quiz" with all questions and cohorts
      | Cohort | guid                                 |
      | Girls  | 550e8400-e29b-41d4-a716-446655440000 |
      | Boys   | 36f28917-f5d0-4a55-9b7f-8b3c9c7e1d2a |
    When user shares "Math Quiz"
    Then I see URLs with the following components
      | Cohort | guid                                 |
      | Girls  | 550e8400-e29b-41d4-a716-446655440000 |
      | Boys   | 36f28917-f5d0-4a55-9b7f-8b3c9c7e1d2a |
