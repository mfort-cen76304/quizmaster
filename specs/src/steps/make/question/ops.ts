import { enterAnswer, enterImageUrl, enterQuestion, enterQuestionExplanation, enterTag } from '#steps/question/ops.ts'
import {
    hasExplanations,
    isMultipleChoiceSpec,
    isNumericalSpec,
    type AnswerSpec,
    type QuestionSpec,
} from '#steps/shared/specs.ts'
import { ensureWorkspace, navigateToWorkspace } from '#steps/workspace/ops.ts'
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
    if (isNumericalSpec(spec)) {
        throw new Error('createQuestion: numerical questions not yet supported (Step 2)')
    }

    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await world.workspacePage.createNewQuestion()
    world.questionWip = emptyQuestion()

    await enterQuestion(world, spec.text)
    if (spec.tag) await enterTag(world, spec.tag)
    await addAnswers(world, spec.answers)
    if (spec.easy) await world.questionEditPage.setEasy()
    if (spec.explanation) await enterQuestionExplanation(world, spec.explanation)
    if (spec.image) await enterImageUrl(world, spec.image)

    world.bookmarkQuestion(spec.bookmark ?? spec.text, world.questionWip)

    await world.questionEditPage.submit()
    await world.page.waitForURL(`**/workspace/${world.workspaceGuid}`)
    await world.workspacePage.editQuestion(world.questionWip.question)
}
