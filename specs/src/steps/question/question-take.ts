import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'
import { Then, When } from '#steps/fixture.ts'
import { expectColorFeedback, expectQuestion } from '#steps/question/expects.ts'
import { answerQuestion } from '#steps/question/ops.ts'

When('I take question {string}', async function (bookmark: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.takeQuestion(this.questionBookmarks[bookmark].question)
    this.activeQuestionBookmark = bookmark
})

Then('I see the question and the answers', async function () {
    await expectQuestion(this.takeQuestionPage, this.activeQuestion)
})

When('I answer {string}', async function (answerList: string) {
    await answerQuestion(this, answerList)
})

When(/^I press the key ([0-9](?:,[0-9])*)$/, async function (keysInput: string) {
    const keys = keysInput
        .split(',')
        .map(key => key.trim())
        .filter(key => key.length > 0)

    if (keys.length === 0) {
        throw new Error('At least one key must be provided')
    }

    await this.page.click('body')

    for (const key of keys) {
        const num = Number(key)
        if (!Number.isInteger(num) || num < 1 || num > 9) {
            throw new Error(`Invalid numeric key: ${key}. Allowed keys are 1-9.`)
        }

        await this.page.keyboard.press(`Numpad${num}`)
    }
})

When('I press enter to submit', async function () {
    await this.page.click('body')
    await this.page.keyboard.press('Enter')
})

When('I uncheck answer {string}', async function (answerList: string) {
    const answers = this.parseAnswers(answerList)
    for (const answer of answers) {
        await this.takeQuestionPage.unselectAnswer(answer)
    }
})

When('I check answer {string}', async function (answerList: string) {
    const answers = this.parseAnswers(answerList)
    for (const answer of answers) {
        await this.takeQuestionPage.selectAnswer(answer)
    }
})

When('I submit question', async function () {
    await this.takeQuestionPage.submit()
})

Then('I see feedback {string}', async function (feedback: string) {
    await expectTextToBe(this.takeQuestionPage.questionFeedbackLocator(), feedback)
})

Then('I see score {string}', async function (score: string) {
    await expectTextToBe(this.takeQuestionPage.questionScoreLocator(), score)
})

Then('no answer is selected', async function () {
    await this.takeQuestionPage.expectNoAnswerSelected()
})

Then('I see the question explanation', async function () {
    await expectTextToBe(this.takeQuestionPage.questionExplanationLocator(), this.activeQuestion.explanation)
})

Then('I see individual explanations per answer:', async function (dataTable: DataTable) {
    const rows = dataTable.hashes()
    for (const row of rows) {
        const { answer, explanation } = row
        await expect(this.takeQuestionPage.answerExplanationLocator(answer)).toHaveText(explanation)
    }
})

Then('I see the {string} question for the quiz', async function (questionName: string) {
    await this.takeQuestionPage.expectQuestionText(questionName)
})

Then('I see individual color feedback per answer:', async function (dataTable: DataTable) {
    await expectColorFeedback(this.takeQuestionPage, dataTable.hashes())
})

Then('I see that question has number of correct answers displayed', async function () {
    await this.takeQuestionPage.expectCorrectAnswersCountAttached()
})

Then('I see that the question has {int} correct answers', async function (count: number) {
    await this.takeQuestionPage.expectCorrectAnswersCount(count)
})

Then('I do not see correct answers count', async function () {
    await this.takeQuestionPage.expectSubmitVisible()
    await this.takeQuestionPage.expectCorrectAnswersCountNotAttached()
})

Then('I see the question image', async function () {
    await this.takeQuestionPage.expectQuestionImage()
})

Then('I do not see a question image', async function () {
    await this.takeQuestionPage.expectNoQuestionImage()
})

Then('I see question title {string}', async function (text: string) {
    await this.takeQuestionPage.expectQuestionText(text)
})
