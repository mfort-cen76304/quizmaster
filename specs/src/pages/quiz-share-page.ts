import { type Page } from '@playwright/test'

export class QuizSharePage {
    constructor(private page: Page) {}

    private takeLinkLocator = () => this.page.locator('#quiz-take-link')

    takeLink = async () => (await this.takeLinkLocator().getAttribute('href')) ?? ''
    clickTakeLink = () => this.takeLinkLocator().click()

    hasCohorts = async () => (await this.page.locator('#no-cohorts').count()) === 0
}
