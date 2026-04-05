import { When } from '#specs/steps/fixture.ts'

When('I refresh the page', async function () {
    await this.page.reload({ waitUntil: 'networkidle' })
})

When('I use the browser back button', async function () {
    await this.page.goBack()
})

When('I use the browser forward button', async function () {
    await this.page.goForward()
})
