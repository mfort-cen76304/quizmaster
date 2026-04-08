import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { createQuestion } from '#steps/make/question/ops.ts'
import type { AnswerSpec, QuestionSpec } from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

const requireSpec = (world: QuizmasterWorld): QuestionSpec => {
    if (!world.questionSpecWip) {
        throw new Error('No question spec in progress — start with `Given a question "..."`')
    }
    return world.questionSpecWip
}

Given('question {string}', function (question: string) {
    this.questionSpecWip = {
        text: question,
        answers: [],
    }
})

Given('with image {string}', function (imageUrl: string) {
    requireSpec(this).image = imageUrl
})

Given('with numerical answer {string}', function (value: string) {
    requireSpec(this).numericalAnswer = value
})

Given('with tolerance {string}', function (value: string) {
    requireSpec(this).tolerance = value
})

Given('with tag {string}', function (tag: string) {
    requireSpec(this).tag = tag
})

Given('with answers:', function (answerTable: DataTable) {
    requireSpec(this).answers = answerTable.raw().map(
        (row): AnswerSpec => ({
            text: row[0],
            correct: row[1] === '*',
            explanation: row[2],
        }),
    )
})

Given('with explanation {string}', function (explanation: string) {
    requireSpec(this).explanation = explanation
})

Given('marked as easy', function () {
    requireSpec(this).easy = true
})

Given('saved and bookmarked as {string}', async function (bookmark: string) {
    const spec = requireSpec(this)
    spec.bookmark = bookmark
    await createQuestion(this, spec)
    this.questionSpecWip = undefined
})
