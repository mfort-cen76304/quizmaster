import type { DataTable } from '@cucumber/cucumber'

import { type Difficulty, type QuizMode, type QuizmasterWorld, emptyQuizBookmark } from '#steps/world'

export const openQuiz = async (world: QuizmasterWorld, quizId: string) => {
    const quizUrl = world.quizBookmarks[quizId]?.url || `/quiz/${quizId}`
    await world.page.goto(quizUrl)
}

export const ensureFakeClockInstalled = async (world: QuizmasterWorld) => {
    if (!world.clockInstalled) {
        await world.page.clock.install({ time: new Date() })
        world.clockInstalled = true
    }
}

export const startQuiz = async (world: QuizmasterWorld, quizId: string) => {
    await ensureFakeClockInstalled(world)
    await openQuiz(world, quizId)
    await world.quizWelcomePage.start()
    world.activeQuizBookmark = quizId
}

export const answerNth = async (world: QuizmasterWorld, n: number) => {
    await world.takeQuestionPage.waitForLoaded()
    await world.takeQuestionPage.selectAnswerNth(n)
    await world.takeQuestionPage.submit()
}

export const answerCorrectly = async (world: QuizmasterWorld) => answerNth(world, 0)
export const answerIncorrectly = async (world: QuizmasterWorld) => answerNth(world, 1)

export const repeatAsync = async (n: number, fn: () => Promise<void>) => {
    for (let i = 0; i < n; i++) await fn()
}

const toDifficulty = (difficulty: string): Difficulty | undefined => {
    const mapping: Record<string, Difficulty> = {
        'Keep Question': 'keep-question',
        Easy: 'easy',
        Hard: 'hard',
    }
    return mapping[difficulty]
}

export const createQuizViaUI = async (
    world: QuizmasterWorld,
    quizName: string,
    questionBookmarks: string[],
    properties?: DataTable,
) => {
    await world.workspacePage.createNewQuiz()
    await world.quizCreatePage.enterQuizName(quizName)

    for (const bookmark of questionBookmarks) {
        const question = world.questionBookmarks[bookmark]
        if (!question) throw new Error(`Question bookmark "${bookmark}" not found`)
        await world.quizCreatePage.selectQuestion(question.question)
    }

    if (properties) {
        const props = Object.fromEntries(properties.raw())

        if (props.description) {
            await world.quizCreatePage.enterDescription(props.description)
        }

        if (props.mode) {
            await world.quizCreatePage.selectFeedbackMode(props.mode as QuizMode)
        }

        if (props['pass score']) {
            await world.quizCreatePage.passScoreInput().fill(props['pass score'])
        }

        if (props['time limit']) {
            await world.quizCreatePage.timeLimitInput().fill(props['time limit'])
        }

        if (props.difficulty) {
            const difficulty = toDifficulty(props.difficulty)
            if (difficulty) await world.quizCreatePage.selectDifficulty(difficulty)
        }

        if (props.size) {
            await world.quizCreatePage.selectRandomizedFunction()
            await world.quizCreatePage.enterQuizFinalCount(props.size)
        }
    }

    const timeLimitValue = await world.quizCreatePage.timeLimitInput().inputValue()
    await world.quizCreatePage.submit()

    // Store quiz bookmark so 'I start quiz "X"' can find it
    await world.workspacePage.takeQuiz(quizName)
    const quizUrl = new URL(world.page.url()).pathname
    const bookmark = { ...emptyQuizBookmark(), url: quizUrl, title: quizName }
    bookmark.timeLimit = Number.parseInt(timeLimitValue)

    world.quizBookmarks[quizName] = bookmark
    world.activeQuizBookmark = quizName
    await world.workspacePage.goto(world.workspaceGuid)
}

export const finishQuizInSeconds = async (world: QuizmasterWorld, seconds: number) => {
    await world.page.clock.fastForward(seconds * 1000)
    await world.questionPage.evaluateButtonLocator().click()
    await world.workspacePage.goto(world.workspaceGuid)
}

export const progressThroughQuestions = async (world: QuizmasterWorld) => {
    const textToBookmark: Record<string, string> = {}
    for (const [bookmark, question] of Object.entries(world.questionBookmarks)) {
        textToBookmark[question.question] = bookmark
    }

    const questionCount = Object.keys(textToBookmark).length

    for (let i = 0; i < questionCount; i++) {
        await world.takeQuestionPage.waitForLoaded()

        const questionText = (await world.takeQuestionPage.questionText()) || ''
        const bookmark = textToBookmark[questionText] || questionText

        const countLocator = world.takeQuestionPage.correctAnswersCountLocator()
        const isVisible = await countLocator.isVisible()

        if (isVisible) {
            const count = await countLocator.textContent()
            world.correctAnswersCounts[bookmark] = count || '-'
        } else {
            world.correctAnswersCounts[bookmark] = '-'
        }

        await world.takeQuestionPage.selectAnswerNth(0)
        await world.takeQuestionPage.submit()
    }
}
