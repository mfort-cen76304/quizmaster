Feature: Create question with image
  Quiz makers can add an optional image URL to a question
  for visual quizzes. A preview is shown in the form.

  Scenario: Enter image URL with preview
    Given I start creating a new question
    When I enter image URL "https://placekitten.com/300/200.jpg"
    Then I see image preview


  Scenario: Image URL is optional
    Given I start creating a new question
    Then I do not see image preview
