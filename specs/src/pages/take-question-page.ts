import { expect, type Page } from '@playwright/test'

export class TakeQuestionPage {
    constructor(private page: Page) {}

    private questionLocator = () => this.page.locator('h1')
    questionText = () => this.questionLocator().textContent()
    questionImageLocator = (filename: string) => this.page.locator(`img[src*="${filename}"]`)
    private questionImageLocator_ = () => this.page.locator('img.question-image')

    waitForLoaded = () => this.expectSubmitDisabled()

    private answersLocator = () => this.page.locator('li')
    answerLocator = (answer: string) => this.page.locator(`li:has(input[value="${answer}"])`)

    answerRowLocator = (answer: string) => this.answerLocator(answer).locator('.answer-input-row')
    answerFeedbackLocator = (answer: string) => this.answerRowLocator(answer).locator('.answer-feedback')
    answerCheckLocator = (answer: string) => this.answerRowLocator(answer).locator('input')
    private answerCheckNthLocator = (number: number) => this.answersLocator().nth(number).locator('input')
    answerExplanationLocator = (answer: string) => this.answerLocator(answer).locator('.explanation')

    correctAnswersCountLocator = () => this.page.locator('.correct-answers-count')

    selectAnswer = (answer: string) => this.answerCheckLocator(answer).check()
    selectAnswerNth = (number: number) => this.answerCheckNthLocator(number).check()
    unselectAnswer = (answer: string) => this.answerCheckLocator(answer).uncheck()
    private selectedAnswersLocator = () => this.answersLocator().locator('input:checked')

    private submitButtonLocator = () => this.page.locator('input[type="submit"]')
    submit = () => this.submitButtonLocator().click()

    questionFeedbackLocator = () => this.page.locator('p.question-feedback')
    questionScoreLocator = () => this.page.locator('p.question-score')
    questionExplanationLocator = () => this.page.locator('p.question-explanation')

    numericalInputLocator = () => this.page.locator('input[type="number"]')
    submitAnswerButtonLocator = () => this.page.locator('#submit-answer')
    fillNumericalAnswer = async (answer: string) => {
        await this.numericalInputLocator().fill(answer)
        const legacySubmitVisible = await this.submitAnswerButtonLocator().isVisible()
        if (legacySubmitVisible) {
            await this.submitAnswerButtonLocator().click()
            return
        }
        await this.submit()
    }

    // Retrying assertions
    expectQuestionText = (text: string) => expect(this.questionLocator()).toHaveText(text)
    expectQuestionTextNotToBe = (text: string) => expect(this.questionLocator()).not.toHaveText(text)
    expectAnswerCount = (count: number) => expect(this.answersLocator()).toHaveCount(count)
    expectAnswerText = (index: number, text: string) => expect(this.answersLocator().nth(index)).toHaveText(text)
    expectNoAnswerSelected = () => expect(this.selectedAnswersLocator()).toHaveCount(0)
    expectAnswerChecked = (answer: string) => expect(this.answerCheckLocator(answer)).toBeChecked()
    expectSubmitEnabled = () => expect(this.submitButtonLocator()).toBeEnabled()
    expectSubmitDisabled = () => expect(this.submitButtonLocator()).toBeDisabled()
    expectSubmitVisible = () => expect(this.submitButtonLocator()).toBeVisible()
    expectCorrectAnswersCount = (count: number) => expect(this.correctAnswersCountLocator()).toHaveText(String(count))
    expectCorrectAnswersCountAttached = () => expect(this.correctAnswersCountLocator()).toBeAttached()
    expectCorrectAnswersCountNotAttached = () => expect(this.correctAnswersCountLocator()).not.toBeAttached()
    expectQuestionImage = () => expect(this.questionImageLocator_()).toBeVisible()
    expectNoQuestionImage = () => expect(this.questionImageLocator_()).not.toBeVisible()
}
