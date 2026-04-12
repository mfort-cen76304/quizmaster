import type { QuizSpec } from '#steps/shared/specs.ts'
import { ensureWorkspace, navigateToWorkspace } from '#steps/workspace/ops.ts'
import { type Difficulty, type QuizMode, emptyQuizBookmark, type QuizmasterWorld } from '#steps/world'

const toDifficulty = (difficulty: string): Difficulty => {
    const mapping: Record<string, Difficulty> = {
        'Keep Question': 'keep-question',
        Easy: 'easy',
        Hard: 'hard',
    }
    const result = mapping[difficulty]
    if (!result) throw new Error(`Unknown difficulty: "${difficulty}"`)
    return result
}

export const createQuiz = async (world: QuizmasterWorld, spec: QuizSpec) => {
    await ensureWorkspace(world)
    await navigateToWorkspace(world)
    await world.workspacePage.createNewQuiz()

    const quizPage = world.quizCreatePage
    await quizPage.enterQuizName(spec.name)

    for (const bookmark of spec.questions) {
        const question = world.questionBookmarks[bookmark]
        if (!question) throw new Error(`Question bookmark "${bookmark}" not found`)
        await quizPage.selectQuestion(question.question)
    }

    if (spec.description) await quizPage.enterDescription(spec.description)
    if (spec.mode) await quizPage.selectFeedbackMode(spec.mode as QuizMode)
    if (spec.passScore) await quizPage.passScoreInput().fill(spec.passScore)
    if (spec.timeLimit) await quizPage.timeLimitInput().fill(spec.timeLimit)
    if (spec.difficulty) await quizPage.selectDifficulty(toDifficulty(spec.difficulty))
    if (spec.size) {
        await quizPage.selectRandomizedFunction()
        await quizPage.enterQuizFinalCount(spec.size)
    }

    const timeLimitValue = await quizPage.timeLimitInput().inputValue()
    await quizPage.submit()

    // Navigate to quiz to capture its URL, then back to workspace
    await world.workspacePage.takeQuiz(spec.name)
    const quizUrl = new URL(world.page.url()).pathname
    const bookmark = { ...emptyQuizBookmark(), url: quizUrl, title: spec.name }
    bookmark.timeLimit = Number.parseInt(timeLimitValue)
    world.bookmarkQuiz(spec.bookmark ?? spec.name, bookmark)
    await world.workspacePage.goto(world.workspaceGuid)
}
