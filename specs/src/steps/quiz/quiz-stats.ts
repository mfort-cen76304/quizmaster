import type { DataTable } from '@cucumber/cucumber'

import { Given, Then, When } from '#specs/steps/fixture.ts'
import { expectAttemptStatsTable, expectStatsTable, expectSummaryStatsTable } from '#specs/steps/quiz/expects.ts'
import {
    takeQuizWithAnswers,
    takeQuizWithAnswersTimed,
    takeQuizWithoutCompletingInTimeLimit,
} from '#specs/steps/quiz/ops.ts'

Given('I take quiz {string} with answer(s)', async function (quizName: string, data: DataTable) {
    await takeQuizWithAnswers(this, quizName, data)
})

When(
    'I take quiz {string} with answers in {int} seconds',
    async function (quizName: string, timer: number, data: DataTable) {
        await takeQuizWithAnswersTimed(this, quizName, timer, data)
    },
)

When('I take quiz {string} which I do not complete in time limit', async function (quizName: string, data: DataTable) {
    await takeQuizWithoutCompletingInTimeLimit(this, quizName, data)
})

Then('I see stats page for quiz {string}', async function (quizName: string) {
    await this.quizStatsPage.expectPageHeading(`Statistics for quiz: ${quizName}`)
})

Then('I see stats table', async function (data: DataTable) {
    await expectStatsTable(this.quizStatsPage, data)
})

Then('I see summary stats table', async function (data: DataTable) {
    await expectSummaryStatsTable(this.quizStatsPage, data)
})

Then('I see attempt stats table', async function (data: DataTable) {
    await expectAttemptStatsTable(this.quizStatsPage, data)
})
