Feature: Edit CR_Quiz from Workspace and mark questions belonging to the quiz

  Background:
    Given workspace "CR_Quiz" with questions
      | question  | answers                        |
      | Question1 | answer1 , answer2 (*), answer3 |
      | Question2 | answer1 (*), answer2, answer3  |
      | Question3 | answer1, answer2 (*), answer3  |
      | Question4 | answer1 , answer2 (*), answer3 |
    And quiz "CR_Quiz" with questions "Question1, Question2"


  Scenario Outline: Mark the questions belonging to the quiz
    When I navigate to edit quiz "CR_Quiz"
    And questions belonging to the quiz are marked
    Then I see question is marked "<selectedQuestion1>"
    And I see question is marked "<selectedQuestion2>"
    And I see question is not marked "<notselectedQuestion3>"
    And I see question is not marked "<notselectedQuestion4>"

    Examples:
      | selectedQuestion1 | selectedQuestion2 | notselectedQuestion3 | notselectedQuestion4 |
      | Question1         | Question2         | Question3            | Question4            |
