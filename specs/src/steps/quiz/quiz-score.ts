import { expect } from '@playwright/test'

import { Then, When } from '#steps/fixture.ts'
import { expectAllOptionsForQuestion, expectQuizResult } from '#steps/quiz/expects.ts'

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

Then('I see the question {string}', async function (question: string) {
    const questions: string[] = await this.quizScorePage.questions()
    expect(questions).toContain(question)
})

Then('I see all options for question {string}', async function (question: string) {
    await expectAllOptionsForQuestion(this.quizScorePage, question, this.questionBookmarks[question].answers)
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

When('I retake only incorrectly answered questions', async function () {
    await this.quizScorePage.retakeIncorrect()
})
