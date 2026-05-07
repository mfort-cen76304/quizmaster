import fs from 'node:fs'
import path from 'node:path'

import { format } from './formatter.ts'

const collectFiles = (p: string, out: string[]): void => {
    const stat = fs.statSync(p)
    if (stat.isFile() && p.endsWith('.feature')) {
        out.push(p)
    } else if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
            collectFiles(path.join(p, entry.name), out)
        }
    }
}

const main = () => {
    const args = process.argv.slice(2)
    const checkOnly = args.includes('--check')
    const paths = args.filter(a => a !== '--check')

    if (paths.length === 0) {
        console.error('Usage: gherkin-fmt [--check] <paths...>')
        process.exit(2)
    }

    const files: string[] = []
    for (const p of paths) collectFiles(p, files)

    let drift = 0
    let errors = 0

    for (const file of files) {
        const original = fs.readFileSync(file, 'utf8')
        let formatted: string
        try {
            formatted = format(original)
        } catch (e) {
            errors++
            console.error(`error: ${file}: ${(e as Error).message}`)
            continue
        }
        if (formatted !== original) {
            drift++
            if (checkOnly) console.log(file)
            else fs.writeFileSync(file, formatted, 'utf8')
        }
    }

    if (errors > 0) process.exit(1)
    if (checkOnly && drift > 0) process.exit(1)
}

main()
