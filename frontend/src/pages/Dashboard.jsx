import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.scss'
import Status from '../components/Status/Status'
import Toast from '../components/Toast/Toast'
import DonutChart from '../components/DonutChart/DonutChart'
import useDashboard from '../hooks/useDashboard'
import DeleteData from '../utilis/DeleteData'
import { ADMIN_AND_MANAGER, ADMIN_ONLY, getUser, hasRole } from '../utilis/auth'
import {
    ArrowDownIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    BellIcon,
    BuildingIcon,
    CalendarIcon,
    ChartIcon,
    CheckIcon,
    CloseIcon,
    DepartmentsIcon,
    DocumentIcon,
    EditIcon,
    EmployeesIcon,
    EyeIcon,
    RefreshIcon,
    SearchIcon,
    TrashIcon,
    UserIcon,
} from '../assets/icons'

const API_URL = 'http://localhost:3000'
const COMPANY_COLORS = ['#2f6df6', '#6d4de0', '#19b37a']

const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'

const formatNumber = (n) => Number(n ?? 0).toLocaleString('en-US')
const formatBadge = (n) => (n > 99 ? '99+' : n)
const formatDate = (iso) => (iso ? iso.slice(0, 10) : '—')
const formatDays = (days) => (days === null || days === undefined ? '—' : days)

const formatUpdated = (date) => {
    if (!date) return '—'
    const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return `${day} - ${time}`
}

const Growth = ({ difference }) => {
    if (difference === 0) return <p className="stat__growth stat__growth--flat">No change from last month</p>
    const isUp = difference > 0
    return (
        <p className={`stat__growth stat__growth--${isUp ? 'up' : 'down'}`}>
            {isUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
            <span><b>{isUp ? `+${formatNumber(difference)}` : formatNumber(difference)}</b> from last month</span>
        </p>
    )
}

const Dashboard = () => {
    const navigate = useNavigate()
    const user = getUser()
    const isAdmin = hasRole(ADMIN_ONLY, user?.role)
    // Manager + Admin can open/edit employees; only Admin can delete. Employee sees no employee data.
    const canViewEmployees = hasRole(ADMIN_AND_MANAGER, user?.role)
    const showActions = canViewEmployees

    const { stats, topCompanies, recentEmployees, sectionErrors, isLoading, isRefreshing, error, lastUpdated, refresh } =
        useDashboard({ includeEmployees: canViewEmployees })

    const [search, setSearch] = useState('')
    const [hiddenSegments, setHiddenSegments] = useState([])
    const [toast, setToast] = useState(null)
    const closeToast = useCallback(() => setToast(null), [])

    const query = search.trim().toLowerCase()
    const matches = (...values) => !query || values.some((value) => String(value ?? '').toLowerCase().includes(query))

    const visibleCompanies = useMemo(
        () => topCompanies.filter((company) => matches(company.name)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [topCompanies, query]
    )
    const visibleEmployees = useMemo(
        () =>
            recentEmployees.filter((employee) =>
                matches(employee.name, employee.email, employee.designation, employee.department?.name, employee.department?.company?.name)
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [recentEmployees, query]
    )

    const toggleSegment = (label) =>
        setHiddenSegments((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

    const handleDelete = async (employee) => {
        if (!window.confirm(`Delete ${employee.name}?`)) return
        try {
            await DeleteData(`${API_URL}/employee/${employee.id}`)
            setToast({ type: 'success', message: 'Employee deleted successfully' })
            refresh()
        } catch (err) {
            setToast({ type: 'error', message: `Failed to delete employee: ${err.message}` })
        }
    }

    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>

    const cards = [
        { key: 'companies', label: 'Total Companies', data: stats.numberOfCompanies, Icon: BuildingIcon },
        { key: 'departments', label: 'Total Departments', data: stats.numberOfDepts, Icon: DepartmentsIcon },
        { key: 'employees', label: 'Total Employees', data: stats.numberOfEmployees, Icon: EmployeesIcon },
        { key: 'hired', label: 'Hired Employees', data: stats.numberOfHiredEmployees, Icon: UserIcon },
    ]

    const workflow = [
        { key: 'received', label: 'Application Received', value: stats.numberOfApplicationRecievedEmployees, Icon: DocumentIcon },
        { key: 'interview', label: 'Interview Scheduled', value: stats.numberOfInterviewScheduledEmployees, Icon: CalendarIcon },
        { key: 'hired', label: 'Hired', value: stats.numberOfHiredEmployees.total, Icon: CheckIcon },
        { key: 'rejected', label: 'Not Accepted', value: stats.numberOfNotAcceptedEmployees, Icon: CloseIcon },
    ]

    const segments = [
        { label: 'Companies', value: stats.numberOfCompanies.total, color: '#2f6df6' },
        { label: 'Departments', value: stats.numberOfDepts.total, color: '#19b37a' },
        { label: 'Employees', value: stats.numberOfEmployees.total, color: '#6d4de0' },
    ]

    return (
        <main className="dashboard">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <header className="dashboard__topbar">
                <label className="dashboard__search">
                    <SearchIcon />
                    <input
                        type="search"
                        placeholder="Search companies or employees…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
                <div className="dashboard__user">
                    <button
                        type="button"
                        className="dashboard__bell"
                        aria-label={`${stats.numberOfApplicationRecievedEmployees} applications waiting for review`}
                        title="Applications waiting for review"
                        onClick={canViewEmployees ? () => navigate('/employees') : undefined}
                    >
                        <BellIcon />
                        {stats.numberOfApplicationRecievedEmployees > 0 && (
                            <span className="dashboard__badge">{formatBadge(stats.numberOfApplicationRecievedEmployees)}</span>
                        )}
                    </button>
                    <span className="dashboard__avatar" title={user?.name}>{getInitials(user?.name)}</span>
                </div>
            </header>

            <div className="dashboard__body">
                <section className="dashboard__heading">
                    <div className="dashboard__heading-text">
                        <span className="dashboard__heading-icon"><ChartIcon /></span>
                        <div>
                            <h1>Dashboard</h1>
                            <p>Welcome back{user?.name ? `, ${user.name}` : ''}! Here’s an overview of your organization.</p>
                        </div>
                    </div>
                    <div className="dashboard__updated">
                        <span className="dashboard__updated-pill">
                            <CalendarIcon /> Last Updated: {formatUpdated(lastUpdated)}
                        </span>
                        <button
                            type="button"
                            className={`dashboard__refresh${isRefreshing ? ' dashboard__refresh--spinning' : ''}`}
                            aria-label="Refresh"
                            onClick={refresh}
                            disabled={isRefreshing}
                        >
                            <RefreshIcon />
                        </button>
                    </div>
                </section>

                <section className="dashboard__stats">
                    {cards.map(({ key, label, data, Icon }) => (
                        <article key={key} className={`stat stat--${key}`}>
                            <span className="stat__icon"><Icon /></span>
                            <div>
                                <h2>{label}</h2>
                                <strong>{formatNumber(data.total)}</strong>
                                <Growth difference={data.growth.difference} />
                            </div>
                        </article>
                    ))}
                </section>

                <section className="dashboard__grid">
                    <article className="panel">
                        <h2 className="panel__title"><ChartIcon /> Organization Overview</h2>
                        <div className="overview">
                            <DonutChart
                                segments={segments.filter((segment) => !hiddenSegments.includes(segment.label))}
                                centerValue={formatNumber(stats.numberOfEmployees.total)} centerLabel="Employees" />
                            <ul className="overview__legend">
                                {segments.map((segment) => {
                                    const isHidden = hiddenSegments.includes(segment.label)
                                    return (
                                        <li key={segment.label}>
                                            <button
                                                type="button"
                                                className={`overview__item${isHidden ? ' overview__item--hidden' : ''}`}
                                                aria-pressed={isHidden}
                                                title={isHidden ? 'Click to show' : 'Click to hide'}
                                                onClick={() => toggleSegment(segment.label)}
                                            >
                                                <i style={{ background: segment.color }} />
                                                <span>{segment.label} ({formatNumber(segment.value)})</span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </article>

                    <article className="panel">
                        <h2 className="panel__title"><DepartmentsIcon /> Onboarding Workflow</h2>
                        <ol className="workflow">
                            {workflow.map(({ key, label, value, Icon }) => (
                                <li key={key} className={`workflow__step workflow__step--${key}`}>
                                    <span className="workflow__icon"><Icon /></span>
                                    <span className="workflow__label">{label}</span>
                                    <strong>{formatNumber(value)}</strong>
                                    <span className="workflow__arrow"><ArrowRightIcon /></span>
                                </li>
                            ))}
                        </ol>
                    </article>

                    <article className="panel">
                        <h2 className="panel__title"><BuildingIcon /> Top Companies</h2>
                        {sectionErrors.companies ? (
                            <p className="panel__note">{sectionErrors.companies}</p>
                        ) : visibleCompanies.length === 0 ? (
                            <p className="panel__note">No companies found</p>
                        ) : (
                            <ul className="top-companies">
                                {visibleCompanies.map((company, index) => (
                                    <li key={company.id}>
                                        <span className="top-companies__logo" style={{ background: COMPANY_COLORS[index % COMPANY_COLORS.length] }}>
                                            {company.name?.[0]?.toUpperCase()}
                                        </span>
                                        <span className="top-companies__name">{company.name}</span>
                                        <span className="top-companies__count" title="Employees">{company.numberOfEmployees}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>

                {canViewEmployees && (
                <section className="panel panel--table">
                    <div className="panel__head">
                        <h2 className="panel__title"><EmployeesIcon /> Recent Employees</h2>
                        <button type="button" className="panel__action" onClick={() => navigate('/employees')}>
                            View All Employees <ArrowRightIcon />
                        </button>
                    </div>

                    {sectionErrors.employees ? (
                        <p className="panel__note">{sectionErrors.employees}</p>
                    ) : (
                        <div className="recent">
                            <table className="recent__table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Employee Name</th>
                                        <th>Email Address</th>
                                        <th>Mobile Number</th>
                                        <th>Position</th>
                                        <th>Hired On</th>
                                        <th>Days Employed</th>
                                        <th>Company</th>
                                        <th>Department</th>
                                        {showActions && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={showActions ? 10 : 9} className="recent__empty">No employees found</td>
                                        </tr>
                                    ) : (
                                        visibleEmployees.map((employee, index) => (
                                            <tr key={employee.id}>
                                                <td>{index + 1}</td>
                                                <td className="recent__name"><div className="recent__cut" title={employee.name}>{employee.name}</div></td>
                                                <td><div className="recent__cut" title={employee.email}>{employee.email}</div></td>
                                                <td>{employee.mobile}</td>
                                                <td><div className="recent__cut" title={employee.designation}>{employee.designation}</div></td>
                                                <td>{formatDate(employee.hiredOn)}</td>
                                                <td>{formatDays(employee.daysEmployed)}</td>
                                                <td><div className="recent__cut" title={employee.department?.company?.name}>{employee.department?.company?.name}</div></td>
                                                <td><div className="recent__cut" title={employee.department?.name}>{employee.department?.name}</div></td>
                                                {showActions && (
                                                    <td>
                                                        <div className="recent__actions">
                                                            <button type="button" className="recent__btn recent__btn--view" aria-label="View" onClick={() => navigate(`/employee/${employee.id}`)}><EyeIcon /></button>
                                                            <button type="button" className="recent__btn recent__btn--edit" aria-label="Edit" onClick={() => navigate(`/update/employee/${employee.id}`)}><EditIcon /></button>
                                                            {isAdmin && <button type="button" className="recent__btn recent__btn--delete" aria-label="Delete" onClick={() => handleDelete(employee)}><TrashIcon /></button>}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                )}
            </div>
        </main>
    )
}

export default Dashboard
