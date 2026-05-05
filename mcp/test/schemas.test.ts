import { describe, expect, it } from 'vitest'

import {
    createQuestionInputSchema,
    createQuizInputSchema,
    parseQuizmasterUri,
    toQuestionRequest,
} from '../src/schemas.ts'

describe('Quizmaster MCP schemas', () => {
    it('validates multiple-choice questions need at least two correct answers', () => {
        const result = createQuestionInputSchema.safeParse({
            workspaceGuid: 'workspace-guid',
            question: 'Pick the agile values.',
            answers: ['Focus', 'Courage', 'Waterfall'],
            correctAnswers: [0],
            explanations: ['Yes', 'Yes', 'No'],
            questionExplanation: '',
            questionType: 'multiple',
            isEasy: false,
            tags: ['agile'],
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map(issue => issue.message)).toContain(
            'Multiple-choice questions must have at least two correct answers.',
        )
    })

    it('validates numerical question shape and tolerance', () => {
        const result = createQuestionInputSchema.safeParse({
            workspaceGuid: 'workspace-guid',
            question: 'How many events are in Scrum?',
            answers: ['5'],
            correctAnswers: [0],
            explanations: [''],
            questionExplanation: '',
            questionType: 'numerical',
            isEasy: false,
            tolerance: -1,
            tags: [],
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map(issue => issue.message)).toContain('Tolerance must be non-negative.')
    })

    it('normalizes nullable question fields before sending REST payloads', () => {
        const input = createQuestionInputSchema.parse({
            workspaceGuid: 'workspace-guid',
            question: 'What is the capital of France?',
            answers: ['Paris', 'Nice'],
            correctAnswers: [0],
            explanations: ['Correct', 'Incorrect'],
            questionExplanation: 'Paris is the capital.',
            questionType: 'single',
            isEasy: false,
            imageUrl: null,
            tolerance: null,
        })

        expect(toQuestionRequest(input)).toEqual({
            question: 'What is the capital of France?',
            answers: ['Paris', 'Nice'],
            correctAnswers: [0],
            explanations: ['Correct', 'Incorrect'],
            questionExplanation: 'Paris is the capital.',
            questionType: 'single',
            isEasy: false,
            imageUrl: undefined,
            tolerance: undefined,
            tags: [],
        })
    })

    it('validates quiz schedule ordering', () => {
        const result = createQuizInputSchema.safeParse({
            workspaceGuid: 'workspace-guid',
            title: 'Sprint Planning',
            description: '',
            startAt: '2026-04-15T10:00',
            endAt: '2026-04-15T09:00',
            questionIds: [1, 2],
            mode: 'exam',
            difficulty: 'keep-question',
            passScore: 80,
            timeLimit: 600,
            randomQuestionCount: 0,
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map(issue => issue.message)).toContain('endAt must not be before startAt.')
    })

    it('parses supported quizmaster resource URIs', () => {
        expect(parseQuizmasterUri('quizmaster://domain-language')).toEqual({ kind: 'domain-language' })
        expect(parseQuizmasterUri('quizmaster://workspace/workspace-guid/questions')).toEqual({
            kind: 'workspace-questions',
            workspaceGuid: 'workspace-guid',
        })
        expect(parseQuizmasterUri('quizmaster://workspace/workspace-guid/question/42')).toEqual({
            kind: 'workspace-question',
            workspaceGuid: 'workspace-guid',
            questionId: 42,
        })
        expect(parseQuizmasterUri('quizmaster://workspace/workspace-guid/quiz/7/stats')).toEqual({
            kind: 'workspace-quiz-stats',
            workspaceGuid: 'workspace-guid',
            quizId: 7,
        })
    })

    it('rejects unsupported resource URIs', () => {
        expect(() => parseQuizmasterUri('https://workspace/workspace-guid')).toThrow(
            'Quizmaster resources must use the quizmaster:// scheme.',
        )
        expect(() => parseQuizmasterUri('quizmaster://workspace/workspace-guid/question/not-a-number')).toThrow(
            'questionId must be a positive integer.',
        )
    })
})
