import type { Page, TestInfo } from '@playwright/test'

import {
    WorkspaceCreatePage,
    HomePage,
    QuestionEditPage,
    WorkspacePage,
    QuizCreatePage,
    QuestionPage,
    QuizScorePage,
    QuizWelcomePage,
    QuizStatsPage,
    TakeQuestionPage,
} from '#pages/index.ts'
import type { AnswerSpec, QuestionSpec } from '#steps/shared/specs.ts'

export class QuizmasterWorld {
    constructor(
        public page: Page,
        public testInfo: TestInfo,
    ) {
        this.questionEditPage = new QuestionEditPage(this.page)
        this.workspaceCreatePage = new WorkspaceCreatePage(this.page)
        this.takeQuestionPage = new TakeQuestionPage(this.page)
        this.questionPage = new QuestionPage(this.page)
        this.quizWelcomePage = new QuizWelcomePage(this.page)
        this.quizStatsPage = new QuizStatsPage(this.page)
        this.quizScorePage = new QuizScorePage(this.page)
        this.workspacePage = new WorkspacePage(this.page)
        this.quizCreatePage = new QuizCreatePage(this.page)
        this.homePage = new HomePage(this.page)
    }

    readonly questionEditPage: QuestionEditPage
    readonly workspaceCreatePage: WorkspaceCreatePage
    readonly takeQuestionPage: TakeQuestionPage
    readonly questionPage: QuestionPage
    readonly quizWelcomePage: QuizWelcomePage
    readonly quizStatsPage: QuizStatsPage
    readonly quizScorePage: QuizScorePage
    readonly workspacePage: WorkspacePage
    readonly quizCreatePage: QuizCreatePage
    readonly homePage: HomePage

    workspaceGuid = ''

    questionWip: QuestionSpec | undefined = undefined
    questionBookmarks: Record<string, QuestionSpec> = {}
    activeQuestionBookmark = ''
    get activeQuestion() {
        return this.questionBookmarks[this.activeQuestionBookmark]
    }

    updateQuestionWip(patch: Partial<QuestionSpec>) {
        if (!this.questionWip) throw new Error('No question WIP active')
        Object.assign(this.questionWip, patch)
    }

    updateAnswerWip(index: number, patch: Partial<AnswerSpec>) {
        if (!this.questionWip) throw new Error('No question WIP active')
        this.questionWip.answers[index] = { ...this.questionWip.answers[index], ...patch }
    }

    bookmarkQuestion(key: string, question: QuestionSpec) {
        if (this.questionBookmarks[key] !== undefined) {
            throw new Error(`Duplicate question bookmark: "${key}"`)
        }
        this.questionBookmarks[key] = question
        this.activeQuestionBookmark = key
    }

    quizBookmarks: Record<string, string> = {}
    activeQuizBookmark = ''

    bookmarkQuiz(key: string, bookmark: string) {
        if (this.quizBookmarks[key] !== undefined) {
            throw new Error(`Duplicate quiz bookmark: "${key}"`)
        }
        this.quizBookmarks[key] = bookmark
        this.activeQuizBookmark = key
    }
    correctAnswersCounts: Record<string, string> = {}
    clockInstalled = false
    lastAnsweredTitle?: string

    parseAnswers(answersString: string) {
        return answersString.split(',').map(answer => answer.trim())
    }
}
