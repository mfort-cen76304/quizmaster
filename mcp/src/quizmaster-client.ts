import type { IdResponse } from '../../shared/types/id-response.ts'
import type { QuestionListItem } from '../../shared/types/question-list-item.ts'
import type { Question, QuestionDraft, QuestionRequest } from '../../shared/types/question.ts'
import type { QuizListItem } from '../../shared/types/quiz-list-item.ts'
import type { Quiz, QuizRequest } from '../../shared/types/quiz.ts'
import type { QuizStatsResponse } from '../../shared/types/stats.ts'
import type { Workspace, WorkspaceCreateResponse, WorkspaceRequest } from '../../shared/types/workspace.ts'
import type { McpConfig } from './config.ts'

export type QuizmasterErrorCode =
    | 'backend-validation'
    | 'not-found'
    | 'upstream-service'
    | 'backend-timeout'
    | 'backend-unreachable'
    | 'backend-error'

export interface QuizmasterClientErrorDetails {
    readonly status?: number
    readonly path?: string
    readonly baseUrl?: string
    readonly response?: unknown
}

export class QuizmasterClientError extends Error {
    constructor(
        readonly code: QuizmasterErrorCode,
        message: string,
        readonly details: QuizmasterClientErrorDetails = {},
    ) {
        super(message)
        this.name = 'QuizmasterClientError'
    }
}

export interface AiAssistantRequest {
    readonly question: string
    readonly questionType: QuestionRequest['questionType']
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

const parseJsonOrText = (text: string): unknown => {
    if (text.trim() === '') return undefined

    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

const responseMessage = (status: number, response: unknown): string => {
    if (response && typeof response === 'object') {
        const record = response as Record<string, unknown>
        for (const key of ['message', 'detail', 'error', 'title']) {
            const value = record[key]
            if (typeof value === 'string' && value.trim() !== '') return value
        }
    }
    if (typeof response === 'string' && response.trim() !== '') return response
    if (status === 400) return 'Quizmaster rejected the request.'
    if (status === 404) return 'Quizmaster resource was not found.'
    if (status === 502 || status === 503) return 'Quizmaster upstream service failed.'
    return `Quizmaster request failed with HTTP ${status}.`
}

const codeForStatus = (status: number): QuizmasterErrorCode => {
    if (status === 400) return 'backend-validation'
    if (status === 404) return 'not-found'
    if (status === 502 || status === 503) return 'upstream-service'
    return 'backend-error'
}

const stripDraftTransportFields = (question: Question & { readonly id?: number | null }): QuestionDraft => ({
    question: question.question,
    answers: question.answers,
    explanations: question.explanations,
    questionExplanation: question.questionExplanation,
    correctAnswers: question.correctAnswers,
    isEasy: question.isEasy,
    imageUrl: question.imageUrl ?? undefined,
    tolerance: question.tolerance ?? undefined,
    questionType: question.questionType,
    tags: question.tags ?? [],
})

export class QuizmasterClient {
    private readonly fetcher: typeof fetch

    constructor(
        private readonly config: McpConfig,
        fetcher: typeof fetch = fetch,
    ) {
        this.fetcher = fetcher
    }

    get baseUrl(): string {
        return this.config.baseUrl
    }

    async health(): Promise<{ readonly baseUrl: string; readonly reachable: boolean }> {
        try {
            await this.request<unknown>('GET', '/api/feature-flag')
            return { baseUrl: this.baseUrl, reachable: true }
        } catch (error) {
            if (error instanceof QuizmasterClientError && error.code === 'not-found') {
                try {
                    await this.request<unknown>('GET', '/')
                    return { baseUrl: this.baseUrl, reachable: true }
                } catch {
                    return { baseUrl: this.baseUrl, reachable: false }
                }
            }
            return { baseUrl: this.baseUrl, reachable: false }
        }
    }

    async createWorkspace(request: WorkspaceRequest): Promise<WorkspaceCreateResponse> {
        return await this.request('POST', '/api/workspaces', request)
    }

    async getWorkspace(workspaceGuid: string): Promise<Workspace> {
        return await this.request('GET', `/api/workspaces/${encodeURIComponent(workspaceGuid)}`)
    }

    async listQuestions(workspaceGuid: string): Promise<readonly QuestionListItem[]> {
        return await this.request('GET', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/questions`)
    }

    async getQuestion(workspaceGuid: string, questionId: number): Promise<Question> {
        return await this.request(
            'GET',
            `/api/workspaces/${encodeURIComponent(workspaceGuid)}/questions/${encodeURIComponent(questionId)}`,
        )
    }

    async createQuestion(workspaceGuid: string, question: QuestionRequest): Promise<IdResponse> {
        return await this.request('POST', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/questions`, question)
    }

    async updateQuestion(workspaceGuid: string, questionId: number, question: QuestionRequest): Promise<IdResponse> {
        return await this.request(
            'PATCH',
            `/api/workspaces/${encodeURIComponent(workspaceGuid)}/questions/${encodeURIComponent(questionId)}`,
            question,
        )
    }

    async deleteQuestion(workspaceGuid: string, questionId: number): Promise<void> {
        await this.request('DELETE', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/questions/${questionId}`)
    }

    async listQuizzes(workspaceGuid: string): Promise<readonly QuizListItem[]> {
        return await this.request('GET', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/quizzes`)
    }

    async getQuiz(quizId: number): Promise<Quiz> {
        return await this.request('GET', `/api/quiz/${encodeURIComponent(quizId)}`)
    }

    async createQuiz(workspaceGuid: string, quiz: QuizRequest): Promise<IdResponse> {
        return await this.request('POST', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/quizzes`, quiz)
    }

    async updateQuiz(workspaceGuid: string, quizId: number, quiz: QuizRequest): Promise<IdResponse> {
        return await this.request(
            'PUT',
            `/api/workspaces/${encodeURIComponent(workspaceGuid)}/quizzes/${encodeURIComponent(quizId)}`,
            quiz,
        )
    }

    async deleteQuiz(workspaceGuid: string, quizId: number): Promise<void> {
        await this.request('DELETE', `/api/workspaces/${encodeURIComponent(workspaceGuid)}/quizzes/${quizId}`)
    }

    async getQuizStats(workspaceGuid: string, quizId: number): Promise<QuizStatsResponse> {
        return await this.request(
            'GET',
            `/api/workspaces/${encodeURIComponent(workspaceGuid)}/quizzes/${encodeURIComponent(quizId)}/stats`,
        )
    }

    async generateQuestionDraft(request: AiAssistantRequest): Promise<QuestionDraft> {
        const response = await this.request<Question & { readonly id?: number | null }>(
            'POST',
            '/api/ai-assistant',
            request,
        )
        return stripDraftTransportFields(response)
    }

    private async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
        const url = new URL(path, this.baseUrl).toString()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)

        try {
            const response = await this.fetcher(url, {
                method,
                headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            })
            const text = await response.text()
            const parsed = parseJsonOrText(text)

            if (!response.ok) {
                throw new QuizmasterClientError(
                    codeForStatus(response.status),
                    responseMessage(response.status, parsed),
                    {
                        status: response.status,
                        path,
                        response: parsed,
                    },
                )
            }

            return parsed as T
        } catch (error) {
            if (error instanceof QuizmasterClientError) throw error
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new QuizmasterClientError(
                    'backend-timeout',
                    `Quizmaster backend timed out after ${this.config.requestTimeoutMs}ms.`,
                    { baseUrl: this.baseUrl, path },
                )
            }
            throw new QuizmasterClientError(
                'backend-unreachable',
                `Quizmaster backend is unreachable at ${this.baseUrl}.`,
                {
                    baseUrl: this.baseUrl,
                    path,
                },
            )
        } finally {
            clearTimeout(timeout)
        }
    }
}
