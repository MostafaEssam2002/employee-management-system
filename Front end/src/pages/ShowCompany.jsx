import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import './ShowCompany.scss'
import Status from "../components/Status/Status"
import FetchData from "../utilis/FetchData"

const formatNumber = (n) => Number(n ?? 0).toLocaleString('en-US')

const ShowCompany = () => {

    const { id } = useParams()
    const navigate = useNavigate()
    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let ignore = false // يتجاهل رد قديم لو الـ id اتغيّر أو الصفحة اتقفلت
        async function fetchCompany() {
            setIsLoading(true)
            setError('')
            try {
                const response = await FetchData(`http://localhost:3000/company/${id}`)
                if (!ignore) setCompany(response.data)
            } catch (err) {
                if (!ignore) setError(err.message || 'Failed to load company')
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        fetchCompany()
        return () => { ignore = true }
    }, [id])

    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>
    if (!company) return <Status type="error">Company not found</Status>

    const departments = company.departments ?? []

    return (
        <main className="company">
            <button type="button" className="company__back" onClick={() => navigate('/companies')}>
                ← Back to companies
            </button>

            <header className="company__header">
                <h1 className="company__title">{company.name}</h1>
                <p className="company__subtitle">Company overview and its departments.</p>
            </header>

            <section className="company__stats">
                <div className="company__stat">
                    <span className="company__stat-value">{formatNumber(company.numberOfDepartments)}</span>
                    <span className="company__stat-label">Departments</span>
                </div>
                <div className="company__stat">
                    <span className="company__stat-value">{formatNumber(company.numberOfEmployees)}</span>
                    <span className="company__stat-label">Employees</span>
                </div>
            </section>

            <h2 className="company__section-title">Departments</h2>

            {departments.length === 0 ? (
                <p className="company__empty">This company has no departments yet.</p>
            ) : (
                <ul className="company__grid">
                    {departments.map((dep) => (
                        <li key={dep.id} className="dep-card" onClick={()=>navigate(`/department/${dep.id}`)}>

                            <span className="dep-card__id">#{dep.id}</span>
                            <h3 className="dep-card__name">{dep.name}</h3>
                            <div className="dep-card__footer" >
                                <span className="dep-card__count">{formatNumber(dep._count?.employees)}</span>
                                <span className="dep-card__label">Employees</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}

export default ShowCompany