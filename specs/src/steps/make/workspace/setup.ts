import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { createQuestion } from '#steps/make/question/ops.ts'
import { createWorkspace } from '#steps/make/workspace/ops.ts'
import { parseQuestionRow } from '#steps/shared/parsers.ts'

Given('workspace {string}', async function (name: string) {
    await createWorkspace(this, name)
})

Given('workspace {string} with questions', async function (name: string, data: DataTable) {
    await createWorkspace(this, name)

    for (const row of data.hashes()) {
        await createQuestion(this, parseQuestionRow(row))
    }
})
