import { useState } from 'react'
import { useParams } from 'react-router'

import { fetchWorkspaceQuiz } from '#fe/make/api/quiz.ts'
import { Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

export const QuizSharePage = () => {
    const workspaceId = useWorkspaceId()
    const { id: quizId } = useParams()
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)

    useApi(quizId, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)

    if (!quiz) return null

    const takeUrl = `${window.location.origin}${urls.quizWelcome(quiz.id)}`

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
                <p id="no-cohorts">No cohorts yet</p>
            </section>
        </Page>
    )
}
