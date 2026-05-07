import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'
import {
    type Background,
    type Comment,
    type Examples,
    type Feature,
    type GherkinDocument,
    IdGenerator,
    type Rule,
    type Scenario,
    type Step,
    type TableRow,
    type Tag,
} from '@cucumber/messages'

const INDENT = '  '

const indent = (level: number) => INDENT.repeat(level)

type Out = {
    lines: string[]
    sourceLines: string[]
    comments: readonly Comment[]
    nextCommentIdx: number
}

const newOut = (source: string, comments: readonly Comment[]): Out => ({
    lines: [],
    sourceLines: source.split('\n'),
    comments,
    nextCommentIdx: 0,
})

const push = (out: Out, line: string) => {
    out.lines.push(line.replace(/\s+$/, ''))
}

const ensureBlankLines = (out: Out, count: number) => {
    if (out.lines.length === 0) return
    let trailing = 0
    for (let i = out.lines.length - 1; i >= 0 && out.lines[i] === ''; i--) trailing++
    while (trailing < count) {
        out.lines.push('')
        trailing++
    }
    while (trailing > count) {
        out.lines.pop()
        trailing--
    }
}

const flushCommentsBefore = (out: Out, maxLine: number, level: number) => {
    while (out.nextCommentIdx < out.comments.length) {
        const c = out.comments[out.nextCommentIdx]
        if (c.location.line > maxLine) break
        push(out, indent(level) + c.text.trim())
        out.nextCommentIdx++
    }
}

const blanksBetween = (out: Out, fromLineExcl: number, toLineExcl: number): number => {
    let n = 0
    for (let line = fromLineExcl + 1; line < toLineExcl; line++) {
        const l = out.sourceLines[line - 1]
        if (l !== undefined && l.trim() === '') n++
    }
    return n
}

const lastLineOfStep = (step: Step): number => {
    if (step.dataTable) {
        const rows = step.dataTable.rows
        return rows[rows.length - 1].location.line
    }
    if (step.docString) {
        const ds = step.docString
        const numContent = ds.content === '' ? 0 : ds.content.split('\n').length
        return ds.location.line + numContent + 1
    }
    return step.location.line
}

const firstLineWithTags = (tags: readonly Tag[], fallback: number): number => {
    if (tags.length === 0) return fallback
    return Math.min(...tags.map(t => t.location.line))
}

const emitTags = (out: Out, tags: readonly Tag[], level: number) => {
    if (tags.length === 0) return
    const byLine = new Map<number, string[]>()
    for (const t of tags) {
        const arr = byLine.get(t.location.line) ?? []
        arr.push(t.name)
        byLine.set(t.location.line, arr)
    }
    const sortedLines = [...byLine.keys()].sort((a, b) => a - b)
    for (const ln of sortedLines) {
        const names = byLine.get(ln)
        if (names) push(out, indent(level) + names.join(' '))
    }
}

const emitDescription = (out: Out, description: string, level: number) => {
    if (!description) return
    const lines = description.split('\n')
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

    let minIndent = Infinity
    for (const ln of lines) {
        if (ln.trim() === '') continue
        const m = ln.match(/^[ \t]*/)
        if (m) minIndent = Math.min(minIndent, m[0].length)
    }
    if (!Number.isFinite(minIndent)) minIndent = 0

    const prefix = indent(level)
    for (const ln of lines) {
        push(out, ln.trim() === '' ? '' : prefix + ln.slice(minIndent))
    }
}

const alignTable = (rows: readonly TableRow[], level: number): string[] => {
    if (rows.length === 0) return []
    const numCols = rows[0].cells.length
    const widths: number[] = Array.from({ length: numCols }, () => 0)
    for (const row of rows) {
        for (let i = 0; i < numCols; i++) {
            const v = row.cells[i]?.value ?? ''
            const w = [...v].length
            if (w > widths[i]) widths[i] = w
        }
    }
    return rows.map(row => {
        const padded: string[] = []
        for (let i = 0; i < numCols; i++) {
            const v = row.cells[i]?.value ?? ''
            const pad = ' '.repeat(widths[i] - [...v].length)
            padded.push(' ' + v + pad + ' ')
        }
        return indent(level) + '|' + padded.join('|') + '|'
    })
}

const emitStep = (out: Out, step: Step, level: number) => {
    flushCommentsBefore(out, step.location.line - 1, level)
    push(out, indent(level) + step.keyword + step.text)
    if (step.dataTable) {
        for (const line of alignTable(step.dataTable.rows, level + 1)) push(out, line)
    } else if (step.docString) {
        const ds = step.docString
        const dsLevel = level + 1
        push(out, indent(dsLevel) + ds.delimiter + (ds.mediaType ?? ''))
        if (ds.content !== '') {
            for (const cl of ds.content.split('\n')) {
                push(out, cl === '' ? '' : indent(dsLevel) + cl)
            }
        }
        push(out, indent(dsLevel) + ds.delimiter)
    }
}

const emitSteps = (out: Out, steps: readonly Step[], level: number) => {
    for (let i = 0; i < steps.length; i++) {
        if (i > 0) {
            const prev = steps[i - 1]
            const curr = steps[i]
            const blanks = blanksBetween(out, lastLineOfStep(prev), curr.location.line)
            ensureBlankLines(out, blanks > 0 ? 1 : 0)
        }
        emitStep(out, steps[i], level)
    }
}

const emitExamples = (out: Out, ex: Examples, level: number) => {
    flushCommentsBefore(out, firstLineWithTags(ex.tags, ex.location.line) - 1, level)
    emitTags(out, ex.tags, level)
    push(out, indent(level) + ex.keyword + ':' + (ex.name ? ' ' + ex.name : ''))
    if (ex.description) emitDescription(out, ex.description, level + 1)
    const allRows: TableRow[] = []
    if (ex.tableHeader) allRows.push(ex.tableHeader)
    for (const r of ex.tableBody) allRows.push(r)
    if (allRows.length > 0) {
        if (ex.description) ensureBlankLines(out, 1)
        for (const line of alignTable(allRows, level + 1)) push(out, line)
    }
}

const emitScenario = (out: Out, sc: Scenario, level: number) => {
    flushCommentsBefore(out, firstLineWithTags(sc.tags, sc.location.line) - 1, level)
    emitTags(out, sc.tags, level)
    push(out, indent(level) + sc.keyword + ':' + (sc.name ? ' ' + sc.name : ''))
    if (sc.description) emitDescription(out, sc.description, level + 1)
    if (sc.steps.length > 0) {
        ensureBlankLines(out, sc.description ? 1 : 0)
        emitSteps(out, sc.steps, level + 1)
    }
    for (const ex of sc.examples) {
        ensureBlankLines(out, 1)
        emitExamples(out, ex, level + 1)
    }
}

const emitBackground = (out: Out, bg: Background, level: number) => {
    flushCommentsBefore(out, bg.location.line - 1, level)
    push(out, indent(level) + bg.keyword + ':' + (bg.name ? ' ' + bg.name : ''))
    if (bg.description) emitDescription(out, bg.description, level + 1)
    if (bg.steps.length > 0) {
        ensureBlankLines(out, bg.description ? 1 : 0)
        emitSteps(out, bg.steps, level + 1)
    }
}

const emitRule = (out: Out, rule: Rule, level: number) => {
    flushCommentsBefore(out, firstLineWithTags(rule.tags, rule.location.line) - 1, level)
    emitTags(out, rule.tags, level)
    push(out, indent(level) + rule.keyword + ':' + (rule.name ? ' ' + rule.name : ''))
    if (rule.description) emitDescription(out, rule.description, level + 1)
    let first = true
    for (const child of rule.children) {
        ensureBlankLines(out, first ? (rule.description ? 1 : 1) : 2)
        first = false
        if (child.background) emitBackground(out, child.background, level + 1)
        else if (child.scenario) emitScenario(out, child.scenario, level + 1)
    }
}

const emitFeature = (out: Out, feat: Feature) => {
    flushCommentsBefore(out, firstLineWithTags(feat.tags, feat.location.line) - 1, 0)
    emitTags(out, feat.tags, 0)
    push(out, feat.keyword + ':' + (feat.name ? ' ' + feat.name : ''))
    if (feat.description) emitDescription(out, feat.description, 1)
    let first = true
    for (const child of feat.children) {
        ensureBlankLines(out, first ? 1 : 2)
        first = false
        if (child.background) emitBackground(out, child.background, 1)
        else if (child.rule) emitRule(out, child.rule, 1)
        else if (child.scenario) emitScenario(out, child.scenario, 1)
    }
}

export const format = (source: string): string => {
    const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher())
    const doc: GherkinDocument = parser.parse(source)
    const out = newOut(source, doc.comments)
    if (doc.feature) emitFeature(out, doc.feature)
    flushCommentsBefore(out, Number.MAX_SAFE_INTEGER, 0)
    while (out.lines.length > 0 && out.lines[out.lines.length - 1] === '') out.lines.pop()
    return out.lines.length === 0 ? '' : out.lines.join('\n') + '\n'
}
