import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type { QuestionPage, QuizCreatePage, QuizScorePage, QuizStatsPage, TakeQuestionPage } from '#pages/index.ts'
import type { Answer } from '#steps/world'

export const expectQuizResult = async (
    page: QuizScorePage,
    expectedCorrectAnswers: string,
    expectedTotalQuestions: number,
    expectedPercentage: number,
    expectedTextResult: string,
    expectedPassScore: number,
) => {
    await page.expectCorrectAnswers(expectedCorrectAnswers)
    await page.expectTotalQuestions(expectedTotalQuestions)
    await page.expectPercentageResult(expectedPercentage)
    await page.expectTextResult(expectedTextResult)
    await page.expectPassScore(expectedPassScore)
}

export const expectOriginalResult = async (
    page: QuizScorePage,
    expectedCorrectAnswers: number,
    expectedPercentage: number,
    expectedTextResult: string,
) => {
    await page.expectFirstCorrectAnswers(expectedCorrectAnswers)
    await page.expectFirstPercentageResult(expectedPercentage)
    await page.expectFirstTextResult(expectedTextResult)
}

export const expectOriginalResultNotVisible = async (page: QuizScorePage) => {
    await page.expectFirstResultNotVisible()
}

export const expectAllOptionsForQuestion = async (page: QuizScorePage, question: string, expectedAnswers: Answer[]) => {
    const answers = await page.answers(question)
    expect(answers.length).toBe(expectedAnswers.length)
    for (const answer of expectedAnswers) {
        expect(answers).toContain(answer.answer)
    }
}

export const expectNavigationButtons = async (questionPage: QuestionPage, expectedButtons: string[]) => {
    const buttonLocatorMap: Record<string, () => ReturnType<typeof questionPage.backButtonLocator>> = {
        Back: () => questionPage.backButtonLocator(),
        Next: () => questionPage.nextButtonLocator(),
        Evaluate: () => questionPage.evaluateButtonLocator(),
    }

    for (const name of expectedButtons) {
        const locator = buttonLocatorMap[name]
        if (!locator) throw new Error(`Unknown button: "${name}"`)
        await expect(locator()).toBeVisible()
    }

    await expect(questionPage.navigationButtonsLocator()).toHaveCount(expectedButtons.length)
}

export const expectAnswersChecked = async (takeQuestionPage: TakeQuestionPage, answers: string[], checked: boolean) => {
    for (const answer of answers) {
        if (checked) {
            await expect(takeQuestionPage.answerCheckLocator(answer)).toBeChecked()
        } else {
            await expect(takeQuestionPage.answerCheckLocator(answer)).not.toBeChecked()
        }
    }
}

export const expectStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const statsTableBodyRows = quizStatsPage.attemptStatsBodyRows()
    const actualRowCount = await statsTableBodyRows.count()

    const expectedRows = data.rows().filter(row => row.some(cell => cell.trim() !== ''))

    expect(actualRowCount).toBe(expectedRows.length)

    for (let i = 0; i < expectedRows.length; i++) {
        const expectedRow = expectedRows[i]

        for (let j = 0; j < expectedRow.length; j++) {
            const expectedCell = expectedRow[j].trim()
            if (expectedCell !== '') {
                await quizStatsPage.expectAttemptStatsBodyRowCell(i, j, expectedCell)
            }
        }
    }
}

const parseLabeledStatsData = (data: DataTable) => {
    const rawRows = data.raw()
    const [captionRow = [], headerRow = [], ...bodyRows] = rawRows
    const captionText = captionRow[0]?.trim() || undefined
    const headerCells = headerRow.map(c => c.trim())
    const filteredBodyRows = bodyRows
        .filter(row => row.some(cell => cell.trim() !== ''))
        .map(row => row.map(cell => cell.trim()))
    return { captionText, headerCells, bodyRows: filteredBodyRows }
}

export const expectSummaryStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const { captionText, headerCells, bodyRows } = parseLabeledStatsData(data)
    await quizStatsPage.expectLabeledTable('summary', captionText, headerCells, bodyRows)
}

export const expectAttemptStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const { captionText, headerCells, bodyRows } = parseLabeledStatsData(data)
    await quizStatsPage.expectLabeledTable('attempt', captionText, headerCells, bodyRows)
}

export const expectCorrectAnswersCounts = (correctAnswersCounts: Record<string, string>, rows: string[][]) => {
    for (const [bookmark, expected] of rows) {
        expect(correctAnswersCounts[bookmark]).toBe(expected)
    }
}

export const expectQuizFormErrors = async (quizCreatePage: QuizCreatePage, expectedErrors: string[]) => {
    for (const error of expectedErrors) {
        await expect.poll(() => quizCreatePage.hasError(error)).toBe(true)
    }
}
