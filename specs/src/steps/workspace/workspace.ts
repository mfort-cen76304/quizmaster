import { Then, When } from '#steps/fixture.ts'

Then('I see the {string} workspace page', async function (name: string) {
    await this.workspacePage.expectWorkspaceName(name)
})

Then('I see an empty workspace', async function () {
    await this.workspacePage.expectQuestionCount(0)
})

Then('I see question in list {string}', async function (question: string) {
    await this.workspacePage.expectQuestionVisible(question)
})

Then('I see tag badge {string} for question {string}', async function (tag: string, question: string) {
    await this.workspacePage.expectQuestionTagBadge(question, tag)
})

Then('I do not see tag badge for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionTagBadgeNotVisible(question)
})

Then('I do not see question {string} in the list', async function (question: string) {
    await this.workspacePage.expectQuestionNotVisible(question)
})

When('I take question {string} from the list', async function (question: string) {
    this.activeQuestionBookmark = question
    await this.workspacePage.takeQuestion(question)
})

When('I delete question {string} from the list', async function (question: string) {
    this.activeQuestionBookmark = question
    await this.workspacePage.deleteQuestion(question)
})

Then('I cannot delete question {string}', async function (question: string) {
    await this.workspacePage.expectDeleteButtonNotVisible(question)
})

When('I edit question {string} from the list', async function (question: string) {
    this.activeQuestionBookmark = question
    await this.workspacePage.editQuestion(question)
})

Then('I see image thumbnail for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionThumbnailVisible(question)
})

Then('I do not see image thumbnail for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionThumbnailNotVisible(question)
})

Then('I see the quiz {string} in the workspace', async function (quizName: string) {
    await this.workspacePage.expectQuizVisible(quizName)
})

Then('I do not see quiz {string} in the workspace', async function (quizName: string) {
    await this.workspacePage.expectQuizNotVisible(quizName)
})

When('I delete quiz {string} from the workspace', async function (quizName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.deleteQuiz(quizName)
})

When('I confirm the deletion', async function () {
    await this.workspacePage.confirmDeletion()
})

When('I cancel the deletion', async function () {
    await this.workspacePage.cancelDeletion()
})

Then('I take quiz {string}', async function (quiz: string) {
    await this.workspacePage.takeQuiz(quiz)
})

When('I open stats for quiz {string}', async function (quizName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.statsQuiz(quizName)
})
