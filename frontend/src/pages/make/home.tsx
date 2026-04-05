import { Link } from 'react-router'
import { urls } from 'urls.ts'

export const HomePage = () => {
    return (
        <>
            <h1>Welcome to Quizmaster! You rock.</h1>
            <Link to={urls.workspaceNew()}>Create new workspace</Link>
        </>
    )
}
