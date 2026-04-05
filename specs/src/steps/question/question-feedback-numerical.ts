import { expect } from '@playwright/test'

import { Then, When } from '#specs/steps/fixture.ts'

Then('I see a number input', async function () {
    await expect(this.takeQuestionPage.numericalInputLocator()).toBeVisible()
})

Then('number input is focused', async function () {
    const input = this.takeQuestionPage.numericalInputLocator()
    await expect(input).toBeFocused()
})

When('I enter {string}', async function (answer: string) {
    await this.takeQuestionPage.fillNumericalAnswer(answer)
})
