import { advanceServerClock } from '#steps/clock.ts'
import { expectTextToBe } from '#steps/common.ts'
import { Given, When, Then } from '#steps/fixture.ts'
import { expectQuestion } from '#steps/question/expects.ts'
import { expectNavigationButtons } from '#steps/quiz/expects.ts'
import { openQuiz, startQuiz } from '#steps/quiz/ops.ts'

Given('I open quiz {string}', async function (quizBookmark: string) {
    await openQuiz(this, quizBookmark)
})

Given('I open quiz questions for {string}', async function (quizBookmark: string) {
    const quizUrl = this.quizBookmarks[quizBookmark]
    await this.page.goto(`${quizUrl}/questions`)
})

Given('I start quiz {string}', async function (quizBookmark: string) {
    await startQuiz(this, quizBookmark)
})

Given('I start the quiz', async function () {
    await startQuiz(this, this.activeQuizBookmark)
})

Then('I see question {string}', async function (bookmark: string) {
    const question = this.questionBookmarks[bookmark]
    await expectQuestion(this.takeQuestionPage, question)
})

Then('I do not see question {string}', async function (bookmark: string) {
    const question = this.questionBookmarks[bookmark]
    await this.takeQuestionPage.expectQuestionTextNotToBe(question.text)
})

When('I proceed to the next question', async function () {
    await this.questionPage.next()
})

When('I skip the question', async function () {
    const nextButton = this.questionPage.nextButtonLocator()
    if (await nextButton.isVisible({ timeout: 2000 })) {
        await nextButton.click()
    }
})

When('I go back to previous question', async function () {
    await this.questionPage.back()
})

When('I evaluate the quiz', async function () {
    await this.questionPage.evaluate()
})

Then('I see the timeout message', async function () {
    await expectTextToBe(this.questionPage.dialogTextLocator(), "Time's up")
})

Then('I see buttons {string}', async function (buttonList: string) {
    await expectNavigationButtons(
        this.questionPage,
        buttonList.split(',').map(b => b.trim()),
    )
})

Then('progress shows {int} of {int}', async function (current: number, max: number) {
    await this.questionPage.expectProgress(current, max)
})

When('{int} seconds pass', async function (seconds: number) {
    await this.questionPage.timerLocator().waitFor({ state: 'visible' })

    await advanceServerClock(this, seconds)
    // Advance fake clock in 1-second chunks. A single runFor/fastForward with large
    // values (60s+) is too slow — Playwright processes thousands of rAF callbacks
    // synchronously, exceeding the test timeout. The await between chunks also gives
    // React time to process state updates (e.g. rendering the timeout modal).
    for (let i = 0; i < seconds; i++) {
        await this.page.clock.runFor(1000)
    }
    // Flush timer callbacks scheduled exactly at the boundary.
    await this.page.clock.runFor(1)

    const timer = (await this.questionPage.timerLocator().textContent())?.trim()
    if (timer === '00:00') {
        await this.questionPage.dialogTextLocator().waitFor({ state: 'visible' })
    }
})

Then('I see the countdown timer {string}', async function (timer: string) {
    await expectTextToBe(this.questionPage.timerLocator(), timer)
})

Then('I see answer {string} checked', async function (answer: string) {
    await this.takeQuestionPage.expectAnswerChecked(answer)
})

Then('I see the submit button as active', async function () {
    await this.takeQuestionPage.expectSubmitEnabled()
})

Then('I see the submit button as inactive', async function () {
    await this.takeQuestionPage.expectSubmitDisabled()
})
