import { expect, type Page } from '@playwright/test'

export class QuestionPage {
    constructor(private page: Page) {}

    backButtonLocator = () => this.page.locator('button#back')
    nextButtonLocator = () => this.page.locator('button#next')
    evaluateButtonLocator = () => this.page.locator('button#evaluate')
    evaluateModalButtonLocator = () => this.page.locator('dialog #evaluate')

    dialogTextLocator = () => this.page.locator('dialog p')
    timerLocator = () => this.page.getByTestId('timerID')

    navigationButtonsLocator = () => this.page.locator('button#back, button#next, button#evaluate')
    submitButtonLocator = () => this.page.locator('input.submit-btn')

    private bookmarkQuestionButtonLocator = () => this.page.locator('[data-testid="bookmark-toggle"]')
    private unBookmarkQuestionButtonLocator = (title: string) =>
        this.page.locator(`[data-testid="delete-bookmark-${title}"]`)

    private progressBarLocator = () => this.page.locator('#progress-bar')
    progressCurrent = async () => Number.parseInt((await this.progressBarLocator().getAttribute('value')) ?? '')
    progressMax = async () => Number.parseInt((await this.progressBarLocator().getAttribute('max')) ?? '')

    back = () => this.backButtonLocator().click()
    bookmark = () => this.bookmarkQuestionButtonLocator().click()
    unBookmark = (title: string) => this.unBookmarkQuestionButtonLocator(title).click()
    next = () => this.nextButtonLocator().click()
    evaluate = async () => {
        const dialog = this.page.locator('dialog')
        const isDialogVisible = await dialog.isVisible()
        const locator = isDialogVisible ? this.evaluateModalButtonLocator() : this.evaluateButtonLocator()
        await locator.click()
    }
    submit = () => this.submitButtonLocator().click()

    bookmarkListLocator = (title: string) =>
        this.page.locator('[data-testid="bookmark-list"] button', { hasText: title })

    gotoBookmark = (title: string) => this.bookmarkListLocator(title).click()

    // Retrying assertions
    expectProgress = (current: number, max: number) =>
        expect(this.progressBarLocator())
            .toHaveAttribute('value', String(current))
            .then(() => expect(this.progressBarLocator()).toHaveAttribute('max', String(max)))
    expectBookmarked = () => expect(this.bookmarkQuestionButtonLocator()).toHaveAttribute('data-bookmarked', 'true')
}
