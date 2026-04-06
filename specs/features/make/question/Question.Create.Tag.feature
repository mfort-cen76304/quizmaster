Feature: Question tag
  Questions can have an optional tag. Tags are displayed as colored badges
  in question lists (workspace and quiz creation). Takers do not see the tag.

  Scenario: Tag badges in question lists
    Given workspace "Tags" with questions
      | question           | tag   | answers                              |
      | What is a Sprint?  | scrum | Time-boxed iteration (*), A ceremony |
      | What is a Backlog? |       | Ordered list (*), Random list        |
    Then I see tag badge "scrum" for question "What is a Sprint?"
    And I do not see tag badge for question "What is a Backlog?"
    When I start creating a new quiz
    Then I see tag badge "scrum" for quiz question "What is a Sprint?"
    And I do not see tag badge for quiz question "What is a Backlog?"
