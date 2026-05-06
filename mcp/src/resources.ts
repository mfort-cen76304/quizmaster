import { ResourceTemplate, type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { readFile } from 'node:fs/promises'

import { QuizmasterClient, QuizmasterClientError } from './quizmaster-client.ts'
import { jsonResource, markdownResource, parseQuizmasterUri } from './schemas.ts'

export const QUIZMASTER_RESOURCE_URIS = [
    'quizmaster://domain-language',
    'quizmaster://workspace/{workspaceGuid}',
    'quizmaster://workspace/{workspaceGuid}/questions',
    'quizmaster://workspace/{workspaceGuid}/quizzes',
    'quizmaster://workspace/{workspaceGuid}/question/{questionId}',
    'quizmaster://workspace/{workspaceGuid}/quiz/{quizId}',
    'quizmaster://workspace/{workspaceGuid}/quiz/{quizId}/stats',
] as const

const domainLanguageUrl = new URL('../../docs/domain-language.md', import.meta.url)

const resourceError = (error: unknown): Error => {
    if (error instanceof QuizmasterClientError) return new Error(`${error.code}: ${error.message}`)
    if (error instanceof Error) return error
    return new Error('Unexpected Quizmaster resource failure.')
}

const readResource = async (client: QuizmasterClient, uri: URL) => {
    try {
        const parsed = parseQuizmasterUri(uri.href)

        switch (parsed.kind) {
            case 'domain-language':
                return markdownResource(uri, await readFile(domainLanguageUrl, 'utf8'))
            case 'workspace':
                return jsonResource(uri, await client.getWorkspace(parsed.workspaceGuid))
            case 'workspace-questions':
                return jsonResource(uri, await client.listQuestions(parsed.workspaceGuid))
            case 'workspace-quizzes':
                return jsonResource(uri, await client.listQuizzes(parsed.workspaceGuid))
            case 'workspace-question':
                return jsonResource(uri, await client.getQuestion(parsed.workspaceGuid, parsed.questionId))
            case 'workspace-quiz':
                return jsonResource(uri, await client.getQuiz(parsed.workspaceGuid, parsed.quizId))
            case 'workspace-quiz-stats':
                return jsonResource(uri, await client.getQuizStats(parsed.workspaceGuid, parsed.quizId))
        }
    } catch (error) {
        throw resourceError(error)
    }
}

export const registerQuizmasterResources = (server: McpServer, client: QuizmasterClient) => {
    server.registerResource(
        'quizmaster_domain_language',
        'quizmaster://domain-language',
        {
            title: 'Quizmaster Domain Language',
            description: 'Domain language from docs/domain-language.md.',
            mimeType: 'text/markdown',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}', { list: undefined }),
        {
            title: 'Quizmaster Workspace',
            description: 'Workspace metadata.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace_questions',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}/questions', { list: undefined }),
        {
            title: 'Quizmaster Workspace Questions',
            description: 'Question list items for a workspace.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace_quizzes',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}/quizzes', { list: undefined }),
        {
            title: 'Quizmaster Workspace Quizzes',
            description: 'Quiz list items for a workspace.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace_question',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}/question/{questionId}', { list: undefined }),
        {
            title: 'Quizmaster Workspace Question',
            description: 'Full workspace-scoped question.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace_quiz',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}/quiz/{quizId}', { list: undefined }),
        {
            title: 'Quizmaster Workspace Quiz',
            description: 'Full workspace-scoped quiz representation.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )

    server.registerResource(
        'quizmaster_workspace_quiz_stats',
        new ResourceTemplate('quizmaster://workspace/{workspaceGuid}/quiz/{quizId}/stats', { list: undefined }),
        {
            title: 'Quizmaster Workspace Quiz Stats',
            description: 'Quiz statistics for a workspace quiz.',
            mimeType: 'application/json',
        },
        async uri => await readResource(client, uri),
    )
}
