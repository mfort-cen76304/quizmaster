import { describe, expect, it } from 'vitest'

import { createLogger, DEFAULT_QUIZMASTER_BASE_URL, loadConfig } from '../src/config.ts'

describe('Quizmaster MCP config', () => {
    it('uses production Quizmaster by default', () => {
        expect(loadConfig({}).baseUrl).toBe(DEFAULT_QUIZMASTER_BASE_URL)
    })

    it('keeps CLI runtime on production even when legacy base URL env is present', () => {
        expect(loadConfig({ QUIZMASTER_BASE_URL: 'http://localhost:8080/' }).baseUrl).toBe(DEFAULT_QUIZMASTER_BASE_URL)
    })

    it('allows an explicit MCP base URL override for testing', () => {
        expect(loadConfig({ QUIZMASTER_MCP_BASE_URL: 'http://localhost:8080/' }).baseUrl).toBe('http://localhost:8080')
    })

    it('defaults to bearer auth and reads configured tokens', () => {
        expect(loadConfig({}).authMode).toBe('bearer')
        expect(loadConfig({}).authToken).toBeUndefined()
        expect(loadConfig({ QUIZMASTER_AUTH_TOKEN: ' token-value ' })).toMatchObject({
            authMode: 'bearer',
            authToken: 'token-value',
        })
    })

    it('allows explicit legacy local auth mode', () => {
        expect(loadConfig({ QUIZMASTER_AUTH_MODE: 'none' }).authMode).toBe('none')
    })

    it('redacts token-like log fields', () => {
        let output = ''
        const sink = {
            write: (chunk: string) => {
                output += chunk
                return true
            },
        } as NodeJS.WritableStream
        const logger = createLogger('debug', sink)

        logger.info('config', {
            authToken: 'secret-token',
            headers: {
                Authorization: 'Bearer secret-token',
            },
        })

        expect(output).toContain('[redacted]')
        expect(output).not.toContain('secret-token')
    })
})
