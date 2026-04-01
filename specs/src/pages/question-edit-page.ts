import { expect, type Page } from '@playwright/test'

export class QuestionEditPage {
    constructor(private page: Page) {}

    private editPageLocator = () => this.page.locator('#edit-question-page')
    private createPageLocator = () => this.page.locator('#create-question-page')
    isEditPage = () => this.editPageLocator().isVisible()
    isCreatePage = () => this.createPageLocator().isVisible()

    private questionLocator = () => this.page.locator('#question-text')

    private tagLocator = () => this.page.locator('#question-tag')
    enterTag = (tag: string) => this.tagLocator().fill(tag)
    tagValue = () => this.tagLocator().inputValue()
    expectTagValue = (value: string) => expect(this.tagLocator()).toHaveValue(value)
    expectEmptyTag = () => expect(this.tagLocator()).toHaveValue('')

    private aiPromptLocator = () => this.page.locator('#ai-prompt-text')
    enterQuestion = (question: string) => this.questionLocator().fill(question)

    enterAIPrompt = (prompt: string) => this.aiPromptLocator().fill(prompt)
    questionValue = () => this.questionLocator().inputValue()

    private aiAssistButtonLocator = () => this.page.getByRole('button', { name: /Generate/i })
    clickAiAssist = () => this.aiAssistButtonLocator().click()

    private showExplanationLocator = () => this.page.locator('#show-explanation')
    explanationsEnabled = () => this.showExplanationLocator().isChecked()
    enableExplanations = () => this.showExplanationLocator().check()
    disableExplanations = () => this.showExplanationLocator().uncheck()

    private questionTypeRadio = (value: string) => this.page.locator(`#question-type-${value}`)
    questionType = async () => {
        for (const type of ['single', 'multiple', 'numerical']) {
            const radio = this.questionTypeRadio(type)
            if ((await radio.count()) > 0 && (await radio.isChecked())) return type
        }
        return ''
    }
    isMultipleChoice = async () => (await this.questionType()) === 'multiple'
    isNumericalChoice = async () => (await this.questionType()) === 'numerical'
    setMultipleChoice = () => this.questionTypeRadio('multiple').check()
    setSingleChoice = () => this.questionTypeRadio('single').check()
    setNumericalChoice = () => this.questionTypeRadio('numerical').check()

    private numericalCorrectAnswerLocator = () => this.page.locator('#numerical-correct-answer')
    enterNumericalCorrectAnswer = (value: string) => this.numericalCorrectAnswerLocator().fill(value)
    numericalCorrectAnswerValue = () => this.numericalCorrectAnswerLocator().inputValue()

    private numericalToleranceLocator = () => this.page.locator('#numerical-tolerance')
    enterNumericalTolerance = (value: string) => this.numericalToleranceLocator().fill(value)
    numericalToleranceValue = () => this.numericalToleranceLocator().inputValue()

    private isEasyLocator = () => this.page.locator('#is-easy')
    isEasy = () => this.isEasyLocator().isChecked()
    setEasy = () => this.isEasyLocator().check()

    private explanationFieldsLocator = () => this.page.locator('input.explanation')

    private answerRowsLocator = () => this.page.locator('.answer-row')
    answerRowCount = async () => this.answerRowsLocator().count()

    private answerRowLocator = (index: number) => this.page.locator('.answer-row').nth(index)
    private answerTextLocator = (index: number) => this.answerRowLocator(index).locator('input.text')
    enterAnswerText = (index: number, value: string) => this.answerTextLocator(index).fill(value)
    answerText = (index: number) => this.answerTextLocator(index).inputValue()

    private answerIsCorrectLocator = (index: number) =>
        this.answerRowLocator(index).locator('input[type="checkbox"], input[type="radio"]')
    isAnswerCorrect = (index: number) => this.answerIsCorrectLocator(index).isChecked()
    setAnswerCorrectness = (index: number, isCorrect: boolean) =>
        this.answerIsCorrectLocator(index).setChecked(isCorrect)

    private answerExplanationLocator = (index: number) => this.answerRowLocator(index).locator('input.explanation')
    answerExplanation = (index: number) => this.answerExplanationLocator(index).inputValue()
    enterAnswerExplanation = (index: number, explanation: string) =>
        this.answerExplanationLocator(index).fill(explanation)

    enterAnswer = async (index: number, value: string, correct: boolean, explanation: string | undefined) => {
        await this.enterAnswerText(index, value)
        await this.setAnswerCorrectness(index, correct)
        if (explanation !== undefined) await this.enterAnswerExplanation(index, explanation)
    }

    private addAnswerButtonLocator = () => this.page.locator('button#add-answer')
    addAdditionalAnswer = async () => {
        const idx = await this.answerRowCount()
        await this.addAnswerButtonLocator().click()
        await this.answerRowLocator(idx).waitFor({ state: 'visible' })
    }

    private imageUrlLocator = () => this.page.locator('#image-url')
    enterImageUrl = (url: string) => this.imageUrlLocator().fill(url)
    typeImageUrl = (url: string) => this.imageUrlLocator().pressSequentially(url)
    clearImageUrl = () => this.imageUrlLocator().clear()

    imagePreviewLocator = () => this.page.locator('img.image-preview')

    private questionExplanationLocator = () => this.page.locator('#question-explanation')
    enterQuestionExplanation = (question: string) => this.questionExplanationLocator().fill(question)
    questionExplanation = () => this.questionExplanationLocator().inputValue()

    submit = () => this.page.locator('button[type="submit"]').click()

    private backButtonLocator = () => this.page.locator('button#back')
    back = () => this.backButtonLocator().click()

    errorsLocator = () => this.page.locator('.alert.error')
    hasError = (error: string) => this.page.getByTestId(error).waitFor({ state: 'visible' })

    answerDeleteButtonsLocator = () => this.page.locator('.trash-button')
    private answerDeleteButtonLocator = (idx: number) => this.answerDeleteButtonsLocator().nth(idx)
    deleteAnswer = (index: number) => this.answerDeleteButtonLocator(index).click()

    // Retrying assertions
    expectEditPageVisible = () => expect(this.editPageLocator()).toBeVisible()
    expectCreatePageVisible = () => expect(this.createPageLocator()).toBeVisible()
    expectQuestionValue = (value: string) => expect(this.questionLocator()).toHaveValue(value)
    expectQuestionValueNotEmpty = () => expect(this.questionLocator()).not.toBeEmpty({ timeout: 60000 })
    expectQuestionType = (type: string) => expect(this.questionTypeRadio(type)).toBeChecked()
    expectExplanationsChecked = () => expect(this.showExplanationLocator()).toBeChecked()
    expectExplanationsUnchecked = () => expect(this.showExplanationLocator()).not.toBeChecked()
    expectNumericalAnswerVisible = () => expect(this.numericalCorrectAnswerLocator()).toBeVisible()
    expectNumericalAnswerNotVisible = () => expect(this.numericalCorrectAnswerLocator()).not.toBeVisible()
    expectNumericalCorrectAnswer = (value: string) => expect(this.numericalCorrectAnswerLocator()).toHaveValue(value)
    expectNumericalTolerance = (value: string) => expect(this.numericalToleranceLocator()).toHaveValue(value)
    expectEasyChecked = () => expect(this.isEasyLocator()).toBeChecked()
    expectEasyUnchecked = () => expect(this.isEasyLocator()).not.toBeChecked()
    expectEasyVisible = () => expect(this.isEasyLocator()).toBeVisible()
    expectEasyNotVisible = () => expect(this.isEasyLocator()).not.toBeVisible()
    expectExplanationFieldsExist = () => expect(this.explanationFieldsLocator().first()).toBeVisible()

    expectAiBlockVisible = () => expect(this.aiPromptLocator().first()).toBeVisible()
    expectAiBlockNotVisible = () => expect(this.aiPromptLocator().first()).not.toBeVisible()
    expectAiPromptValue = (text: string) => expect(this.aiPromptLocator()).toContainText(text)
    expectNoExplanationFields = () => expect(this.explanationFieldsLocator()).toHaveCount(0)
    expectAnswerRowCount = (count: number) => expect(this.answerRowsLocator()).toHaveCount(count)
    expectAnswerRowCountGreaterThanOrEqual = async (count: number) =>
        expect(await this.answerRowsLocator().count()).toBeGreaterThanOrEqual(count)
    expectAnswerText = (index: number, value: string) => expect(this.answerTextLocator(index)).toHaveValue(value)
    expectAnswerCorrect = (index: number) => expect(this.answerIsCorrectLocator(index)).toBeChecked()
    expectAnswerIncorrect = (index: number) => expect(this.answerIsCorrectLocator(index)).not.toBeChecked()
    expectAnswerExplanation = (index: number, value: string) =>
        expect(this.answerExplanationLocator(index)).toHaveValue(value)
    expectQuestionExplanation = (value: string) => expect(this.questionExplanationLocator()).toHaveValue(value)
    expectAddAnswerNotVisible = () => expect(this.addAnswerButtonLocator()).not.toBeVisible()
    expectErrorCount = (n: number) => expect(this.errorsLocator()).toHaveCount(n)

    private checkedAnswersLocator = () =>
        this.answerRowsLocator().locator('input[type="checkbox"]:checked, input[type="radio"]:checked')

    expectExactlyOneCorrectAnswer = () => expect(this.checkedAnswersLocator()).toHaveCount(1)

    expectAnswerExplanationCountGreaterThanOrEqual = async (count: number) => {
        const answerExplanations = this.page.locator('.answer-row input.explanation')
        const rowCount = await answerExplanations.count()
        let nonEmptyCount = 0

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const value = await answerExplanations.nth(rowIndex).inputValue()
            if (value.trim().length > 0) {
                nonEmptyCount++
            }
        }

        expect(nonEmptyCount).toBeGreaterThanOrEqual(count)
    }

    expectCorrectAnswerExplanationCountGreaterThanOrEqual = async (count: number) => {
        const rows = this.page.locator('.answer-row')
        const rowCount = await rows.count()
        let correctWithExplanationCount = 0

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = rows.nth(rowIndex)
            const input = row.locator('input[type="checkbox"], input[type="radio"]')
            const explanation = row.locator('input.explanation')
            const checked = await input.isChecked()
            const explanationText = await explanation.inputValue()

            if (checked && explanationText.trim().length > 0) {
                correctWithExplanationCount++
            }
        }

        expect(correctWithExplanationCount).toBeGreaterThanOrEqual(count)
    }

    expectCorrectAnswerCountGreaterThanOrEqual = async (count: number) =>
        expect(await this.checkedAnswersLocator().count()).toBeGreaterThanOrEqual(count)
}
