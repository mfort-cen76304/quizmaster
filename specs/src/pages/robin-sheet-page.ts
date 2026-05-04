import { expect, type Page } from '@playwright/test'

export class RobinSheetPage {
    constructor(private page: Page) {}

    private fabLocator = () => this.page.locator('.robin-fab .trigger')
    private promptLocator = () => this.page.locator('#robin-prompt-text')
    private generateButtonLocator = () => this.page.locator('#robin-generate-button')
    private previousVersionButtonLocator = () => this.page.locator('#previous-version-button')
    private questionTypeRadio = (value: string) => this.page.locator(`#robin-question-type-${value}`)

    open = async () => {
        await this.fabLocator().click()
        await this.promptLocator().waitFor({ state: 'visible' })
    }

    enterPrompt = (prompt: string) => this.promptLocator().fill(prompt)

    generate = () => this.generateButtonLocator().click()

    askForSingleChoice = () => this.questionTypeRadio('single').check()
    askForMultipleChoice = () => this.questionTypeRadio('multiple').check()
    askForNumericalChoice = () => this.questionTypeRadio('numerical').check()

    restorePreviousVersion = () => this.previousVersionButtonLocator().click()

    expectPromptVisible = () => expect(this.promptLocator().first()).toBeVisible()
    expectPromptNotVisible = () => expect(this.promptLocator().first()).not.toBeVisible()
    expectPreviousVersionAvailable = () => expect(this.previousVersionButtonLocator()).toBeVisible()
    expectPreviousVersionNotAvailable = () => expect(this.previousVersionButtonLocator()).not.toBeVisible()
}
