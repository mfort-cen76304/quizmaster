import type { TableOf } from '#steps/common.ts'
import { type Answer, emptyAnswer, type QuizmasterWorld } from '#steps/world'

export type AnswerRaw = [string, '*' | '', string | undefined]

// if change this value, also change in frontend/src/pages/create-question/create-question.tsx
const NUM_ANSWERS = 2

export const enterQuestion = async (world: QuizmasterWorld, question: string) => {
    await world.questionEditPage.enterQuestion(question)
    world.questionWip.question = question
}

export const enterTag = async (world: QuizmasterWorld, tag: string) => {
    await world.questionEditPage.enterTag(tag)
    world.questionWip.question = `[${tag}] ${world.questionWip.question}`
}

export const enterAIPrompt = async (world: QuizmasterWorld, prompt: string) => {
    await world.questionEditPage.enterAIPrompt(prompt)
}

const enterPartialAnswer = async (world: QuizmasterWorld, index: number, answer: Partial<Answer>) => {
    const questionWip = world.questionWip
    const origAnswer = questionWip.answers[index] || emptyAnswer()
    questionWip.answers[index] = { ...origAnswer, ...answer }
}

export const enterAnswerText = async (world: QuizmasterWorld, index: number, answer: string) => {
    await world.questionEditPage.enterAnswerText(index, answer)
    enterPartialAnswer(world, index, { answer })
}

export const markAnswerCorrectness = async (world: QuizmasterWorld, index: number, isCorrect: boolean) => {
    await world.questionEditPage.setAnswerCorrectness(index, isCorrect)
    enterPartialAnswer(world, index, { isCorrect })
}

export const enterAnswerExplanation = async (world: QuizmasterWorld, index: number, explanation: string) => {
    await world.questionEditPage.enterAnswerExplanation(index, explanation)
    enterPartialAnswer(world, index, { explanation })
}

export const enterAnswer = async (
    world: QuizmasterWorld,
    index: number,
    answer: string,
    isCorrect: boolean,
    explanation: string | undefined,
) => {
    await world.questionEditPage.enterAnswer(index, answer, isCorrect, explanation)
    world.questionWip.answers[index] = { answer, isCorrect, explanation }
}

export const enterQuestionExplanation = async (world: QuizmasterWorld, explanation: string) => {
    await world.questionEditPage.enterQuestionExplanation(explanation)
    world.questionWip.explanation = explanation
}

export const enterImageUrl = async (world: QuizmasterWorld, imageUrl: string) => {
    await world.questionEditPage.enterImageUrl(imageUrl)
    world.questionWip.imageUrl = imageUrl
}

export async function submitQuestion(this: QuizmasterWorld) {
    await this.questionEditPage.submit()
}

export const addAnswers = async (world: QuizmasterWorld, answerRawTable: TableOf<AnswerRaw>) => {
    const editPage = world.questionEditPage
    const raw = answerRawTable.raw()

    const isMultipleChoice = raw.filter(([_, correct]) => correct === '*').length > 1
    if (isMultipleChoice) await editPage.setMultipleChoice()

    for (let i = 0; i < raw.length; i++) {
        if (i >= NUM_ANSWERS) await editPage.addAdditionalAnswer()
        const [answer, correct, explanation] = raw[i]
        const isCorrect = correct === '*'
        await enterAnswer(world, i, answer, isCorrect, explanation)
    }
}

export const answerQuestion = async (world: QuizmasterWorld, answerList: string) => {
    const answers = world.parseAnswers(answerList)
    for (const answer of answers) {
        await world.takeQuestionPage.selectAnswer(answer)
    }
    await world.takeQuestionPage.submit()
}
