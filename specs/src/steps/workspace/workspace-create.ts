import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type { TableOf } from '#specs/steps/common.ts'
import { Given, When, Then } from '#specs/steps/fixture.ts'
import type { AnswerRaw } from '#specs/steps/question/ops.ts'
import { createQuestionInWorkspace, createWorkspace, openCreateWorkspacePage } from '#specs/steps/workspace/ops.ts'

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

Then('I see an error message on workspace page stating title must be mandatory', async function () {
    await expect.poll(() => this.workspaceCreatePage.errorMessage()).not.toBe('')
})
