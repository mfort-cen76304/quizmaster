import type { Response as PlaywrightResponse } from '@playwright/test'

import { advanceServerClock } from '#steps/clock.ts'
import type { QuizmasterWorld } from '#steps/world'

export const openQuiz = async (world: QuizmasterWorld, quizBookmark: string) => {
    const quizUrl = world.quizBookmarks[quizBookmark]
    await world.page.goto(quizUrl)
}

export const ensureFakeClockInstalled = async (world: QuizmasterWorld) => {
    if (!world.clockInstalled) {
        await world.page.clock.install({ time: new Date() })
        world.clockInstalled = true
    }
}

export const startQuiz = async (world: QuizmasterWorld, quizBookmark: string) => {
    await ensureFakeClockInstalled(world)
    await openQuiz(world, quizBookmark)
    const browserNow = await world.page.evaluate(() => Date.now())
    await world.page.clock.pauseAt(browserNow + 60_000)
    await world.quizWelcomePage.start()
    world.activeQuizBookmark = quizBookmark
}

const isQuizQuestionSubmitResponse = (response: PlaywrightResponse) => {
    const url = new URL(response.url())
    return (
        response.request().method() === 'POST' &&
        /\/api\/quiz\/\d+\/attempts\/\d+\/questions\/\d+\/submit$/.test(url.pathname) &&
        response.status() < 400
    )
}

const waitForAnswerSettled = async (world: QuizmasterWorld, progressBefore: number, progressMax: number) => {
    const signals = [
        world.takeQuestionPage.questionFeedbackLocator().waitFor({ state: 'visible' }),
        world.questionPage.evaluateButtonLocator().waitFor({ state: 'visible' }),
    ]

    if (progressBefore < progressMax) {
        signals.push(world.questionPage.expectProgress(progressBefore + 1, progressMax))
    }

    await Promise.any(signals)
}

export const answerNth = async (world: QuizmasterWorld, n: number) => {
    await world.takeQuestionPage.waitForLoaded()
    const progressBefore = await world.questionPage.progressCurrent()
    const progressMax = await world.questionPage.progressMax()
    const submitResponse = world.page.waitForResponse(isQuizQuestionSubmitResponse)

    await world.takeQuestionPage.selectAnswerNth(n)
    await world.takeQuestionPage.submit()
    await submitResponse
    await waitForAnswerSettled(world, progressBefore, progressMax)
}

export const answerCorrectly = async (world: QuizmasterWorld) => answerNth(world, 0)
export const answerIncorrectly = async (world: QuizmasterWorld) => answerNth(world, 1)

export const repeatAsync = async (n: number, fn: () => Promise<void>) => {
    for (let i = 0; i < n; i++) await fn()
}

export const finishQuizInSeconds = async (world: QuizmasterWorld, seconds: number) => {
    await advanceServerClock(world, seconds)
    await world.page.clock.fastForward(seconds * 1000)
    await world.questionPage.evaluateButtonLocator().click()
    await world.workspacePage.goto(world.workspaceGuid)
}

export const progressThroughQuestions = async (world: QuizmasterWorld) => {
    const textToBookmark: Record<string, string> = {}
    for (const [bookmark, question] of Object.entries(world.questionBookmarks)) {
        textToBookmark[question.text] = bookmark
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
        const progressBefore = await world.questionPage.progressCurrent()
        const progressMax = await world.questionPage.progressMax()
        const submitResponse = world.page.waitForResponse(isQuizQuestionSubmitResponse)
        await world.takeQuestionPage.submit()
        await submitResponse
        await waitForAnswerSettled(world, progressBefore, progressMax)
    }
}
