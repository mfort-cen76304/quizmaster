import type { DataTable } from '@cucumber/cucumber'

import { Given, When, Then } from '#steps/fixture.ts'
import { parseAnswers } from '#steps/question/ops.ts'
import {
    createNumericalQuestionInWorkspace,
    createQuestionInWorkspace,
    createWorkspace,
    openCreateWorkspacePage,
} from '#steps/workspace/ops.ts'

const NUMERICAL_PATTERN = /^(-?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)$/

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
        const numericalMatch = row.answers.match(NUMERICAL_PATTERN)

        if (numericalMatch) {
            const [, correctAnswer, tolerance] = numericalMatch
            await createNumericalQuestionInWorkspace(
                this,
                bookmark,
                row.question,
                correctAnswer,
                row.explanation,
                tolerance,
            )
        } else {
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
                row.tag,
            )
        }
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
