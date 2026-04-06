import { Then } from '#steps/fixture.ts'

Then('I see the welcome page', async function () {
    await this.quizWelcomePage.expectHeader('Welcome to the quiz')
})

Then('I see quiz name {string}', async function (quizName: string) {
    await this.quizWelcomePage.expectName(quizName)
})

Then('I see quiz description {string}', async function (description: string) {
    await this.quizWelcomePage.expectDescription(description)
})

Then('I see question count {int}', async function (questionCount: number) {
    await this.quizWelcomePage.expectQuestionCount(questionCount)
})

Then('I see feedback type {string}', async function (feedbackType: string) {
    await this.quizWelcomePage.expectFeedback(feedbackType)
})

Then('I see pass score {int} %', async function (passScore: number) {
    await this.quizWelcomePage.expectPassScore(passScore)
})

Then('I see time limit set to {string} seconds', async function (timeLimit: string) {
    await this.quizWelcomePage.expectTimeLimit(timeLimit)
})
