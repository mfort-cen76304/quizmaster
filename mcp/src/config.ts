export type McpTransport = 'stdio'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type AuthMode = 'bearer' | 'none'

export interface McpConfig {
    readonly baseUrl: string
    readonly transport: McpTransport
    readonly logLevel: LogLevel
    readonly requestTimeoutMs: number
    readonly authMode: AuthMode
    readonly authToken?: string
}

export interface Logger {
    readonly debug: (message: string, details?: unknown) => void
    readonly info: (message: string, details?: unknown) => void
    readonly warn: (message: string, details?: unknown) => void
    readonly error: (message: string, details?: unknown) => void
}

export const DEFAULT_QUIZMASTER_BASE_URL = 'https://quizmaster.scrumdojo.cz'

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error']
const AUTH_MODES: readonly AuthMode[] = ['bearer', 'none']
const SECRET_KEY_PATTERN = /(authorization|token)/i
const LOG_SEVERITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
}

const normalizeBaseUrl = (value: string): string => {
    const url = new URL(value)
    url.hash = ''
    url.search = ''
    return url.toString().replace(/\/$/, '')
}

const parseLogLevel = (value: string | undefined): LogLevel => {
    if (!value) return 'info'
    if (LOG_LEVELS.includes(value as LogLevel)) return value as LogLevel
    throw new Error(`Unsupported QUIZMASTER_MCP_LOG_LEVEL "${value}". Expected one of: ${LOG_LEVELS.join(', ')}.`)
}

const parseTransport = (value: string | undefined): McpTransport => {
    const transport = value ?? 'stdio'
    if (transport === 'stdio') return transport
    throw new Error('Only stdio transport is supported for the Quizmaster MCP MVP.')
}

const parseAuthMode = (value: string | undefined): AuthMode => {
    const authMode = value ?? 'bearer'
    if (AUTH_MODES.includes(authMode as AuthMode)) return authMode as AuthMode
    throw new Error(`Unsupported QUIZMASTER_AUTH_MODE "${value}". Expected one of: ${AUTH_MODES.join(', ')}.`)
}

const parseTimeout = (value: string | undefined): number => {
    if (!value) return 10_000

    const timeout = Number.parseInt(value, 10)
    if (!Number.isFinite(timeout) || timeout <= 0) {
        throw new Error('QUIZMASTER_MCP_REQUEST_TIMEOUT_MS must be a positive integer.')
    }
    return timeout
}

const parseOptionalSecret = (value: string | undefined): string | undefined => {
    const secret = value?.trim()
    return secret ? secret : undefined
}

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): McpConfig => ({
    baseUrl: normalizeBaseUrl(env.QUIZMASTER_MCP_BASE_URL ?? DEFAULT_QUIZMASTER_BASE_URL),
    transport: parseTransport(env.QUIZMASTER_MCP_TRANSPORT),
    logLevel: parseLogLevel(env.QUIZMASTER_MCP_LOG_LEVEL),
    requestTimeoutMs: parseTimeout(env.QUIZMASTER_MCP_REQUEST_TIMEOUT_MS),
    authMode: parseAuthMode(env.QUIZMASTER_AUTH_MODE),
    authToken: parseOptionalSecret(env.QUIZMASTER_AUTH_TOKEN),
})

export const createLogger = (level: LogLevel, sink: NodeJS.WritableStream = process.stderr): Logger => {
    const shouldLog = (nextLevel: LogLevel) => LOG_SEVERITY[nextLevel] >= LOG_SEVERITY[level]
    const redact = (_key: string, value: unknown) => (_key && SECRET_KEY_PATTERN.test(_key) ? '[redacted]' : value)
    const write = (nextLevel: LogLevel, message: string, details?: unknown) => {
        if (!shouldLog(nextLevel)) return

        const payload = details === undefined ? '' : ` ${JSON.stringify(details, redact)}`
        sink.write(`[quizmaster-mcp] ${nextLevel}: ${message}${payload}\n`)
    }

    return {
        debug: (message, details) => write('debug', message, details),
        info: (message, details) => write('info', message, details),
        warn: (message, details) => write('warn', message, details),
        error: (message, details) => write('error', message, details),
    }
}
