import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { parseAnswers } from '#steps/question/ops.ts'
import { createNumericalQuestionInAutoWorkspace, createQuestionInAutoWorkspace } from '#steps/workspace/ops.ts'

Given(
    'a numerical question {string} with correct answer {string} bookmarked as {string}',
    async function (question: string, correctAnswer: string, bookmark: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer)
    },
)

Given(
    'a numerical question {string} with correct answer {string} and tolerance {string} bookmarked as {string}',
    async function (question: string, correctAnswer: string, tolerance: string, bookmark: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer, undefined, tolerance)
    },
)

Given(
    'a numerical question {string} with correct answer {string} bookmarked as {string} with explanation {string}',
    async function (question: string, correctAnswer: string, bookmark: string, explanation: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer, explanation)
    },
)

Given('questions', async function (data: DataTable) {
    for (const row of data.hashes()) {
        const { bookmark, question, answers, easy, explanation } = row
        const isEasy = easy === 'true'
        const answerRawTable = parseAnswers(answers)

        await createQuestionInAutoWorkspace(this, bookmark, question, answerRawTable, isEasy, explanation)
    }
})
