import { useCallback, useEffect, useState } from 'react'
import FetchData from '../utilis/FetchData'

export const API_URL = 'http://localhost:3000'

// Only the filters that are set go into the query string
export const buildReportQuery = ({ companyId, departmentId, range, search, page }) => {
    const params = new URLSearchParams()
    if (companyId) params.set('companyId', companyId)
    if (departmentId) params.set('departmentId', departmentId)
    if (range) params.set('range', range)
    if (search) params.set('search', search)
    if (page) params.set('page', page)
    return params.toString()
}

// Loads the hired-employees report for the applied filters, plus the dropdown options (once)
// and the number of applications waiting for review (for the bell badge).
// A failed bell badge or filter list never blanks the report.
const useHiredEmployeesReport = (applied) => {
    const [report, setReport] = useState(null)
    const [error, setError] = useState(null)
    const [isFetching, setIsFetching] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)
    const [companies, setCompanies] = useState([])
    const [pendingApplications, setPendingApplications] = useState(0)

    const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), [])

    useEffect(() => {
        let ignore = false

        async function loadExtras() {
            const [filtersResult, dashboardResult] = await Promise.allSettled([
                FetchData(`${API_URL}/report/filters`),
                FetchData(`${API_URL}/dashboard`),
            ])
            if (ignore) return
            if (filtersResult.status === 'fulfilled') setCompanies(filtersResult.value.data.companies)
            if (dashboardResult.status === 'fulfilled') {
                setPendingApplications(dashboardResult.value.numberOfApplicationRecievedEmployees ?? 0)
            }
        }

        loadExtras()
        return () => {
            ignore = true
        }
    }, [])

    const query = buildReportQuery(applied)

    useEffect(() => {
        let ignore = false

        async function load() {
            try {
                setIsFetching(true)
                setError(null)
                const res = await FetchData(`${API_URL}/report/hired-employees?${query}`)
                if (ignore) return
                setReport(res)
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsFetching(false)
            }
        }

        load()
        return () => {
            ignore = true
        }
    }, [query, refreshKey])

    return { report, companies, pendingApplications, isFetching, error, refresh }
}

export default useHiredEmployeesReport
