import { describe, expect, it } from 'vitest'

import type { McpConfig } from '../src/config.ts'
import { QuizmasterClient, QuizmasterClientError } from '../src/quizmaster-client.ts'

const testConfig = (timeout = 50): McpConfig => ({
    baseUrl: 'http://quizmaster.test',
    transport: 'stdio',
    logLevel: 'error',
    requestTimeoutMs: timeout,
})

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

describe('QuizmasterClient', () => {
    it('constructs encoded REST URLs and JSON request bodies', async () => {
        let capturedUrl = ''
        let capturedBody: unknown
        const fetcher: typeof fetch = async (input, init) => {
            capturedUrl = String(input)
            capturedBody = JSON.parse(String(init?.body))
            return jsonResponse({ id: 42 })
        }

        const client = new QuizmasterClient(testConfig(), fetcher)
        await client.createQuestion('workspace guid', {
            question: 'Question?',
            answers: ['A', 'B'],
            correctAnswers: [0],
            explanations: ['Yes', 'No'],
            questionExplanation: '',
            questionType: 'single',
            isEasy: false,
            tags: [],
        })

        expect(capturedUrl).toBe('http://quizmaster.test/api/workspaces/workspace%20guid/questions')
        expect(capturedBody).toMatchObject({ question: 'Question?', questionType: 'single' })
    })

    it('maps REST not-found responses into typed client errors', async () => {
        const fetcher: typeof fetch = async () => jsonResponse({ message: 'Missing workspace.' }, 404)
        const client = new QuizmasterClient(testConfig(), fetcher)

        await expect(client.getWorkspace('missing')).rejects.toMatchObject({
            code: 'not-found',
            message: 'Missing workspace.',
            details: {
                status: 404,
                path: '/api/workspaces/missing',
            },
        })
    })

    it('maps aborts into backend-timeout errors', async () => {
        const fetcher: typeof fetch = async (_input, init) =>
            await new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
            })
        const client = new QuizmasterClient(testConfig(1), fetcher)

        await expect(client.getWorkspace('slow')).rejects.toBeInstanceOf(QuizmasterClientError)
        await expect(client.getWorkspace('slow')).rejects.toMatchObject({ code: 'backend-timeout' })
    })

    it('normalizes AI assistant responses into drafts without transport fields', async () => {
        const fetcher: typeof fetch = async () =>
            jsonResponse({
                id: null,
                workspaceGuid: null,
                question: 'What is Scrum?',
                answers: ['A framework', 'A database'],
                explanations: ['Correct', 'Incorrect'],
                questionExplanation: 'Scrum is a framework.',
                correctAnswers: [0],
                isEasy: false,
                imageUrl: null,
                tolerance: null,
                questionType: 'single',
                tags: [],
            })
        const client = new QuizmasterClient(testConfig(), fetcher)

        await expect(
            client.generateQuestionDraft({ question: 'Create one.', questionType: 'single' }),
        ).resolves.toEqual({
            question: 'What is Scrum?',
            answers: ['A framework', 'A database'],
            explanations: ['Correct', 'Incorrect'],
            questionExplanation: 'Scrum is a framework.',
            correctAnswers: [0],
            isEasy: false,
            imageUrl: undefined,
            tolerance: undefined,
            questionType: 'single',
            tags: [],
        })
    })
})
