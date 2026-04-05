import { expect } from '@playwright/test'

import { Then, When } from '#steps/fixture.ts'

Then('I see a number input', async function () {
    await expect(this.takeQuestionPage.numericalInputLocator()).toBeVisible()
})

When('I enter {string}', async function (answer: string) {
    await this.takeQuestionPage.fillNumericalAnswer(answer)
})
