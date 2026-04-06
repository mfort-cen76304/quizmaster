import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { Then } from '#steps/fixture.ts'
import { expectAllOptionsForQuestion, expectQuizResult } from '#steps/quiz/expects.ts'

Then('I see the quiz result', async function (data: DataTable) {
    const [row] = data.hashes()
    const [correct, total] = row['Correct Answers'].split('/').map((s: string) => s.trim())
    await this.quizScorePage.expectResultTableVisible()
    await expectQuizResult(
        this.quizScorePage,
        correct,
        Number(total),
        Number(row.Score),
        row.Result,
        Number(row['Pass Score']),
    )
})

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
