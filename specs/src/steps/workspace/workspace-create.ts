import type { DataTable } from '@cucumber/cucumber'

import type { TableOf } from '#steps/common.ts'
import { Given, When, Then } from '#steps/fixture.ts'
import type { AnswerRaw } from '#steps/question/ops.ts'
import { createQuestionInWorkspace, createWorkspace, openCreateWorkspacePage } from '#steps/workspace/ops.ts'

const parseAnswers = (answers: string) =>
    ({
        raw: () =>
            answers.split(',').map(a => {
                const [answer, correct] = a.trim().split(' ')
                return [answer, correct === '(*)' ? '*' : '', undefined]
            }),
    }) as TableOf<AnswerRaw>

Given('I start creating a workspace', async function () {
    await openCreateWorkspacePage(this)
})

Given('home page', async function () {
    await this.homePage.goto()
})

Given('workspace {string}', async function (name: string) {
    await createWorkspace(this, name)
})

Given('workspace {string} with questions', async function (name: string, data: DataTable) {
    await createWorkspace(this, name)

    for (const row of data.hashes()) {
        const bookmark = row.bookmark || row.question
        const answerRawTable = parseAnswers(row.answers)
        const isEasy = row.easy === 'true'

        await createQuestionInWorkspace(
            this,
            bookmark,
            row.question,
            answerRawTable,
            isEasy,
            row.explanation,
            row.image,
        )
    }
})

When('I enter workspace name {string}', async function (name: string) {
    await this.workspaceCreatePage.enterWorkspaceName(name)
})

When('I start creating a new workspace', async function () {
    await this.homePage.createWorkspaceLink().click()
})

When('I submit the workspace', async function () {
    await this.workspaceCreatePage.submit()
})

When('I go back to the home page', async function () {
    await this.workspaceCreatePage.back()
})

Then('I see the workspace creation page', async function () {
    await this.workspaceCreatePage.expectCreatePageVisible()
})
