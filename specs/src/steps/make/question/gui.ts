import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { type TableOf, toText } from '#steps/common.ts'
import { Given, Then, When } from '#steps/fixture.ts'
import {
    expectAnswer,
    expectDeleteButtonsState,
    expectEmptyAnswers,
    expectErrorCount,
    expectErrorMessages,
} from '#steps/question/expects.ts'
import {
    addAnswers,
    type AnswerRaw,
    enterAnswer,
    enterAnswerExplanation,
    enterTag,
    enterAnswerText,
    enterImageUrl,
    enterQuestion,
    enterQuestionExplanation,
    markAnswerCorrectness,
    submitQuestion,
    enterAIPrompt,
} from '#steps/question/ops.ts'
import { ensureWorkspace, navigateToWorkspace } from '#steps/workspace/ops.ts'
import { emptyQuestion } from '#steps/world'

Given('I start creating a question', async function () {
    await ensureWorkspace(this)
    await navigateToWorkspace(this)
    await this.workspacePage.createNewQuestion()
    this.questionWip = emptyQuestion()
})

Given('page {string}', async () => {
    // marker step used in some scenarios for readability
})

When('I start creating a new question', async function () {
    await this.workspacePage.createNewQuestion()
})

Given('I start editing question {string}', async function (bookmark: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.editQuestion(this.questionBookmarks[bookmark].question)
    this.activeQuestionBookmark = bookmark
})

When('I enable explanations', async function () {
    await this.questionEditPage.enableExplanations()
})

When('I disable explanations', async function () {
    await this.questionEditPage.disableExplanations()
})

// Title assertions

Then('I see question edit page', async function () {
    await this.questionEditPage.expectEditPageVisible()
})

Then('I see the question creation page', async function () {
    await this.questionEditPage.expectCreatePageVisible()
})

When('I go back to the workspace {string}', async function () {
    await this.questionEditPage.back()
})

// Field assertions

Then('I see empty question text', async function () {
    await this.questionEditPage.expectQuestionValue('')
})

Then('I see question text {string}', async function (question: string) {
    await this.questionEditPage.expectQuestionValue(question)
})

When('I enter tag {string}', async function (tag: string) {
    await enterTag(this, tag)
})

Then('I see tag {string}', async function (tag: string) {
    await this.questionEditPage.expectTagValue(tag)
})

Then('I see empty tag', async function () {
    await this.questionEditPage.expectEmptyTag()
})

Then(/I see explanations are (enabled|disabled)/, async function (value: string) {
    if (value === 'enabled') {
        await this.questionEditPage.expectExplanationsChecked()
    } else {
        await this.questionEditPage.expectExplanationsUnchecked()
    }
})

Then(/the question is (single|multiple|numerical) choice/, async function (value: string) {
    const expectedType = value === 'numerical' ? 'numerical' : value === 'multiple' ? 'multiple' : 'single'
    await this.questionEditPage.expectQuestionType(expectedType)
})

Then('I see numerical answer field', async function () {
    await this.questionEditPage.expectNumericalAnswerVisible()
})

Then('I do not see answer fields', async function () {
    await this.questionEditPage.expectAnswerRowCount(0)
})

Then('I do not see Add Answer button', async function () {
    await this.questionEditPage.expectAddAnswerNotVisible()
})

Then('I see numerical correct answer {string}', async function (value: string) {
    await this.questionEditPage.expectNumericalCorrectAnswer(value)
})

Then('I see tolerance {string}', async function (value: string) {
    await this.questionEditPage.expectNumericalTolerance(value)
})

Then(/easy is (on|off)/, async function (value: string) {
    if (value === 'on') {
        await this.questionEditPage.expectEasyChecked()
    } else {
        await this.questionEditPage.expectEasyUnchecked()
    }
})

Then(/easy is (available|not available)/, async function (value: string) {
    if (value === 'available') {
        await this.questionEditPage.expectEasyVisible()
    } else {
        await this.questionEditPage.expectEasyNotVisible()
    }
})

Then('I do not see AI section', async function () {
    await this.questionEditPage.expectAiBlockNotVisible()
})

Then('I see explanation fields', async function () {
    await this.questionEditPage.expectExplanationFieldsExist()
})

Then('I do not see explanation fields', async function () {
    await this.questionEditPage.expectNoExplanationFields()
})

Then('I see 2 default empty answers', async function () {
    await this.questionEditPage.expectAnswerRowCount(2)

    await expectEmptyAnswers(this.questionEditPage, 0)
    await expectEmptyAnswers(this.questionEditPage, 1)

    await expectDeleteButtonsState(this.questionEditPage)
})

Then(/I see answer (\d+) as (correct|incorrect)/, async function (index: number, correctness: string) {
    if (correctness === 'correct') {
        await this.questionEditPage.expectAnswerCorrect(index - 1)
    } else {
        await this.questionEditPage.expectAnswerIncorrect(index - 1)
    }
})

Then('I see the answers fields', async function (data: TableOf<AnswerRaw>) {
    const answers = data.raw()

    await this.questionEditPage.expectAnswerRowCount(answers.length)

    let i = 0
    for (const [answer, star, explanation] of answers) {
        await expectAnswer(this.questionEditPage, i++, answer, star === '*', explanation)
    }
})

Then('I see empty question explanation', async function () {
    await this.questionEditPage.expectQuestionExplanation('')
})

Then('I see question explanation {string}', async function (explanation: string) {
    await this.questionEditPage.expectQuestionExplanation(explanation)
})

Then('I see at least {int} answers', async function (count: number) {
    await this.questionEditPage.expectAnswerRowCountGreaterThanOrEqual(count)
})

Then('exactly {int} answer is marked correct', async function (count: number) {
    await this.questionEditPage.expectCorrectAnswerCount(count)
})

Then('at least {int} answers are marked correct', async function (count: number) {
    await this.questionEditPage.expectCorrectAnswerCountGreaterThanOrEqual(count)
})

Then('all answers have explanations', async function () {
    await this.questionEditPage.expectAllAnswersHaveExplanations()
})

Then('Question field is not empty', async function () {
    await this.questionEditPage.expectQuestionValueNotEmpty()
})

// Field edits

When('I enter question {string}', async function (question: string) {
    await enterQuestion(this, question)
})

When('I ask AI:', async function (dataTable: DataTable) {
    await enterAIPrompt(this, toText(dataTable))
    // Wait on the actual API response, not the textarea content. The latter
    // is unreliable on regenerate (the previous response makes "not empty"
    // resolve immediately, before the new response arrives).
    await Promise.all([
        this.page.waitForResponse(response => response.url().includes('/api/ai-assistant') && response.ok(), {
            timeout: 60_000,
        }),
        this.questionEditPage.clickAiAssist(),
    ])
})

When(/I mark the question as (single|multiple|numerical) choice/, async function (choice: string) {
    if (choice === 'single') {
        await this.questionEditPage.setSingleChoice()
    } else if (choice === 'multiple') {
        await this.questionEditPage.setMultipleChoice()
    } else {
        await this.questionEditPage.setNumericalChoice()
    }
})

When('I enter numerical correct answer {string}', async function (value: string) {
    await this.questionEditPage.enterNumericalCorrectAnswer(value)
})

When('I set tolerance to {string}', async function (value: string) {
    await this.questionEditPage.enterNumericalTolerance(value)
})

When('I enter answer {int} text {string}', async function (index: number, answer: string) {
    await enterAnswerText(this, index - 1, answer)
})

When('I mark answer {int} as correct', async function (index: number) {
    await markAnswerCorrectness(this, index - 1, true)
})

When('I enter answer {int} explanation {string}', async function (index: number, explanation: string) {
    await enterAnswerExplanation(this, index - 1, explanation)
})

When('I enter answer {int} text {string} and mark it as correct', async function (index: number, answer: string) {
    await enterAnswer(this, index - 1, answer, true, undefined)
})

When(
    /I enter answer (\d+) text "([^"]*)", (correct|incorrect), with explanation "([^"]*)"/,
    async function (index: number, answer: string, correctness: string, explanation: string) {
        await enterAnswer(this, index - 1, answer, correctness === 'correct', explanation)
    },
)

Given('I enter answers', async function (answerRawTable: TableOf<AnswerRaw>) {
    await addAnswers(this, answerRawTable)
})

When('I add another answer', async function () {
    await this.questionEditPage.addAdditionalAnswer()
})

When('I enter question explanation {string}', async function (explanation: string) {
    await enterQuestionExplanation(this, explanation)
})

When('I enter image URL {string}', async function (imageUrl: string) {
    await enterImageUrl(this, imageUrl)
})

When('I enter an invalid image URL {string}', async function (invalidUrl: string) {
    await this.questionEditPage.enterImageUrl(invalidUrl)
})

When('I enter an invalid image URL containing a 2049 character URL', async function () {
    const tooLongUrl = `https://example.com/${'a'.repeat(2050)}`
    await this.questionEditPage.enterImageUrl(tooLongUrl)
})

When('I type image URL {string}', async function (imageUrl: string) {
    await this.questionEditPage.typeImageUrl(imageUrl)
})

When('I clear image URL and enter {string}', async function (imageUrl: string) {
    await this.questionEditPage.clearImageUrl()
    await this.questionEditPage.enterImageUrl(imageUrl)
})

When('I clear image URL and type {string}', async function (imageUrl: string) {
    await this.questionEditPage.clearImageUrl()
    await this.questionEditPage.typeImageUrl(imageUrl)
})

Then('I see image preview', async function () {
    await expect(this.questionEditPage.imagePreviewLocator()).toBeAttached()
})

Then('I do not see image preview', async function () {
    await expect(this.questionEditPage.imagePreviewLocator()).not.toBeAttached()
})

// Save question

When('I attempt to submit the question', submitQuestion)
When('I submit the question', async function () {
    await this.questionEditPage.submit()
})

// Error messages assertions

Then('I see error messages', async function (table: DataTable) {
    const expectedErrors: string[] = table.raw().map(row => row[0])

    await expectErrorMessages(this.questionEditPage, expectedErrors)
})

Then('I see no error messages', async function () {
    await expectErrorCount(this.questionEditPage, 0)
})

Then('I delete answer {int}', async function (answerNumber: number) {
    await this.questionEditPage.deleteAnswer(answerNumber - 1)
})

Then('I can delete {int} answers', async function (buttonCount: number) {
    await expectDeleteButtonsState(this.questionEditPage, buttonCount, false)
})
