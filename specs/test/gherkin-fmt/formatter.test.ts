import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { format } from '../../src/gherkin-fmt/formatter.ts'

const FIXTURES = path.resolve(import.meta.dirname, 'fixtures')

const fixtureNames = fs
    .readdirSync(FIXTURES)
    .filter(n => n.endsWith('.input.feature'))
    .map(n => n.replace('.input.feature', ''))
    .sort()

describe('gherkin formatter', () => {
    for (const name of fixtureNames) {
        const inputPath = path.join(FIXTURES, `${name}.input.feature`)
        const expectedPath = path.join(FIXTURES, `${name}.expected.feature`)
        const input = fs.readFileSync(inputPath, 'utf8')
        const expected = fs.readFileSync(expectedPath, 'utf8')

        it(`formats ${name}`, () => {
            expect(format(input)).toBe(expected)
        })

        it(`is idempotent on ${name}`, () => {
            const once = format(input)
            const twice = format(once)
            expect(twice).toBe(once)
        })
    }
})
