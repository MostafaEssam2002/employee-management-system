import './ShowDepartments.scss'

// Placeholder for pages that are not built yet (Dashboard / Reports / Settings)
const ComingSoon = ({ title }) => (
    <main className="departments">
        <header className="departments__header">
            <div>
                <h1 className="departments__title">{title}</h1>
                <p className="departments__subtitle">This page is coming soon.</p>
            </div>
        </header>
    </main>
)

export default ComingSoon
