import type { QuestionEditPage } from '#pages/index.ts'
import { ensureWorkspace, navigateToWorkspace } from '#steps/make/workspace/ops.ts'
import {
    hasExplanations,
    isMultipleChoiceSpec,
    isNumericalSpec,
    type AnswerSpec,
    type QuestionSpec,
} from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

// Mirrors the default count of empty answer rows shown by the question form.
// If you change this, also change in frontend/src/pages/create-question/create-question.tsx
const NUM_DEFAULT_ANSWERS = 2

// ── Form helpers ────────────────────────────────────────

export const enterQuestion = async (world: QuizmasterWorld, question: string) => {
    await world.questionEditPage.enterQuestion(question)
    world.updateQuestionWip({ text: question })
}

export const enterTag = async (world: QuizmasterWorld, tag: string) => {
    await world.questionEditPage.enterTag(tag)
    world.updateQuestionWip({ tag })
}

export const enterAIPrompt = async (world: QuizmasterWorld, prompt: string) => {
    await world.questionEditPage.enterAIPrompt(prompt)
}

export const enterAnswerText = async (world: QuizmasterWorld, index: number, answer: string) => {
    await world.questionEditPage.enterAnswerText(index, answer)
    world.updateAnswerWip(index, { text: answer })
}

export const markAnswerCorrectness = async (world: QuizmasterWorld, index: number, isCorrect: boolean) => {
    await world.questionEditPage.setAnswerCorrectness(index, isCorrect)
    world.updateAnswerWip(index, { correct: isCorrect })
}

export const enterAnswerExplanation = async (world: QuizmasterWorld, index: number, explanation: string) => {
    await world.questionEditPage.enterAnswerExplanation(index, explanation)
    world.updateAnswerWip(index, { explanation })
}

export const enterAnswer = async (
    world: QuizmasterWorld,
    index: number,
    answer: string,
    isCorrect: boolean,
    explanation: string | undefined,
) => {
    await world.questionEditPage.enterAnswer(index, answer, isCorrect, explanation)
    world.updateAnswerWip(index, { text: answer, correct: isCorrect, explanation })
}

const fillAnswers = async (page: QuestionEditPage, answers: AnswerSpec[]) => {
    if (answers.length === 0) return

    if (isMultipleChoiceSpec(answers)) await page.setMultipleChoice()
    if (hasExplanations(answers)) await page.enableExplanations()

    for (let i = 0; i < answers.length; i++) {
        if (i >= NUM_DEFAULT_ANSWERS) await page.addAdditionalAnswer()
        const a = answers[i]
        await page.enterAnswer(i, a.text, a.correct, a.explanation)
    }
}

export const enterAnswers = async (world: QuizmasterWorld, answers: AnswerSpec[]) => {
    await fillAnswers(world.questionEditPage, answers)
    for (let i = 0; i < answers.length; i++) {
        world.updateAnswerWip(i, answers[i])
    }
}

export const enterQuestionExplanation = async (world: QuizmasterWorld, explanation: string) => {
    await world.questionEditPage.enterQuestionExplanation(explanation)
    world.updateQuestionWip({ explanation })
}

export const enterImageUrl = async (world: QuizmasterWorld, imageUrl: string) => {
    await world.questionEditPage.enterImageUrl(imageUrl)
    world.updateQuestionWip({ image: imageUrl })
}

export async function submitQuestion(this: QuizmasterWorld) {
    await this.questionEditPage.submit()
}

// ── createQuestion pipeline ─────────────────────────────

export const createQuestion = async (world: QuizmasterWorld, spec: QuestionSpec) => {
    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await world.workspacePage.createNewQuestion()

    const questionPage = world.questionEditPage
    await questionPage.enterQuestion(spec.text)

    if (isNumericalSpec(spec)) {
        await questionPage.setNumericalChoice()
        await questionPage.enterNumericalCorrectAnswer(spec.numericalAnswer as string)
        if (spec.tolerance) await questionPage.enterNumericalTolerance(spec.tolerance)
    } else {
        if (spec.tag) await questionPage.enterTag(spec.tag)
        await fillAnswers(questionPage, spec.answers)
        if (spec.easy) await questionPage.setEasy()
    }

    if (spec.explanation) await questionPage.enterQuestionExplanation(spec.explanation)
    if (spec.image) await questionPage.enterImageUrl(spec.image)

    world.bookmarkQuestion(spec.bookmark ?? spec.text, spec)

    await questionPage.submit()
    await world.workspacePage.waitForUrl(world.workspaceGuid)
}
