import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './EmployeeReport.scss'
import Status from '../components/Status/Status'
import Toast from '../components/Toast/Toast'
import useHiredEmployeesReport, { API_URL, buildReportQuery } from '../hooks/useHiredEmployeesReport'
import DownloadFile from '../utilis/DownloadFile'
import { getUser } from '../utilis/auth'
import {
    BellIcon,
    BuildingIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DepartmentsIcon,
    DocumentIcon,
    EmployeesIcon,
    FilterIcon,
    PrinterIcon,
    RefreshIcon,
    SearchIcon,
    SheetIcon,
} from '../assets/icons'

const RANGES = [
    { value: '1m', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '12m', label: 'Last 12 Months' },
    { value: 'all', label: 'All Time' },
]
const DEFAULT_FILTERS = { companyId: '', departmentId: '', range: '12m' }
const SEARCH_DELAY_MS = 350


const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'

const formatNumber = (n) => Number(n ?? 0).toLocaleString('en-US')
const formatBadge = (n) => (n > 99 ? '99+' : n)
const formatDate = (iso) => (iso ? iso.slice(0, 10) : '—')
const formatDays = (days) => (days === null || days === undefined ? '—' : formatNumber(days))

const formatUpdated = (iso) => {
    if (!iso) return '—'
    const date = new Date(iso)
    const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return `${day} - ${time}`
}

// Same windowing as the shared Pagination component: 1 2 3 4 5 … N
const getPages = (currentPage, totalPages) => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (currentPage >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

const ReportPagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null
    return (
        <nav className="report__pagination" aria-label="Pagination">
            <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
                <ChevronLeftIcon />
            </button>
            {getPages(currentPage, totalPages).map((page, index) =>
                page === '...' ? (
                    <span key={`ellipsis-${index}`} className="report__ellipsis">...</span>
                ) : (
                    <button
                        key={page}
                        type="button"
                        className={page === currentPage ? 'is-active' : undefined}
                        aria-current={page === currentPage ? 'page' : undefined}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                )
            )}
            <button type="button" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
                <ChevronRightIcon />
            </button>
        </nav>
    )
}

const EmployeeReport = () => {
    const navigate = useNavigate()
    const user = getUser()

    // `draft` is what the dropdowns show; it only becomes `applied` (and reloads the report) on "Apply Filters"
    const [draft, setDraft] = useState(DEFAULT_FILTERS)
    const [applied, setApplied] = useState({ ...DEFAULT_FILTERS, search: '', page: 1 })
    const [searchText, setSearchText] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const [toast, setToast] = useState(null)
    const closeToast = useCallback(() => setToast(null), [])
    const searchTimer = useRef(null)

    const { report, companies, pendingApplications, isFetching, error, refresh } = useHiredEmployeesReport(applied)

    useEffect(() => () => clearTimeout(searchTimer.current), [])

    // Departments of the chosen company, or every department (tagged with its company) when none is chosen
    const departmentOptions = useMemo(() => {
        if (draft.companyId) {
            const company = companies.find((c) => String(c.id) === draft.companyId)
            return (company?.departments ?? []).map((d) => ({ value: String(d.id), label: d.name }))
        }
        return companies
            .flatMap((c) => c.departments.map((d) => ({ value: String(d.id), label: `${d.name} (${c.name})` })))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [companies, draft.companyId])

    const handleCompanyChange = (e) =>
        setDraft((prev) => ({ ...prev, companyId: e.target.value, departmentId: '' }))

    const applyFilters = () => setApplied((prev) => ({ ...prev, ...draft, page: 1 }))

    const resetFilters = () => {
        setDraft(DEFAULT_FILTERS)
        setApplied((prev) => ({ ...prev, ...DEFAULT_FILTERS, page: 1 }))
    }

    // wait until typing pauses so every keystroke doesn't hit the API
    const handleSearch = (e) => {
        const value = e.target.value
        setSearchText(value)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(
            () => setApplied((prev) => ({ ...prev, search: value.trim(), page: 1 })),
            SEARCH_DELAY_MS
        )
    }

    const handlePageChange = (page) => setApplied((prev) => ({ ...prev, page }))

    const handleExport = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const query = buildReportQuery({ ...applied, page: null })
            await DownloadFile(`${API_URL}/report/hired-employees/export?${query}`, 'hired-employees-report.csv')
            setToast({ type: 'success', message: 'Report exported successfully' })
        } catch (err) {
            setToast({ type: 'error', message: `Failed to export the report: ${err.message}` })
        } finally {
            setIsExporting(false)
        }
    }

    if (!report && error) return <Status type="error">{error}</Status>
    if (!report) return <Status>Loading...</Status>

    const { data: rows, summary, pagination } = report
    const firstRow = pagination.total === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1
    const lastRow = pagination.total === 0 ? 0 : firstRow + rows.length - 1

    const cards = [
        { key: 'companies', label: 'Total Companies', value: formatNumber(summary.totalCompanies), Icon: BuildingIcon },
        { key: 'departments', label: 'Total Departments', value: formatNumber(summary.totalDepartments), Icon: DepartmentsIcon },
        { key: 'hired', label: 'Hired Employees', value: formatNumber(summary.hiredEmployees), Icon: EmployeesIcon },
        {
            key: 'days',
            label: 'Total Days Employed',
            value: formatNumber(summary.totalDaysEmployed),
            note: `(Avg: ${summary.averageYears.toFixed(2)} Years)`,
            Icon: CalendarIcon,
        },
    ]

    return (
        <main className="report">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <header className="report__topbar">
                <label className="report__search">
                    <SearchIcon />
                    <input
                        type="search"
                        placeholder="Search for companies, departments or employees…"
                        aria-label="Search the report"
                        value={searchText}
                        onChange={handleSearch}
                    />
                </label>
                <div className="report__user">
                    <button
                        type="button"
                        className="report__bell"
                        aria-label={`${pendingApplications} applications waiting for review`}
                        title="Applications waiting for review"
                        onClick={() => navigate('/employees')}
                    >
                        <BellIcon />
                        {pendingApplications > 0 && <span className="report__badge">{formatBadge(pendingApplications)}</span>}
                    </button>
                    <span className="report__avatar" title={user?.name}>{getInitials(user?.name)}</span>
                </div>
            </header>

            <div className="report__body">
                <section className="report__heading">
                    <div className="report__heading-text">
                        <span className="report__heading-icon"><DocumentIcon /></span>
                        <div>
                            <h1>Employee Report</h1>
                            <p>Detailed report of hired employees in your organization</p>
                        </div>
                    </div>
                    <div className="report__updated">
                        <span className="report__updated-pill">
                            <CalendarIcon /> Last Updated: {formatUpdated(report.generatedAt)}
                        </span>
                        <button
                            type="button"
                            className={`report__refresh${isFetching ? ' report__refresh--spinning' : ''}`}
                            aria-label="Refresh"
                            onClick={refresh}
                            disabled={isFetching}
                        >
                            <RefreshIcon />
                        </button>
                    </div>
                </section>

                <section className="report__filters" aria-label="Report filters">
                    <label className="report__field">
                        <span>Company</span>
                        <div className="report__select">
                            <BuildingIcon />
                            <select value={draft.companyId} onChange={handleCompanyChange}>
                                <option value="">All Companies</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>{company.name}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <label className="report__field">
                        <span>Department</span>
                        <div className="report__select">
                            <DepartmentsIcon />
                            <select
                                value={draft.departmentId}
                                onChange={(e) => setDraft((prev) => ({ ...prev, departmentId: e.target.value }))}
                            >
                                <option value="">All Departments</option>
                                {departmentOptions.map((department) => (
                                    <option key={department.value} value={department.value}>{department.label}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <label className="report__field">
                        <span>Hire Date Range</span>
                        <div className="report__select">
                            <CalendarIcon />
                            <select value={draft.range} onChange={(e) => setDraft((prev) => ({ ...prev, range: e.target.value }))}>
                                {RANGES.map((range) => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <div className="report__filter-actions">
                        <button type="button" className="report__btn report__btn--primary" onClick={applyFilters}>
                            <FilterIcon /> Apply Filters
                        </button>
                        <button type="button" className="report__btn report__btn--outline" onClick={resetFilters}>
                            <RefreshIcon /> Reset
                        </button>
                    </div>
                </section>

                <section className="report__stats" aria-label="Report summary">
                    {cards.map(({ key, label, value, note, Icon }) => (
                        <article key={key} className={`report-stat report-stat--${key}`}>
                            <span className="report-stat__icon"><Icon /></span>
                            <div>
                                <strong>{value}</strong>
                                <h2>{label}</h2>
                                {note && <p>{note}</p>}
                            </div>
                        </article>
                    ))}
                </section>

                <section className="report__panel">
                    <div className="report__panel-head">
                        <h2><EmployeesIcon /> Hired Employees Report</h2>
                        <div className="report__actions">
                            <button
                                type="button"
                                className="report__btn report__btn--green"
                                onClick={handleExport}
                                disabled={isExporting || pagination.total === 0}
                            >
                                <SheetIcon /> {isExporting ? 'Exporting…' : 'Export to Excel'}
                            </button>
                            <button type="button" className="report__btn report__btn--primary" onClick={() => window.print()}>
                                <PrinterIcon /> Print Report
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="report__error" role="alert">
                            {error}
                            <button type="button" onClick={refresh}>Retry</button>
                        </p>
                    )}

                    <div className={`report__table-wrap${isFetching ? ' report__table-wrap--loading' : ''}`} aria-busy={isFetching}>
                        <table className="report__table">
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
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="report__empty">No hired employees match these filters</td>
                                    </tr>
                                ) : (
                                    rows.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{firstRow + index}</td>
                                            <td className="report__name"><div className="report__cut" title={row.name}>{row.name}</div></td>
                                            <td><div className="report__cut" title={row.email}>{row.email}</div></td>
                                            <td>{row.mobile}</td>
                                            <td><div className="report__cut" title={row.designation}>{row.designation}</div></td>
                                            <td>{formatDate(row.hiredOn)}</td>
                                            <td>{formatDays(row.daysEmployed)}</td>
                                            <td><div className="report__cut" title={row.company}>{row.company}</div></td>
                                            <td><div className="report__cut" title={row.department}>{row.department}</div></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="report__footer">
                        <p>Showing {formatNumber(firstRow)} to {formatNumber(lastRow)} of {formatNumber(pagination.total)} employees</p>
                        <ReportPagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </footer>
                </section>
            </div>
        </main>
    )
}

export default EmployeeReport
