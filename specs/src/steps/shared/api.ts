import {
    DEFAULT_DIFFICULTY,
    DEFAULT_MODE,
    DEFAULT_PASS_SCORE,
    DEFAULT_RANDOM_COUNT,
    DEFAULT_TIME_LIMIT,
} from '#shared/defaults/quiz.ts'
import { parseTimeLimitToSeconds } from '#shared/parsers/time-limit.ts'
import type { Difficulty, QuestionType, QuizMode } from '#shared/types/enums.ts'
import type { IdResponse } from '#shared/types/id-response.ts'
import type { QuestionRequest } from '#shared/types/question.ts'
import type { QuizRequest } from '#shared/types/quiz.ts'
import type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'
import type { QuestionSpec, QuizSpec } from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

export const createWorkspaceViaRest = async (world: QuizmasterWorld, name: string): Promise<string> => {
    const body: WorkspaceRequest = { title: name }
    const response = await world.page.request.post('/api/workspaces', { data: body })
    if (!response.ok()) {
        throw new Error(`POST /api/workspaces failed: ${response.status()} ${await response.text()}`)
    }
    const { guid } = (await response.json()) as WorkspaceCreateResponse
    return guid
}

const toNumericalPayload = (spec: QuestionSpec): QuestionRequest => {
    const parsedTolerance = spec.tolerance ? Number.parseFloat(spec.tolerance) : undefined
    const tolerance = parsedTolerance !== undefined && Number.isNaN(parsedTolerance) ? undefined : parsedTolerance
    return {
        question: spec.text,
        answers: [spec.numericalAnswer as string],
        correctAnswers: [0],
        explanations: [''],
        questionExplanation: spec.explanation ?? '',
        questionType: 'numerical',
        isEasy: false,
        tolerance,
        tags: spec.tag ? [spec.tag] : [],
    }
}

const toChoicePayload = (spec: QuestionSpec): QuestionRequest => {
    const answers = spec.answers.map(a => a.text)
    const correctAnswers = spec.answers.flatMap((a, i) => (a.correct ? [i] : []))
    const explanations = spec.answers.map(a => a.explanation ?? '')
    const questionType: QuestionType = correctAnswers.length > 1 ? 'multiple' : 'single'
    return {
        question: spec.text,
        answers,
        correctAnswers,
        explanations,
        questionExplanation: spec.explanation ?? '',
        questionType,
        isEasy: spec.easy ?? false,
        imageUrl: spec.image,
        tags: spec.tag ? [spec.tag] : [],
    }
}

const toQuestionPayload = (spec: QuestionSpec): QuestionRequest =>
    spec.numericalAnswer !== undefined ? toNumericalPayload(spec) : toChoicePayload(spec)

export const createQuestionViaRest = async (
    world: QuizmasterWorld,
    workspaceGuid: string,
    spec: QuestionSpec,
): Promise<number> => {
    const url = `/api/workspaces/${workspaceGuid}/questions`
    const response = await world.page.request.post(url, {
        data: toQuestionPayload(spec),
    })
    if (!response.ok()) {
        throw new Error(`POST ${url} failed: ${response.status()} ${await response.text()}`)
    }
    const { id } = (await response.json()) as IdResponse
    return id
}

// Feature files use display labels ("Keep Question"); the API takes enum values.
// This mapping is a spec-DSL concern — no FE analogue to share.
const DIFFICULTY_MAP: Record<string, Difficulty> = {
    'Keep Question': 'keep-question',
    Easy: 'easy',
    Hard: 'hard',
}

const toDifficultyValue = (difficulty: string): Difficulty => {
    const result = DIFFICULTY_MAP[difficulty]
    if (!result) throw new Error(`Unknown difficulty: "${difficulty}"`)
    return result
}

const resolveQuestionIds = (world: QuizmasterWorld, bookmarks: readonly string[]): number[] =>
    bookmarks.map(bookmark => {
        const id = world.questionIds[bookmark]
        if (id === undefined) {
            throw new Error(`Question bookmark "${bookmark}" has no REST-assigned id`)
        }
        return id
    })

const toQuizPayload = (world: QuizmasterWorld, spec: QuizSpec): QuizRequest => ({
    title: spec.name,
    description: spec.description ?? '',
    startAt: spec.startAt ?? null,
    endAt: spec.endAt ?? null,
    questionIds: resolveQuestionIds(world, spec.questions),
    mode: (spec.mode ?? DEFAULT_MODE) as QuizMode,
    difficulty: spec.difficulty ? toDifficultyValue(spec.difficulty) : DEFAULT_DIFFICULTY,
    passScore: spec.passScore ? Number.parseInt(spec.passScore, 10) : DEFAULT_PASS_SCORE,
    timeLimit: spec.timeLimit ? parseTimeLimitToSeconds(spec.timeLimit) : DEFAULT_TIME_LIMIT,
    workspaceGuid: world.workspaceGuid,
    randomQuestionCount: spec.size ? Number.parseInt(spec.size, 10) : DEFAULT_RANDOM_COUNT,
})

export const createQuizViaRest = async (
    world: QuizmasterWorld,
    workspaceGuid: string,
    spec: QuizSpec,
): Promise<number> => {
    const url = `/api/workspaces/${workspaceGuid}/quizzes`
    const response = await world.page.request.post(url, {
        data: toQuizPayload(world, spec),
    })
    if (!response.ok()) {
        throw new Error(`POST ${url} failed: ${response.status()} ${await response.text()}`)
    }
    const { id } = (await response.json()) as IdResponse
    return id
}
