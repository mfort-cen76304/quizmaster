import { Then } from '#steps/fixture.ts'

Then('I see selected question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectSelectedQuestionCount(expectedCount)
})

Then('I see total question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectTotalQuestionCount(expectedCount)
})
