import { expect, type Page } from '@playwright/test'

export class QuizSharePage {
    constructor(private page: Page) {}

    private takeLinkLocator = () => this.page.locator('#quiz-take-link')
    private cohortRowsLocator = () => this.page.locator('.cohort-row')
    private noCohortsLocator = () => this.page.locator('#no-cohorts')

    // ── Queries ──────────────────────────────────────

    isVisible = async () => (await this.page.locator('#share-page').count()) > 0

    takeLink = async () => (await this.takeLinkLocator().getAttribute('href')) ?? ''

    cohortRowNames = async () => {
        const rows = this.cohortRowsLocator()
        const count = await rows.count()
        const names: string[] = []
        for (let i = 0; i < count; i++) {
            names.push((await rows.nth(i).locator('.cohort-name').innerText()).trim())
        }
        return names
    }

    cohortLink = async (name: string) => {
        const row = this.cohortRowsLocator().filter({ has: this.page.locator('.cohort-name', { hasText: name }) })
        return (await row.locator('.cohort-link').getAttribute('href')) ?? ''
    }

    errorTestId = async () => {
        const alert = this.page.locator('[data-testid="empty-cohort-name"], [data-testid="duplicate-cohort-name"]')
        if ((await alert.count()) === 0) return null
        return await alert.first().getAttribute('data-testid')
    }

    // ── Actions ──────────────────────────────────────

    clickTakeLink = () => this.takeLinkLocator().click()

    addCohort = async (name: string) => {
        await this.page.locator('#cohort-name-input').fill(name)
        const cohortPost = this.page.waitForResponse(
            response => response.url().endsWith('/cohorts') && response.request().method() === 'POST',
        )
        await this.page.locator('#add-cohort-button').click()
        const postResponse = await cohortPost
        if (postResponse.ok()) {
            await this.page.waitForResponse(
                response => /\/quizzes\/\d+$/.test(response.url()) && response.request().method() === 'GET',
            )
        }
    }

    // ── Page-level expectations ──────────────────────

    expectNoCohorts = () => expect(this.noCohortsLocator()).toBeVisible()
}
