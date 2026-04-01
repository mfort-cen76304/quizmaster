Feature: Question tag field
  The question creation form has a dedicated tag field separate from the question title.
  When a question is saved, the tag is combined into the stored title as [tag] title.
  When editing a tagged question, the tag is pre-filled in the tag field and the
  question field contains only the title without the bracket prefix.

  Scenario: Creating a question with a tag shows bracket prefix in workspace
    Given workspace "Tags"
    When I start creating a new question
    * I enter tag "scrum"
    * I enter question "What is a Sprint?"
    * I enter answers
      | A time-boxed iteration | * |
      | An agile ceremony      |   |
    * I submit the question
    Then I see question in list "[scrum] What is a Sprint?"

  Scenario: Taker does not see tag entered via tag field
    Given a question "What is a Sprint?"
    * with tag "scrum"
    * with answers:
      | A time-boxed iteration | * |
      | An agile ceremony      |   |
    * saved and bookmarked as "Sprint"
    When I take question "Sprint"
    Then I see question title "What is a Sprint?"

  Scenario: Edit form has tag field prepopulated for tagged question
    Given a question "What is a Sprint?"
    * with tag "scrum"
    * with answers:
      | A time-boxed iteration | * |
      | An agile ceremony      |   |
    * saved and bookmarked as "Sprint"
    When I start editing question "Sprint"
    Then I see tag "scrum"
    And I see question text "What is a Sprint?"
