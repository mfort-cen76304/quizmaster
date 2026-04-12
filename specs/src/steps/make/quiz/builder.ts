import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { createQuestion } from '#steps/make/question/ops.ts'
import { createQuiz } from '#steps/make/quiz/ops.ts'
import type { QuizSpec } from '#steps/shared/specs.ts'
import { parseKey } from '#steps/world'

const KNOWN_PROPS = new Set(['description', 'mode', 'pass score', 'time limit', 'difficulty', 'size'])

const applyProperties = (spec: QuizSpec, properties?: DataTable) => {
    if (!properties) return
    for (const [key, value] of properties.raw()) {
        if (!KNOWN_PROPS.has(key)) throw new Error(`Unknown quiz property: "${key}"`)
        if (key === 'description') spec.description = value
        if (key === 'mode') spec.mode = value
        if (key === 'pass score') spec.passScore = value
        if (key === 'time limit') spec.timeLimit = value
        if (key === 'difficulty') spec.difficulty = value
        if (key === 'size') spec.size = value
    }
}

Given('quiz {string} with {int} questions', async function (quizName: string, n: number, properties?: DataTable) {
    const dummyQuestion = (i: number) => ({
        text: `Question ${i}?`,
        answers: [
            { text: 'A', correct: true },
            { text: 'B', correct: false },
        ],
        bookmark: `Q${i}`,
    })

    for (let i = 1; i <= n; i++) {
        await createQuestion(this, dummyQuestion(i))
    }
    const spec: QuizSpec = { name: quizName, questions: Object.keys(this.questionBookmarks) }
    applyProperties(spec, properties)
    await createQuiz(this, spec)
})

Given('quiz {string} with all questions', async function (quizName: string, properties?: DataTable) {
    const spec: QuizSpec = { name: quizName, questions: Object.keys(this.questionBookmarks) }
    applyProperties(spec, properties)
    await createQuiz(this, spec)
})

Given(
    'quiz {string} with questions {string}',
    async function (quizName: string, bookmarkList: string, properties?: DataTable) {
        const spec: QuizSpec = { name: quizName, questions: parseKey(bookmarkList) }
        applyProperties(spec, properties)
        await createQuiz(this, spec)
    },
)
