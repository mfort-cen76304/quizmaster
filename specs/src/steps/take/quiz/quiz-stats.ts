import type { DataTable } from '@cucumber/cucumber'

import { advanceServerClock } from '#steps/clock.ts'
import { Then, When } from '#steps/fixture.ts'
import { expectAttemptStatsTable, expectQuestionStatsTable, expectSummaryStatsTable } from '#steps/quiz/expects.ts'
import { finishQuizInSeconds } from '#steps/quiz/ops.ts'

When('I finish the quiz in {int} seconds', async function (seconds: number) {
    await finishQuizInSeconds(this, seconds)
})

When('{int} seconds elapse', async function (seconds: number) {
    await advanceServerClock(this, seconds)
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

Then('I see question stats table', async function (data: DataTable) {
    await expectQuestionStatsTable(this.quizStatsPage, data)
})
