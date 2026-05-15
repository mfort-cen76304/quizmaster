import { useState } from 'react'
import { useParams } from 'react-router'

import { createCohort, fetchWorkspaceQuiz, type CohortCreateError } from '#fe/make/api/quiz.ts'
import { Alert, Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizCohort } from '#shared/types/quiz.ts'

export const QuizSharePage = () => {
    const workspaceId = useWorkspaceId()
    const { id: quizId } = useParams()
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)
    const [cohorts, setCohorts] = useState<readonly QuizCohort[]>([])
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<CohortCreateError | null>(null)

    useApi(
        quizId,
        id => fetchWorkspaceQuiz(workspaceId, id),
        loaded => {
            setQuiz(loaded)
            setCohorts(loaded.cohorts ?? [])
        },
    )

    if (!quiz) return null

    const takeUrl = `${window.location.origin}${urls.quizWelcome(quiz.id)}`

    const handleAdd = async () => {
        const name = draft
        setDraft('')
        const result = await createCohort(workspaceId, quiz.id, name)
        if (result.ok) {
            const updated = await fetchWorkspaceQuiz(workspaceId, String(quiz.id))
            setCohorts(updated.cohorts ?? [])
            setError(null)
        } else {
            setError(result.error)
        }
    }

    return (
        <Page
            title={`Share ${quiz.title}`}
            id="share-page"
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
        >
            <section>
                <h2>Take link</h2>
                <a id="quiz-take-link" href={takeUrl}>
                    {takeUrl}
                </a>
            </section>
            <section>
                <h2>Cohorts</h2>
                {cohorts.length === 0 && <p id="no-cohorts">No cohorts yet</p>}
                {cohorts.length > 0 && (
                    <ul id="cohort-list">
                        {cohorts.map(cohort => {
                            const cohortUrl = `${window.location.origin}${urls.quizWelcomeWithCohort(quiz.id, cohort.guid)}`
                            return (
                                <li key={cohort.guid} className="cohort-row" data-name={cohort.name}>
                                    <span className="cohort-name">{cohort.name}</span>
                                    <a className="cohort-link" href={cohortUrl}>
                                        {cohortUrl}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                )}
                <div className="cohort-add">
                    <input
                        id="cohort-name-input"
                        type="text"
                        value={draft}
                        onChange={event => setDraft(event.target.value)}
                    />
                    <button id="add-cohort-button" type="button" onClick={handleAdd}>
                        Add cohort
                    </button>
                </div>
                {error && (
                    <Alert type="error" dataTestId={error}>
                        {error}
                    </Alert>
                )}
            </section>
        </Page>
    )
}
