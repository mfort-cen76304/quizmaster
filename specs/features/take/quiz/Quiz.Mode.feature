Feature: Quiz exam and learn mode
  Quizzes support two modes that control when feedback is shown:
  - Exam mode: submitting an answer immediately advances to the next question
  - Learn mode: shows feedback after each answer; user must manually proceed
    to the next question, and can retake the current question

  Background:
    Given workspace "Modes" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    And quiz "Exam Quiz" with all questions
      | mode | exam |
    And quiz "Learn Quiz" with all questions
      | mode | learn |


  Scenario: Exam mode
    - Submitting an answer proceeds directly to the next question

    When I start quiz "Exam Quiz"
    And I see question "Jaký nábytek má Ikea?"
    When I answer "Stůl"
    Then I see question "Jaké nádobí má Ikea?"


  Scenario: Learn mode
    - Shows feedback after each question, manual proceed required

    When I start quiz "Learn Quiz"
    And I see question "Jaký nábytek má Ikea?"
    When I answer "Stůl"
    Then I see feedback "Correct!"
    When I proceed to the next question
    Then I see question "Jaké nádobí má Ikea?"


  Scenario: Learn mode - Retake question
    - User can retake a question and see updated feedback

    When I start quiz "Learn Quiz"
    And I see question "Jaký nábytek má Ikea?"
    When I answer "Stůl"
    Then I see feedback "Correct!"
    When I answer "Auto"
    Then I see feedback "Incorrect!"
