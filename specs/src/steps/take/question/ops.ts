import type { QuizmasterWorld } from '#steps/world'

const findQuestionByTitle = (world: QuizmasterWorld, title: string) =>
    Object.values(world.questionBookmarks).find(q => q.question === title)

export const answerQuestion = async (world: QuizmasterWorld, answerList: string) => {
    if (world.lastAnsweredTitle) {
        const feedbackVisible = await world.takeQuestionPage.questionFeedbackLocator().isVisible()
        if (!feedbackVisible) {
            await world.takeQuestionPage.expectQuestionTextNotToBe(world.lastAnsweredTitle)
        }
    }
    await world.takeQuestionPage.waitForLoaded()
    const title = (await world.takeQuestionPage.questionText()) ?? ''
    world.lastAnsweredTitle = title
    const question = findQuestionByTitle(world, title)
    if (question?.isNumerical) {
        await world.takeQuestionPage.fillNumericalAnswer(answerList)
        return
    }
    const answers = world.parseAnswers(answerList)
    for (const answer of answers) {
        await world.takeQuestionPage.selectAnswer(answer)
    }
    await world.takeQuestionPage.submit()
}
