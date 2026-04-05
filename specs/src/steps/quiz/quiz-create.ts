import type { DataTable } from '@cucumber/cucumber'

import { Given, Then } from '#specs/steps/fixture.ts'
import { createQuizViaUI } from '#specs/steps/quiz/ops.ts'
import { parseKey } from '#specs/steps/world'

Given('a quiz {string} with all questions', async function (quizName: string, properties?: DataTable) {
    const allBookmarks = Object.keys(this.questionBookmarks)
    await createQuizViaUI(this, quizName, allBookmarks, properties)
})

Given(
    'a quiz {string} with questions {string}',
    async function (quizName: string, bookmarkList: string, properties?: DataTable) {
        const bookmarks = parseKey(bookmarkList)
        await createQuizViaUI(this, quizName, bookmarks, properties)
    },
)

Then('I see selected question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectSelectedQuestionCount(expectedCount)
})

Then('I see total question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectTotalQuestionCount(expectedCount)
})
