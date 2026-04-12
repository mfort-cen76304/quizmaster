import { ensureWorkspace, navigateToWorkspace } from '#steps/make/workspace/ops.ts'
import {
    hasExplanations,
    isMultipleChoiceSpec,
    isNumericalSpec,
    type AnswerSpec,
    type QuestionSpec,
} from '#steps/shared/specs.ts'
import { emptyQuestion, type Answer, emptyAnswer, type QuizmasterWorld } from '#steps/world'

// Mirrors the default count of empty answer rows shown by the question form.
// If you change this, also change in frontend/src/pages/create-question/create-question.tsx
const NUM_DEFAULT_ANSWERS = 2

// ── Form helpers ────────────────────────────────────────

export const enterQuestion = async (world: QuizmasterWorld, question: string) => {
    await world.questionEditPage.enterQuestion(question)
    world.questionWip.question = question
}

export const enterTag = async (world: QuizmasterWorld, tag: string) => {
    await world.questionEditPage.enterTag(tag)
    world.questionWip.tags = [tag]
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

// ── Compound form operations ────────────────────────────

export const addAnswers = async (world: QuizmasterWorld, answers: AnswerSpec[]) => {
    if (answers.length === 0) return

    const editPage = world.questionEditPage

    if (isMultipleChoiceSpec(answers)) await editPage.setMultipleChoice()

    if (hasExplanations(answers)) await editPage.enableExplanations()

    for (let i = 0; i < answers.length; i++) {
        if (i >= NUM_DEFAULT_ANSWERS) await editPage.addAdditionalAnswer()
        const a = answers[i]
        await enterAnswer(world, i, a.text, a.correct, a.explanation)
    }
}

// ── createQuestion pipeline ─────────────────────────────

export const createQuestion = async (world: QuizmasterWorld, spec: QuestionSpec) => {
    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await world.workspacePage.createNewQuestion()
    world.questionWip = emptyQuestion()

    await enterQuestion(world, spec.text)

    if (isNumericalSpec(spec)) {
        await world.questionEditPage.setNumericalChoice()
        await world.questionEditPage.enterNumericalCorrectAnswer(spec.numericalAnswer as string)
        if (spec.tolerance) await world.questionEditPage.enterNumericalTolerance(spec.tolerance)
        world.questionWip.isNumerical = true
    } else {
        if (spec.tag) await enterTag(world, spec.tag)
        await addAnswers(world, spec.answers)
        if (spec.easy) await world.questionEditPage.setEasy()
    }

    if (spec.explanation) await enterQuestionExplanation(world, spec.explanation)
    if (spec.image) await enterImageUrl(world, spec.image)

    world.bookmarkQuestion(spec.bookmark ?? spec.text, world.questionWip)

    await world.questionEditPage.submit()
    await world.workspacePage.waitForUrl(world.workspaceGuid)
}
