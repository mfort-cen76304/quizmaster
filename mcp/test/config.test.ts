import { describe, expect, it } from 'vitest'

import { DEFAULT_QUIZMASTER_BASE_URL, loadConfig } from '../src/config.ts'

describe('Quizmaster MCP config', () => {
    it('uses production Quizmaster by default', () => {
        expect(loadConfig({}).baseUrl).toBe(DEFAULT_QUIZMASTER_BASE_URL)
    })

    it('keeps CLI runtime on production even when legacy base URL env is present', () => {
        expect(loadConfig({ QUIZMASTER_BASE_URL: 'http://localhost:8080/' }).baseUrl).toBe(DEFAULT_QUIZMASTER_BASE_URL)
    })
})
