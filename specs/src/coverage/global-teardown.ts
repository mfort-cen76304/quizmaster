import { mcr } from './mcr.config.ts'

export default async function globalTeardown() {
    if (process.env.ENABLE_COVERAGE !== '1') return
    await mcr.generate()
}
