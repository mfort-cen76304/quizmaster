import type { DataTable } from '@cucumber/cucumber'

import { Given, Then, When } from '#steps/fixture.ts'
import { expectAttemptStatsTable, expectSummaryStatsTable } from '#steps/quiz/expects.ts'
import { finishQuizInSeconds, takeQuizWithAnswers, takeQuizWithAnswersTimed } from '#steps/quiz/ops.ts'

Given('I take quiz {string} with answer(s)', async function (quizName: string, data: DataTable) {
    await takeQuizWithAnswers(this, quizName, data)
})

When(
    'I take quiz {string} with answers in {int} seconds',
    async function (quizName: string, timer: number, data: DataTable) {
        await takeQuizWithAnswersTimed(this, quizName, timer, data)
    },
)

When('the quiz finishes in {int} seconds', async function (seconds: number) {
    await finishQuizInSeconds(this, seconds)
})

Then('I see empty attempt stats table', async function () {
    await this.quizStatsPage.expectAttemptStatsRowCount(0)
})

Then('I see summary stats table', async function (data: DataTable) {
    await expectSummaryStatsTable(this.quizStatsPage, data)
})

Then('I see attempt stats table', async function (data: DataTable) {
    await expectAttemptStatsTable(this.quizStatsPage, data)
})
