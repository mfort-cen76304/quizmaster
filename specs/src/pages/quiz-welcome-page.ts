import { expect, type Page } from '@playwright/test'

export class QuizWelcomePage {
    constructor(private page: Page) {}

    private headerLocator = () => this.page.locator('h1')
    private nameLocator = () => this.page.locator('#quiz-name')
    private descriptionLocator = () => this.page.locator('#quiz-description')
    private questionCountLocator = () => this.page.locator('#question-count')
    private feedbackLocator = () => this.page.locator('#question-feedback')
    private passScoreLocator = () => this.page.locator('#pass-score')
    private timeLimitLocator = () => this.page.locator('#time-limit')

    expectHeader = (text: string) => expect(this.headerLocator()).toHaveText(text)
    expectName = (name: string) => expect(this.nameLocator()).toHaveText(name)
    expectDescription = (description: string) => expect(this.descriptionLocator()).toHaveText(description)
    expectQuestionCount = (count: number) => expect(this.questionCountLocator()).toHaveText(String(count))
    expectFeedback = (feedback: string) => expect(this.feedbackLocator()).toHaveText(feedback)
    expectPassScore = (score: number) => expect(this.passScoreLocator()).toContainText(String(score))
    timeLimit = async () => Number.parseInt((await this.timeLimitLocator().textContent()) ?? '')
    expectTimeLimit = (seconds: string) => expect(this.timeLimitLocator()).toContainText(seconds)
    expectStartEnabled = () => expect(this.startButton()).toBeEnabled()
    expectStartDisabled = () => expect(this.startButton()).toBeDisabled()

    startButton = () => this.page.locator('button#start')
    start = () => this.startButton().click()

    private dryRunIndicatorLocator = () => this.page.getByTestId('dry-run-indicator')
    expectDryRunIndicatorVisible = () => expect(this.dryRunIndicatorLocator()).toBeVisible()
    expectDryRunIndicatorNotVisible = () => expect(this.dryRunIndicatorLocator()).not.toBeVisible()
}
