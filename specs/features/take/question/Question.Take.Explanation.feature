Feature: Question explanations after answering
  After answering a question, explanations provide educational context.
  - Single choice: shows the question-level explanation
  - Multiple choice: shows individual answer explanations for all answers,
    plus the question-level explanation

  Scenario Outline: Single choice question explanation
    Explanation is displayed after answering the question
    - for the selected answer only
    - for the whole question

    Given question "What is capital of Italy?"
    * with answers:
      | Rome     | * | Rome is the capital of Italy              |
      | Naples   |   | Naples is the capital of Campania region  |
      | Florence |   | Florence is the capital of Tuscany region |
      | Palermo  |   | Palermo is the capital of Sicily region   |
    * with explanation "Rome is the capital city of Italy. It is also the capital of the Lazio region"
    * saved and bookmarked as "Italy"
    When I take question "Italy"
    * I answer "Naples"
    # Then I see the answer explanation "Naples is the capital of Campania region"
    * I see the question explanation

  Scenario: Multiple choice question explanations
    Explanation is displayed after answering the question
    - for all answers individually, selected or not
    - for the whole question

    Given question "Which of these countries are in Europe?"
    * with answers:
      | Italy   | * | Located on the Apennine Peninsula, which is part of the European continent. |
      | France  | * | One of the founders of the European Union.                                  |
      | Morocco |   | This country is in Africa, not in Europe.                                   |
      | Spain   | * | Located on the Iberian Peninsula, which is part of the European continent.  |
      | Canada  |   | Located in America.                                                         |
    * with explanation "Italy, France, and Spain are in Europe. Morocco is in Africa."
    * saved and bookmarked as "Europe"
    When I take question "Europe"
    And I answer "France, Morocco, Spain"
    Then I see individual explanations per answer:
      | answer  | explanation                                                                 |
      | Italy   | Located on the Apennine Peninsula, which is part of the European continent. |
      | France  | One of the founders of the European Union.                                  |
      | Morocco | This country is in Africa, not in Europe.                                   |
      | Spain   | Located on the Iberian Peninsula, which is part of the European continent.  |
      | Canada  | Located in America.                                                         |
    * I see the question explanation

  Scenario: Numerical question explanation
    Explanation is displayed after answering a numerical question
    - for the whole question
    Given question "One and only correct numerical answer"
      * with numerical answer "54"
      * with explanation "54 is the correct answer because of reasons."
      * saved and bookmarked as "Numbers"
    When I take question "Numbers"
    And I enter "14"
    Then I see the question explanation
