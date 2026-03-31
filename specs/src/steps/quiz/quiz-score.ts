import { expect } from '@playwright/test'

import { Given, Then, When } from 'steps/fixture.ts'
import {
    expectAllOptionsForQuestion,
    expectOriginalResult,
    expectOriginalResultNotVisible,
    expectQuizResult,
} from 'steps/quiz/expects.ts'

Given('I finish the quiz', async function () {
    await this.page.goto('quiz/score')
})

Then(
    /^I see the result (\d+.?\d*) correct out of (\d+), (\d+)%, (passed|failed), required passScore (\d+)%/,
    async function (
        expectedCorrectAnswers: string,
        expectedTotalQuestions: number,
        expectedPercentage: number,
        expectedTextResult: string,
        expectedPassScore: number,
    ) {
        await expectQuizResult(
            this.quizScorePage,
            expectedCorrectAnswers,
            expectedTotalQuestions,
            expectedPercentage,
            expectedTextResult,
            expectedPassScore,
        )
    },
)

Then('I see the correct number of questions {int}', async function (expectedTotalQuestions: number) {
    await this.quizScorePage.expectTotalQuestions(expectedTotalQuestions)
})

Then(
    /^I see the original result (\d+), (\d+)%, (passed|failed)/,
    async function (
        expectedOriginalCorrectAnswers: number,
        expectedOriginalPercentage: number,
        expectedOriginalTextResult: string,
    ) {
        await expectOriginalResult(
            this.quizScorePage,
            expectedOriginalCorrectAnswers,
            expectedOriginalPercentage,
            expectedOriginalTextResult,
        )
    },
)

Then("I don't see the original results", async function () {
    await expectOriginalResultNotVisible(this.quizScorePage)
})

Then('I see the question {string}', async function (question: string) {
    const questions: string[] = await this.quizScorePage.questions()
    expect(questions).toContain(question)
})

Then('I see all options for question {string}', async function (question: string) {
    await expectAllOptionsForQuestion(this.quizScorePage, question, this.questionBookmarks[question].answers)
})

Then('I see explanation {string} for question {string}', async function (explanation: string, question: string) {
    const explanations: string[] = await this.quizScorePage.explanations(question)
    expect(explanations).toContain(explanation)
})

Then(
    'I see question explanation {string} for question {string}',
    async function (explanationOrig: string, question: string) {
        const explanation = await this.quizScorePage.questionExplanation(question)
        expect(explanation).toBe(explanationOrig)
    },
)

Then('I see user select {string} for question {string}', async function (userSelect: string, question: string) {
    const answerLabel = await this.quizScorePage.checkedAnswerLabel(question)
    expect(answerLabel).toBe(userSelect)
})

Then(
    'I see corresponding response {string} for answer {string} for question {string}',
    async function (response: string, answer: string, question: string) {
        const answerResponse = await this.quizScorePage.answerCorrespondingResponse(question, answer)
        expect(answerResponse).toBe(response)
    },
)

When('I retake only incorrectly answered questions', async function () {
    await this.quizScorePage.retakeIncorrect()
})
