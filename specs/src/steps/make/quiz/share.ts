import { expect } from '@playwright/test'

import { Then, When } from '#steps/fixture.ts'
import { fetchWorkspaceQuizViaRest } from '#steps/shared/api.ts'

When('I navigate to share quiz {string}', async function (quizName: string) {
    await this.workspacePage.shareQuiz(quizName)
})

Then('I see the quiz take link for {string}', async function (quizName: string) {
    const quiz = await fetchWorkspaceQuizViaRest(this, quizName)
    const href = await this.quizSharePage.takeLink()
    const baseUrl = this.page.url().replace(/\/workspace\/.*$/, '')
    expect(href).toBe(`${baseUrl}/quiz/${quiz.id}`)
})

Then('I see no cohorts', async function () {
    expect(await this.quizSharePage.hasCohorts()).toBe(false)
})

When('I follow the quiz take link', async function () {
    await this.quizSharePage.clickTakeLink()
})

Then('I see the {string} welcome page', async function (quizName: string) {
    await this.quizWelcomePage.expectHeader('Welcome to the quiz')
    await this.quizWelcomePage.expectName(quizName)
})
