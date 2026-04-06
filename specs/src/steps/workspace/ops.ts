import type { TableOf } from '#steps/common.ts'
import {
    addAnswers,
    type AnswerRaw,
    enterImageUrl,
    enterQuestion,
    enterQuestionExplanation,
} from '#steps/question/ops.ts'
import { emptyQuestion, type QuizmasterWorld } from '#steps/world'

export const openCreateWorkspacePage = async (world: QuizmasterWorld) => {
    await world.workspaceCreatePage.gotoNew()
}

export const createWorkspace = async (world: QuizmasterWorld, name: string) => {
    await openCreateWorkspacePage(world)
    await world.workspaceCreatePage.enterWorkspaceName(name)
    await world.workspaceCreatePage.submit()
    world.workspaceGuid = world.workspaceCreatePage.workspaceGuid()
}

export const ensureWorkspace = async (world: QuizmasterWorld) => {
    if (!world.workspaceGuid) {
        await createWorkspace(world, 'Auto Workspace')
    }
}

export const navigateToWorkspace = async (world: QuizmasterWorld) => {
    await world.workspacePage.goto(world.workspaceGuid)
}

export const createQuestionInWorkspace = async (
    world: QuizmasterWorld,
    bookmark: string,
    question: string,
    answerRawTable: TableOf<AnswerRaw>,
    isEasy?: boolean,
    explanation?: string,
    imageUrl?: string,
) => {
    await world.workspacePage.createNewQuestion()
    world.questionWip = emptyQuestion()
    await enterQuestion(world, question)
    await addAnswers(world, answerRawTable)
    if (isEasy) {
        await world.questionEditPage.setEasy()
    }
    if (explanation) {
        await enterQuestionExplanation(world, explanation)
    }
    if (imageUrl) {
        await enterImageUrl(world, imageUrl)
    }
    world.questionBookmarks[bookmark] = world.questionWip
    await world.questionEditPage.submit()
}

export const createQuestionInAutoWorkspace = async (
    world: QuizmasterWorld,
    bookmark: string,
    question: string,
    answerRawTable: TableOf<AnswerRaw>,
    isEasy?: boolean,
    explanation?: string,
    imageUrl?: string,
) => {
    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await createQuestionInWorkspace(world, bookmark, question, answerRawTable, isEasy, explanation, imageUrl)
}

export const createNumericalQuestionInAutoWorkspace = async (
    world: QuizmasterWorld,
    bookmark: string,
    question: string,
    correctAnswer: string,
    explanation?: string,
    tolerance?: string,
) => {
    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await world.workspacePage.createNewQuestion()
    world.questionWip = emptyQuestion()
    await enterQuestion(world, question)
    await world.questionEditPage.setNumericalChoice()
    await world.questionEditPage.enterNumericalCorrectAnswer(correctAnswer)
    if (tolerance != null) {
        await world.questionEditPage.enterNumericalTolerance(tolerance)
    }
    if (explanation) {
        await world.questionEditPage.enterQuestionExplanation(explanation)
        world.questionWip.explanation = explanation
    }
    world.questionBookmarks[bookmark] = world.questionWip
    await world.questionEditPage.submit()
}
