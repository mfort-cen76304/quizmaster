import { useParams } from 'react-router'

export const ROUTES = {
    home: '/',
    questionTake: '/question/:id',

    workspaceNew: '/workspace/new',
    workspace: '/workspace/:workspaceId',
    workspaceQuestionNew: '/workspace/:workspaceId/question/new',
    workspaceQuestionEdit: '/workspace/:workspaceId/question/:id/edit',

    workspaceQuizNew: '/workspace/:workspaceId/quiz/new',
    workspaceQuizEdit: '/workspace/:workspaceId/quiz/:id/edit',
    workspaceQuizStats: '/workspace/:workspaceId/quiz/:id/stats',

    quizWelcome: '/quiz/:id',
    quizTake: '/quiz/:id/questions/:questionId?',
} as const

export const urls = {
    home: () => '/',
    questionTake: (id: number | string) => `/question/${id}`,

    workspaceNew: () => '/workspace/new',
    workspace: (workspaceId: string) => `/workspace/${workspaceId}`,
    workspaceQuestionNew: (workspaceId: string) => `/workspace/${workspaceId}/question/new`,
    workspaceQuestionEdit: (workspaceId: string, id: number | string) =>
        `/workspace/${workspaceId}/question/${id}/edit`,

    workspaceQuizNew: (workspaceId: string) => `/workspace/${workspaceId}/quiz/new`,
    workspaceQuizEdit: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/edit`,
    workspaceQuizStats: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/stats`,

    quizWelcome: (id: number | string) => `/quiz/${id}`,
}

export const useWorkspaceId = () => {
    const { workspaceId } = useParams()
    return workspaceId || ''
}
