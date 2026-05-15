import type { DataTable } from '@cucumber/cucumber'

import { Then, When } from '#steps/fixture.ts'
import {
    expectCohortRowsInOrder,
    expectQuizTakeLinkFor,
    expectShareScreenError,
    expectUniqueTakeLinks,
} from '#steps/make/quiz/expects.ts'
import { fetchWorkspaceQuizViaRest } from '#steps/shared/api.ts'

When('I navigate to share quiz {string}', async function (quizName: string) {
    await this.workspacePage.shareQuiz(quizName)
})

Then('I see the quiz take link for {string}', async function (quizName: string) {
    const quiz = await fetchWorkspaceQuizViaRest(this, quizName)
    const origin = new URL(this.page.url()).origin
    await expectQuizTakeLinkFor(this.quizSharePage, `/quiz/${quiz.id}`, origin)
})

Then('I see no cohorts', async function () {
    await this.quizSharePage.expectNoCohorts()
})

When('I follow the quiz take link', async function () {
    await this.quizSharePage.clickTakeLink()
})

Then('I see the {string} welcome page', async function (quizName: string) {
    await this.quizWelcomePage.expectHeader('Welcome to the quiz')
    await this.quizWelcomePage.expectName(quizName)
})

Then('I see cohorts in alphabetical order', async function (data: DataTable) {
    await expectCohortRowsInOrder(
        this.quizSharePage,
        data.raw().map(row => row[0]),
    )
})

Then('I see a unique quiz take link for each cohort', async function () {
    await expectUniqueTakeLinks(this.quizSharePage)
})

Then('I see error {string} on the share screen', async function (testId: string) {
    await expectShareScreenError(this.quizSharePage, testId)
})
