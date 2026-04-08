Feature: Displaying an image for a question
  Questions can optionally have an image URL. When present,
  the image is displayed to the quiz taker.

  Scenario: User sees the question image when answering
    Given question "Which animal is on the picture?"
      * with image "https://placekitten.com/300/200.jpg"
      * with answers:
        | Cat | * |
        | Dog |   |
      * saved and bookmarked as "Animals"
    When I take question "Animals"
    Then I see the question image

  Scenario: No image when question has no image URL
    Given question "2 + 2 = ?"
      * with answers:
        | 4 | * |
        | 5 |   |
      * saved and bookmarked as "Math"
    When I take question "Math"
    Then I do not see a question image
