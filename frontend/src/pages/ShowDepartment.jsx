import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import './ShowDepartment.scss'
import FetchData from "../utilis/FetchData"
import Status from "../components/Status/Status"
import Pagination from "../components/Pagination/Pagination"
const formatNumber = (n) => Number(n ?? 0).toLocaleString('en-US')
const getInitial = (name) => (name?.trim()?.[0] ?? '?').toUpperCase()
const ShowDepartment = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [department, setDepartment] = useState(null)
    const [pagination, setPagination] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // لو القسم اتغيّر نرجع لأول صفحة
    useEffect(() => {
        function data(){
            setCurrentPage(1)
            setDepartment(null)
            setPagination(null)
        }
        data()
    }, [id])

    useEffect(() => {
        let ignore = false // يتجاهل رد قديم لو الـ id اتغيّر أو الصفحة اتقفلت
        async function fetchDepartment() {
            setIsLoading(true)
            setError('')
            try {
                const response = await FetchData(
                    `http://localhost:3000/department/${id}?page=${currentPage}`
                )
                if (!ignore) {
                    setDepartment(response?.data ?? response)
                    setPagination(response?.pagination ?? null)
                }
            } catch (err) {
                if (!ignore) setError(err.message || 'Failed to load department')
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        fetchDepartment()
        return () => { ignore = true }
    }, [id, currentPage])

    // Loading الكامل بس في أول تحميل، وعند تغيير الصفحة نسيب الجدول ظاهر
    if (isLoading && !department) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>
    if (!department) return <Status type="error">Department not found</Status>

    const employees = department.employees ?? []
    const total = pagination?.total ?? department.numberOfEmployees ?? 0
    const limit = pagination?.limit ?? employees.length
    const from = employees.length ? (currentPage - 1) * limit + 1 : 0
    const to = employees.length ? from + employees.length - 1 : 0

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <main className="department">
            <button type="button" className="department__back" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <header className="department__header">
                <div>
                    <h1 className="department__title">{department.name}</h1>
                    <p className="department__subtitle">
                        Department in <strong>{department.company}</strong>
                    </p>
                </div>
                <span className="department__id">#{department.id}</span>
            </header>

            <section className="department__stats">
                <div className="department__stat">
                    <span className="department__stat-value">{formatNumber(department.numberOfEmployees)}</span>
                    <span className="department__stat-label">Total employees</span>
                </div>
                <div className="department__stat department__stat--light">
                    <span className="department__stat-value">{department.company}</span>
                    <span className="department__stat-label">Company</span>
                </div>
            </section>

            <section className="department__card">
                <div className="department__card-header">
                    <h2 className="department__section-title">Employees</h2>
                    <span className="department__hint">
                        Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
                    </span>
                </div>

                {employees.length === 0 ? (
                    <p className="department__empty">No employees in this department yet.</p>
                ) : (
                    <div
                        className="department__table-wrap"
                        style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity .2s' }}
                    >
                        <table className="department__table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Employee</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.id}  onClick={()=>navigate(`/employee/${emp.id}`)}>
                                        <td className="department__muted">{emp.id}</td>
                                        <td>
                                            <div className="department__person">
                                                <span className="department__avatar">{getInitial(emp.name)}</span>
                                                <span className="department__person-name">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <a className="department__email" href={`mailto:${emp.email}`}>
                                                {emp.email}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    totalPages={pagination?.totalPages ?? 0}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </section>
        </main>
    )
}

export default ShowDepartment