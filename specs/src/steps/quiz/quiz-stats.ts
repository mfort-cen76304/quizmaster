import type { DataTable } from '@cucumber/cucumber'

import { Then, When } from '#steps/fixture.ts'
import { expectAttemptStatsTable, expectSummaryStatsTable } from '#steps/quiz/expects.ts'
import { finishQuizInSeconds } from '#steps/quiz/ops.ts'

When('I finish the quiz in {int} seconds', async function (seconds: number) {
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
