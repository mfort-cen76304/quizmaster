import { When } from '#specs/steps/fixture.ts'

When('I navigate to edit quiz {string}', async function (quizName: string) {
    // This is a placeholder. Implementation depends on your UI.
    // Typically, you would navigate to the workspace, find the quiz, and click the edit button.
    await this.workspacePage.editQuiz(quizName)
})
