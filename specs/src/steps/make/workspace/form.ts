import { Given, When, Then } from '#steps/fixture.ts'
import { openCreateWorkspacePage } from '#steps/make/workspace/ops.ts'

Given('I start creating a workspace', async function () {
    await openCreateWorkspacePage(this)
})

When('I enter workspace name {string}', async function (name: string) {
    await this.workspaceCreatePage.enterWorkspaceName(name)
})

When('I submit the workspace', async function () {
    await this.workspaceCreatePage.submit()
})

Then('I see the workspace creation page', async function () {
    await this.workspaceCreatePage.expectCreatePageVisible()
})
