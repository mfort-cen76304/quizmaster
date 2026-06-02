import { expect, type Page } from '@playwright/test'

export class WorkspacePage {
    constructor(private page: Page) {}

    // ── Navigation ───────────────────────────────────

    goto = (guid: string) => this.page.goto(`/workspace/${guid}`, { waitUntil: 'networkidle' })
    waitForUrl = (guid: string) => this.page.waitForURL(`**/workspace/${guid}`)

    // ── Workspace name ───────────────────────────────

    private workspaceNameLocator = () => this.page.getByTestId('workspace-title')

    expectWorkspaceName = (name: string) => expect(this.workspaceNameLocator()).toHaveText(name)

    // ── Tabs ─────────────────────────────────────────

    private tabLocator = (name: string) => this.page.getByRole('tab', { name })

    expectTabVisible = (name: string) => expect(this.tabLocator(name)).toBeVisible()

    // ── Workspace summary ────────────────────────────

    private workspaceSummaryStatLocator = (index: number) => this.page.locator('.workspace-header__stat').nth(index)

    expectWorkspaceQuestionSummaryCount = async (count: number) => {
        const stat = this.workspaceSummaryStatLocator(0)
        await expect(stat.locator('strong')).toHaveText(String(count))
        await expect(stat.locator('span')).toHaveText(count === 1 ? 'question' : 'questions')
    }

    workspaceQuestionSummaryCount = async (): Promise<number> => {
        const value = (await this.workspaceSummaryStatLocator(0).locator('strong').textContent())?.trim() ?? '0'
        return Number.parseInt(value, 10)
    }

    expectWorkspaceQuizSummaryCount = async (count: number) => {
        const stat = this.workspaceSummaryStatLocator(1)
        await expect(stat.locator('strong')).toHaveText(String(count))
        await expect(stat.locator('span')).toHaveText(count === 1 ? 'quiz' : 'quizzes')
    }

    // ── Question list ────────────────────────────────

    private questionsLocator = () => this.page.locator('.question-item')
    private questionLocator = (question: string) => this.questionsLocator().filter({ hasText: question })

    expectQuestionCount = (count: number) => expect(this.questionsLocator()).toHaveCount(count)
    expectHasQuestions = () => expect(this.questionsLocator().first()).toBeVisible()
    expectQuestionVisible = (question: string) => expect(this.questionLocator(question)).toBeVisible()
    expectQuestionNotVisible = (question: string) => expect(this.questionLocator(question)).not.toBeVisible()

    // ── Question actions ─────────────────────────────

    takeQuestion = (question: string) => this.questionLocator(question).getByRole('link', { name: 'Take' }).click()
    editQuestion = (question: string) => this.questionLocator(question).getByRole('link', { name: 'Edit' }).click()
    editFirstQuestion = () => this.questionsLocator().first().getByRole('link', { name: 'Edit' }).click()

    private deleteButtonLocator = (question: string) =>
        this.questionLocator(question).getByRole('button', { name: 'Delete' })
    deleteQuestion = async (question: string) => {
        await this.deleteButtonLocator(question).click()
        await this.questionLocator(question).waitFor({ state: 'hidden' })
    }
    expectDeleteButtonNotVisible = (question: string) => expect(this.deleteButtonLocator(question)).not.toBeVisible()

    // ── Question thumbnail ───────────────────────────

    private questionThumbnailLocator = (question: string) =>
        this.questionLocator(question).locator('img.question-thumbnail')
    expectQuestionThumbnailVisible = (question: string) => expect(this.questionThumbnailLocator(question)).toBeVisible()
    expectQuestionThumbnailNotVisible = (question: string) =>
        expect(this.questionThumbnailLocator(question)).not.toBeVisible()

    // ── Question tag badge ───────────────────────────

    private questionTagBadgeLocator = (question: string) =>
        this.questionLocator(question).locator('.question-tag-badge')
    expectQuestionTagBadge = (question: string, tag: string) =>
        expect(this.questionTagBadgeLocator(question)).toHaveText(tag)
    expectQuestionTagBadgeNotVisible = (question: string) =>
        expect(this.questionTagBadgeLocator(question)).not.toBeVisible()

    // ── Create new question / quiz ───────────────────

    createNewQuestion = () => this.page.locator('#create-question').click()
    createNewQuiz = () => this.page.locator('#create-quiz').click()

    // ── Quiz list ────────────────────────────────────

    private quizLocator = (quiz: string) => this.page.locator('.quiz-item').filter({ hasText: quiz })

    takeQuiz = (quiz: string) => this.quizLocator(quiz).getByRole('link', { name: 'Take' }).click()
    editQuiz = (quiz: string) => this.quizLocator(quiz).getByRole('link', { name: 'Edit' }).click()
    shareQuiz = async (quiz: string) => {
        await this.quizLocator(quiz).getByRole('link', { name: 'Share' }).click()
        await this.page.locator('#share-page').waitFor({ state: 'visible' })
    }
    statsQuiz = (quiz: string) => this.quizLocator(quiz).getByRole('link', { name: 'Statistics' }).click()
    dryRunQuiz = (quiz: string) => this.quizLocator(quiz).getByRole('link', { name: 'Dry run' }).click()

    deleteQuiz = (quiz: string) => this.quizLocator(quiz).getByRole('button', { name: 'Delete' }).click()
    confirmDeletion = () => this.page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click()
    cancelDeletion = () => this.page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()

    expectQuizVisible = (quiz: string) => expect(this.quizLocator(quiz)).toBeVisible()
    expectQuizNotVisible = (quiz: string) => expect(this.quizLocator(quiz)).not.toBeVisible()
}
