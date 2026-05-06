import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createQuizmasterMcpServer } from '../src/index.ts'

interface MockBackend {
    readonly baseUrl: string
    readonly close: () => Promise<void>
}

const json = (response: ServerResponse, status: number, body: unknown) => {
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(body))
}

const readBody = async (request: IncomingMessage): Promise<unknown> =>
    await new Promise(resolve => {
        let body = ''
        request.on('data', chunk => {
            body += String(chunk)
        })
        request.on('end', () => resolve(body ? JSON.parse(body) : undefined))
    })

const startMockBackend = async (): Promise<MockBackend> => {
    const server = createServer(async (request, response) => {
        if (request.method === 'GET' && request.url === '/api/feature-flag') {
            json(response, 200, true)
            return
        }
        if (
            request.method === 'GET' &&
            request.url === '/api/workspace' &&
            request.headers['x-workspace-key'] === 'demo'
        ) {
            json(response, 200, { guid: 'demo', title: 'Demo Workspace' })
            return
        }
        if (request.method === 'POST' && request.url === '/api/workspaces') {
            const body = await readBody(request)
            json(response, 200, { guid: `created-${(body as { title: string }).title}` })
            return
        }
        json(response, 404, { message: 'Not found.' })
    })

    await new Promise<void>(resolve => {
        server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address() as AddressInfo

    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: async () =>
            await new Promise<void>((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()))
            }),
    }
}

describe('Quizmaster MCP protocol', () => {
    let backend: MockBackend | undefined
    let mcpClient: Client | undefined

    beforeEach(async () => {
        backend = await startMockBackend()
        const mcpServer = createQuizmasterMcpServer({
            config: {
                baseUrl: backend.baseUrl,
                transport: 'stdio',
                logLevel: 'error',
                requestTimeoutMs: 1_000,
            },
        })
        mcpClient = new Client({ name: 'quizmaster-mcp-test', version: '0.0.0' }, { capabilities: {} })
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
        await mcpServer.connect(serverTransport)
        await mcpClient.connect(clientTransport)
    })

    afterEach(async () => {
        await mcpClient?.close()
        await backend?.close()
    })

    it('registers tools and executes representative tool calls', async () => {
        if (!mcpClient || !backend) throw new Error('MCP client was not initialized.')

        const tools = await mcpClient.listTools()
        expect(tools.tools.map(tool => tool.name)).toContain('quizmaster_health')
        expect(tools.tools.map(tool => tool.name)).toContain('quizmaster_delete_quiz')
        expect(tools.tools.find(tool => tool.name === 'quizmaster_delete_quiz')?.annotations?.destructiveHint).toBe(
            true,
        )

        const health = await mcpClient.callTool({ name: 'quizmaster_health', arguments: {} })
        expect('structuredContent' in health ? health.structuredContent : undefined).toEqual({
            baseUrl: backend.baseUrl,
            reachable: true,
        })

        const created = await mcpClient.callTool({
            name: 'quizmaster_create_workspace',
            arguments: { title: 'Training' },
        })
        expect('structuredContent' in created ? created.structuredContent : undefined).toEqual({
            guid: 'created-Training',
        })
    })

    it('registers resources and prompts', async () => {
        if (!mcpClient) throw new Error('MCP client was not initialized.')

        const templates = await mcpClient.listResourceTemplates()
        expect(templates.resourceTemplates.map(template => template.uriTemplate)).toContain(
            'quizmaster://workspace/{workspaceGuid}',
        )

        const workspace = await mcpClient.readResource({ uri: 'quizmaster://workspace/demo' })
        const content = workspace.contents[0]
        if (!content || !('text' in content)) throw new Error('Workspace resource did not return text content.')
        expect(JSON.parse(content.text)).toEqual({ guid: 'demo', title: 'Demo Workspace' })

        const prompts = await mcpClient.listPrompts()
        expect(prompts.prompts.map(prompt => prompt.name)).toContain('quizmaster_create_quiz_from_tags')

        const prompt = await mcpClient.getPrompt({
            name: 'quizmaster_create_quiz_from_tags',
            arguments: { workspaceGuid: 'demo', title: 'Training Quiz', tags: 'scrum, agile' },
        })
        expect(prompt.messages[0]?.content.type).toBe('text')
        expect(prompt.messages[0]?.content.type === 'text' ? prompt.messages[0].content.text : '').toContain(
            'Call quizmaster_list_questions',
        )
    })
})
