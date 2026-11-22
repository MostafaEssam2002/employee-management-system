import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import './ShowEmployee.scss'
import FetchData from "../utilis/FetchData"
import Status from "../components/Status/Status"

const getInitial = (name) => (name?.trim()?.[0] ?? '?').toUpperCase()

// APPLICATION_RECEIVED -> Application Received
const formatStatus = (status) =>
    status
        ? status.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : '—'

const formatDate = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return Number.isNaN(d.getTime())
        ? '—'
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDays = (days) => (days === null || days === undefined ? '—' : Number(days).toLocaleString('en-US'))

const ShowEmployee = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [employee, setEmployee] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let ignore = false // يتجاهل رد قديم لو الـ id اتغيّر أو الصفحة اتقفلت
        async function fetchEmployee() {
            setIsLoading(true)
            setError('')
            try {
                const response = await FetchData(`http://localhost:3000/employee/${id}`)
                if (!ignore) setEmployee(response?.data ?? response)
            } catch (err) {
                if (!ignore) setError(err.message || 'Failed to load employee')
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        fetchEmployee()
        return () => { ignore = true }
    }, [id])

    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>
    if (!employee) return <Status type="error">Employee not found</Status>

    const department = employee.department
    const company = department?.company

    const details = [
        { label: 'Email', value: employee.email && (
            <a className="employee__link" href={`mailto:${employee.email}`}>{employee.email}</a>
        ) },
        { label: 'Mobile', value: employee.mobile && (
            <a className="employee__link" href={`tel:${employee.mobile}`}>{employee.mobile}</a>
        ) },
        { label: 'Address', value: employee.address },
        { label: 'Designation', value: employee.designation },
        { label: 'Hired on', value: formatDate(employee.hiredOn) },
        { label: 'Days employed', value: formatDays(employee.daysEmployed) },
    ]

    return (
        <main className="employee">
            <button type="button" className="employee__back" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <header className="employee__header">
                <div className="employee__identity">
                    <span className="employee__avatar">{getInitial(employee.name)}</span>
                    <div>
                        <h1 className="employee__title">{employee.name}</h1>
                        <p className="employee__subtitle">
                            {employee.designation ?? 'Employee'}
                            {department?.name && <> · <strong>{department.name}</strong></>}
                        </p>
                    </div>
                </div>
                <div className="employee__badges">
                    <span className="employee__status">{formatStatus(employee.status)}</span>
                    <span className="employee__id">#{employee.id}</span>
                </div>
            </header>

            <section className="employee__stats">
                <div className="employee__stat">
                    <span className="employee__stat-value">{formatDays(employee.daysEmployed)}</span>
                    <span className="employee__stat-label">Days employed</span>
                </div>
                <div className="employee__stat employee__stat--light">
                    <span className="employee__stat-value">{department?.name ?? '—'}</span>
                    <span className="employee__stat-label">Department</span>
                </div>
                <div className="employee__stat employee__stat--light">
                    <span className="employee__stat-value">{company?.name ?? '—'}</span>
                    <span className="employee__stat-label">Company</span>
                </div>
            </section>

            <div className="employee__grid">
                <section className="employee__card">
                    <div className="employee__card-header">
                        <h2 className="employee__section-title">Details</h2>
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
                        <h2 className="employee__section-title">Organization</h2>
                    </div>
                    <dl className="employee__list">
                        <div className="employee__row">
                            <dt>Department</dt>
                            <dd>
                                {department?.name ? (
                                    <Link className="employee__link" to={`/department/${employee.departmentId}`}>
                                        {department.name}
                                    </Link>
                                ) : '—'}
                            </dd>
                        </div>
                        <div className="employee__row">
                            <dt>Company</dt>
                            <dd>
                                {company?.name ? (
                                    <Link className="employee__link" to={`/company/${department.companyId}`}>
                                        {company.name}
                                    </Link>
                                ) : '—'}
                            </dd>
                        </div>
                        <div className="employee__row">
                            <dt>Status</dt>
                            <dd>{formatStatus(employee.status)}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </main>
    )
}

export default ShowEmployee