import { LinkButton } from '#fe/pages/components'
import { urls } from '#fe/urls.ts'
import './home.scss'

const highlights = [
    {
        title: 'Start fast',
        description: 'Create a workspace, draft questions, and build a quiz flow without hunting through menus.',
    },
    {
        title: 'Shape better questions',
        description: 'Use AI to kick off ideas, then fine-tune answers, explanations, and difficulty in one place.',
    },
    {
        title: 'Keep it organized',
        description: 'Group content inside workspaces so your question bank stays tidy as it grows.',
    },
]

export const HomePage = () => {
    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="home-hero__content">
                    <div className="home-hero__eyebrow">Quiz authoring, simplified</div>
                    <h1>Welcome to Quizmaster! You rock.</h1>
                    <p>
                        Build quizzes that feel polished from the first question. Quizmaster helps you create
                        workspaces, draft stronger questions, and move from a rough idea to a ready-to-run quiz without
                        a clunky setup.
                    </p>
                    <div className="home-hero__actions">
                        <LinkButton
                            id="create-workspace-link"
                            className="home-hero__primary-action"
                            to={urls.workspaceNew()}
                            label="Create new workspace"
                        />
                    </div>
                </div>
                <div className="home-hero__panel" aria-hidden="true">
                    <div className="home-hero__panel-badge">Workflow</div>
                    <div className="home-hero__panel-item">
                        <span>1</span>
                        <div>
                            <strong>Create a workspace</strong>
                            <p>Keep each quiz collection in its own focused space.</p>
                        </div>
                    </div>
                    <div className="home-hero__panel-item">
                        <span>2</span>
                        <div>
                            <strong>Draft questions</strong>
                            <p>Use AI as a starting point, then refine the details.</p>
                        </div>
                    </div>
                    <div className="home-hero__panel-item">
                        <span>3</span>
                        <div>
                            <strong>Publish with confidence</strong>
                            <p>Review answers, explanations, and flow before sharing.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-highlights">
                {highlights.map(highlight => (
                    <article key={highlight.title} className="home-highlight-card">
                        <h2>{highlight.title}</h2>
                        <p>{highlight.description}</p>
                    </article>
                ))}
            </section>
        </main>
    )
}
