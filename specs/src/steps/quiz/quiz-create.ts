import type { DataTable } from '@cucumber/cucumber'

import { Given, Then } from '#steps/fixture.ts'
import { createQuizViaUI } from '#steps/quiz/ops.ts'
import { parseKey } from '#steps/world'
import { createTrivialQuestions, ensureWorkspace, navigateToWorkspace } from '#steps/workspace/ops.ts'

Given('a quiz {string} with {int} questions', async function (quizName: string, n: number, properties?: DataTable) {
    await ensureWorkspace(this)
    await navigateToWorkspace(this)
    await createTrivialQuestions(this, n)
    const allBookmarks = Object.keys(this.questionBookmarks)
    await createQuizViaUI(this, quizName, allBookmarks, properties)
})

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
