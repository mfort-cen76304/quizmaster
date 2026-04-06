import { Given, Then } from '#steps/fixture.ts'
import type { QuizmasterWorld } from '#steps/world/world.ts'

Given('I am on the home page', async function (this: QuizmasterWorld) {
    await this.homePage.goto()
    await this.homePage.waitForLoaded()
})

Then('I see the home page', async function (this: QuizmasterWorld) {
    await this.homePage.waitForLoaded()
})

Then('I can create a new workspace', async function (this: QuizmasterWorld) {
    await this.homePage.expectCreateWorkspaceLinkVisible()
})
