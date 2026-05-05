import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { pathToFileURL } from 'node:url'

import { createLogger, loadConfig, type McpConfig } from './config.ts'
import { registerQuizmasterPrompts } from './prompts.ts'
import { QuizmasterClient } from './quizmaster-client.ts'
import { registerQuizmasterResources } from './resources.ts'
import { registerQuizmasterTools } from './tools.ts'

export interface CreateQuizmasterMcpServerOptions {
    readonly config?: McpConfig
    readonly client?: QuizmasterClient
}

export const createQuizmasterMcpServer = (options: CreateQuizmasterMcpServerOptions = {}): McpServer => {
    const config = options.config ?? loadConfig()
    const client = options.client ?? new QuizmasterClient(config)

    const server = new McpServer(
        {
            name: 'quizmaster-mcp',
            version: '0.0.0',
        },
        {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
            instructions:
                'Use this server to inspect and manage Quizmaster workspaces, questions, quizzes, quiz statistics, and AI-generated question drafts through the Quizmaster REST API.',
        },
    )

    registerQuizmasterTools(server, client)
    registerQuizmasterResources(server, client)
    registerQuizmasterPrompts(server)

    return server
}

const main = async () => {
    const config = loadConfig()
    const logger = createLogger(config.logLevel)

    if (config.transport !== 'stdio') {
        throw new Error(`Unsupported transport: ${config.transport}`)
    }

    const server = createQuizmasterMcpServer({ config })
    logger.info('Starting Quizmaster MCP server.', { baseUrl: config.baseUrl, transport: config.transport })
    await server.connect(new StdioServerTransport())
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
    main().catch(error => {
        const message = error instanceof Error ? error.message : 'Unknown Quizmaster MCP startup failure.'
        process.stderr.write(`[quizmaster-mcp] error: ${message}\n`)
        process.exit(1)
    })
}
