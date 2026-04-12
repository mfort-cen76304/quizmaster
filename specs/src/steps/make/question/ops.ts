import { ensureWorkspace, navigateToWorkspace } from '#steps/make/workspace/ops.ts'
import { enterAnswer, enterImageUrl, enterQuestion, enterQuestionExplanation, enterTag } from '#steps/question/ops.ts'
import {
    hasExplanations,
    isMultipleChoiceSpec,
    isNumericalSpec,
    type AnswerSpec,
    type QuestionSpec,
} from '#steps/shared/specs.ts'
import { emptyQuestion, type QuizmasterWorld } from '#steps/world'

// Mirrors the default count of empty answer rows shown by the question form.
// If you change this, also change in frontend/src/pages/create-question/create-question.tsx
const NUM_DEFAULT_ANSWERS = 2

const addAnswers = async (world: QuizmasterWorld, answers: AnswerSpec[]) => {
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
