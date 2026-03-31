import { expect, type Page } from '@playwright/test'

export class QuizScorePage {
    constructor(private page: Page) {}

    private resultTableLocator = () => this.page.locator('#results')
    resultTableExists = () => this.resultTableLocator().isVisible()

    private correctAnswerLocator = () => this.page.locator('#correct-answers')

    private firstCorrectAnswerLocator = () => this.page.locator('#first-correct-answers')

    private totalQuestionsLocator = () => this.page.locator('#total-questions')
    totalQuestions = () => this.totalQuestionsLocator().textContent().then(Number)

    private percentageResultLocator = () => this.page.locator('#percentage-result')

    private firstPercentageResultLocator = () => this.page.locator('#first-percentage-result')

    private passScoreLocator = () => this.page.locator('#pass-score')

    private textResultLocator = () => this.page.locator('#text-result')

    private firstTextResultLocator = () => this.page.locator('#first-text-result')

    private questionsLocator = () => this.page.locator('[id^=question-]')
    questions = () => this.questionsLocator().locator('[id^=question-name-]').allTextContents()

    private questionLocator = (question: string) =>
        this.page.locator('[id^=question-name-]').filter({ hasText: question }).locator('..').locator('..')

    private answerAndExplanationLocator = (question: string) =>
        this.questionLocator(question).locator('li[id^=answer-row-]')

    answerListLocator = (question: string) => this.questionLocator(question).locator('[id^=question-answers-]')

    answers = (question: string) => this.answerListLocator(question).locator('[id^=answer-label-]').allTextContents()

    explanations = (question: string) =>
        this.answerAndExplanationLocator(question).locator('.explanationText').allTextContents()

    questionExplanation = (question: string) =>
        this.questionLocator(question).locator('.question-explanation').textContent()

    private checkedUserSelectLocator = (question: string) => this.questionLocator(question).locator('input:checked')
    checkedAnswerLabel = (question: string) =>
        this.checkedUserSelectLocator(question).locator('..').locator('[id^=answer-label-]').textContent()

    private questionAnswerLocator = (question: string, answer: string) =>
        this.answerAndExplanationLocator(question).getByText(answer)
    private answerCorrespondingResponseLocator = (question: string, answer: string) =>
        this.questionAnswerLocator(question, answer).locator('..').locator('..').locator('.feedback')
    answerCorrespondingResponse = (question: string, answer: string) =>
        this.answerCorrespondingResponseLocator(question, answer).textContent()

    // Retrying assertions
    expectResultTableVisible = () => expect(this.resultTableLocator()).toBeVisible()
    expectCorrectAnswers = (text: string) => expect(this.correctAnswerLocator()).toHaveText(text)
    expectTotalQuestions = (n: number) => expect(this.totalQuestionsLocator()).toHaveText(String(n))
    expectPercentageResult = (n: number) => expect(this.percentageResultLocator()).toHaveText(String(n))
    expectTextResult = (text: string) => expect(this.textResultLocator()).toHaveText(text)
    expectPassScore = (n: number) => expect(this.passScoreLocator()).toHaveText(String(n))
    expectFirstCorrectAnswers = (n: number) => expect(this.firstCorrectAnswerLocator()).toHaveText(String(n))
    expectFirstPercentageResult = (n: number) => expect(this.firstPercentageResultLocator()).toHaveText(String(n))
    expectFirstTextResult = (text: string) => expect(this.firstTextResultLocator()).toHaveText(text)
    expectFirstResultNotVisible = () =>
        expect(this.firstCorrectAnswerLocator())
            .not.toBeVisible()
            .then(() => expect(this.firstPercentageResultLocator()).not.toBeVisible())
            .then(() => expect(this.firstTextResultLocator()).not.toBeVisible())

    retakeIncorrectButtonLocator = () => this.page.locator('#retake-incorrect')
    retakeIncorrect = () => this.retakeIncorrectButtonLocator().click()
}
