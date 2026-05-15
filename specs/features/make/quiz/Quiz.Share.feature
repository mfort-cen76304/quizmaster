Feature: Share Quiz
  From the workspace, a maker opens the Share screen for a quiz to
  obtain shareable links. The screen exposes the quiz take link and
  lets the maker create cohorts; each cohort has its own shareable link.
  Cohort creation is the only write operation — cohorts cannot be
  renamed, reordered, or removed from this screen.

  Background:
    Given quiz "Cohort Quiz" with 2 questions


  Scenario: Open the Share screen and see the quiz take link
    When I navigate to share quiz "Cohort Quiz"
    Then I see the quiz take link for "Cohort Quiz"
    And I see no cohorts

    When I follow the quiz take link
    Then I see the "Cohort Quiz" welcome page


  @skip
  Scenario: List multiple cohorts in order of creation
    When I navigate to share quiz "Cohort Quiz"
    * I create a new cohort "Girlz"
    * I create a new cohort "Boyz"
    * I create a new cohort "Mixed"
    Then I see cohorts in order
      | Boyz  |
      | Girlz |
      | Mixed |
    And I see a unique quiz take link for each cohort


  @skip
  Scenario: Reject blank cohort name
    When I navigate to share quiz "Cohort Quiz"
    * I create a new cohort ""
    Then I see no cohorts
    And I see error "empty-cohort-name" on the share screen


  @skip
  Scenario: Reject duplicate cohort name
    Given I navigate to share quiz "Cohort Quiz"
    * I create a new cohort "Ladies"
    * I see cohorts in order
      | Ladies |
    When I create a new cohort "Ladies"
    Then I see cohorts in order
      | Ladies |
    And I see error "duplicate-cohort-name" on the share screen
