import type { DataTable } from '@cucumber/cucumber'

import type { TableOf } from '#steps/common.ts'
import { Given } from '#steps/fixture.ts'
import {
    addAnswers,
    type AnswerRaw,
    enterImageUrl,
    enterQuestion,
    enterTag,
    parseAnswers,
} from '#steps/question/ops.ts'
import {
    createQuestionInAutoWorkspace,
    createNumericalQuestionInAutoWorkspace,
    ensureWorkspace,
    navigateToWorkspace,
} from '#steps/workspace/ops.ts'
import { emptyQuestion } from '#steps/world'

Given('a question {string}', async function (question: string) {
    await ensureWorkspace(this)
    await navigateToWorkspace(this)
    await this.workspacePage.createNewQuestion()
    this.questionWip = emptyQuestion()
    await enterQuestion(this, question)
})

Given(
    'a numerical question {string} with correct answer {string} bookmarked as {string}',
    async function (question: string, correctAnswer: string, bookmark: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer)
    },
)

Given(
    'a numerical question {string} with correct answer {string} and tolerance {string} bookmarked as {string}',
    async function (question: string, correctAnswer: string, tolerance: string, bookmark: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer, undefined, tolerance)
    },
)

Given(
    'a numerical question {string} with correct answer {string} bookmarked as {string} with explanation {string}',
    async function (question: string, correctAnswer: string, bookmark: string, explanation: string) {
        await createNumericalQuestionInAutoWorkspace(this, bookmark, question, correctAnswer, explanation)
    },
)

Given('questions', async function (data: DataTable) {
    for (const row of data.hashes()) {
        const { bookmark, question, answers, easy, explanation } = row
        const isEasy = easy === 'true'
        const answerRawTable = parseAnswers(answers)

        await createQuestionInAutoWorkspace(this, bookmark, question, answerRawTable, isEasy, explanation)
    }
})

Given('with image {string}', async function (imageUrl: string) {
    await enterImageUrl(this, imageUrl)
})

Given('with tag {string}', async function (tag: string) {
    await enterTag(this, tag)
})

Given('with answers:', async function (answerRawTable: TableOf<AnswerRaw>) {
    await this.questionEditPage.enableExplanations()
    await addAnswers(this, answerRawTable)
})

Given('with explanation {string}', async function (explanation: string) {
    if (!(await this.questionEditPage.isNumericalChoice())) {
        await this.questionEditPage.enableExplanations()
    }
    await this.questionEditPage.enterQuestionExplanation(explanation)
    this.questionWip.explanation = explanation
})

Given('marked as easy', async function () {
    await this.questionEditPage.setEasy()
})

Given('saved and bookmarked as {string}', async function (bookmark) {
    this.questionBookmarks[bookmark] = this.questionWip
    this.activeQuestionBookmark = bookmark
    await this.questionEditPage.submit()
    await this.page.waitForURL(`**/workspace/${this.workspaceGuid}`)
    await this.workspacePage.editQuestion(this.questionWip.question)
})
