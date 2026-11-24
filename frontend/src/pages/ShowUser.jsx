import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './ShowEmployee.scss'
import './ShowUser.scss'
import FetchData from '../utilis/FetchData'
import DeleteData from '../utilis/DeleteData'
import { getUser } from '../utilis/auth'
import Status from '../components/Status/Status'
import Toast from '../components/Toast/Toast'

const API_URL = 'http://localhost:3000/user'
const getInitial = (name) => (name?.trim()?.[0] ?? '?').toUpperCase()

const ROLE_DESCRIPTION = {
    Admin: 'Full access, including user and company management.',
    Manager: 'Can view everything and manage departments, employees and reports.',
    Employee: 'Read-only access to the dashboard, companies and departments.',
}

const ShowUser = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [toast, setToast] = useState(null)
    const closeToast = useCallback(() => setToast(null), [])
    const isSelf = user?.id === getUser()?.id

    useEffect(() => {
        let ignore = false // drop a stale response if the id changes or the page closes
        async function fetchUser() {
            setIsLoading(true)
            setError('')
            try {
                const response = await FetchData(`${API_URL}/${id}`)
                if (!ignore) setUser(response?.data ?? response)
            } catch (err) {
                if (!ignore) setError(err.message || 'Failed to load user')
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        fetchUser()
        return () => { ignore = true }
    }, [id])

    const handleDelete = async () => {
        if (isSelf) return
        if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return
        setIsDeleting(true)
        try {
            await DeleteData(`${API_URL}/${user.id}`)
            navigate('/users', { replace: true })
        } catch (err) {
            setToast({ type: 'error', message: `Failed to delete user: ${err.message}` })
            setIsDeleting(false)
        }
    }

    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>
    if (!user) return <Status type="error">User not found</Status>

    const details = [
        { label: 'Name', value: user.name },
        { label: 'Email', value: user.email && <a className="employee__link" href={`mailto:${user.email}`}>{user.email}</a> },
        { label: 'Role', value: user.role },
        { label: 'User ID', value: `#${user.id}` },
    ]

    return (
        <main className="employee">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />
            <button type="button" className="employee__back" onClick={() => navigate('/users')}>
                ← Back to users
            </button>

            <header className="employee__header">
                <div className="employee__identity">
                    <span className="employee__avatar">{getInitial(user.name)}</span>
                    <div>
                        <h1 className="employee__title">{user.name}</h1>
                        <p className="employee__subtitle">
                            {user.email}{isSelf && <> · <strong>This is you</strong></>}
                        </p>
                    </div>
                </div>
                <div className="employee__badges">
                    <span className="employee__status">{user.role}</span>
                    <span className="employee__id">#{user.id}</span>
                </div>
            </header>

            <div className="user-actions">
                <Link className="user-actions__btn user-actions__btn--primary" to={`/update/user/${user.id}`}>
                    Edit user
                </Link>
                <button
                    type="button"
                    className="user-actions__btn user-actions__btn--danger"
                    onClick={handleDelete}
                    disabled={isSelf || isDeleting}
                    title={isSelf ? 'You cannot delete your own account' : undefined}
                >
                    {isDeleting ? 'Deleting...' : 'Delete user'}
                </button>
            </div>

            <div className="employee__grid">
                <section className="employee__card">
                    <div className="employee__card-header">
                        <h2 className="employee__section-title">Account</h2>
                    </div>
                    <dl className="employee__list">
                        {details.map(({ label, value }) => (
                            <div className="employee__row" key={label}>
                                <dt>{label}</dt>
                                <dd>{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="employee__card">
                    <div className="employee__card-header">
                        <h2 className="employee__section-title">Permissions</h2>
                    </div>
                    <dl className="employee__list">
                        <div className="employee__row">
                            <dt>{user.role}</dt>
                            <dd>{ROLE_DESCRIPTION[user.role] ?? '—'}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </main>
    )
}

export default ShowUser
