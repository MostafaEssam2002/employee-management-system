import { useCallback, useEffect, useState } from 'react'
import FetchData from '../utilis/FetchData'

const API_URL = 'http://localhost:3000'
const TOP_COMPANIES_COUNT = 3
const RECENT_EMPLOYEES_COUNT = 3

// Every page of /company, so the ranking covers all companies and not just page 1
const fetchTopCompanies = async () => {
    const first = await FetchData(`${API_URL}/company?page=1`)
    const totalPages = first.pagination?.totalPages ?? 1
    const rest = await Promise.all(
        Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
            FetchData(`${API_URL}/company?page=${i + 2}`)
        )
    )
    return [first, ...rest]
        .flatMap((res) => res.data)
        .sort((a, b) => b.numberOfEmployees - a.numberOfEmployees)
        .slice(0, TOP_COMPANIES_COUNT)
}

// /employee has no sorting, so the newest rows sit on the last page(s)
const fetchRecentEmployees = async () => {
    const first = await FetchData(`${API_URL}/employee?page=1`)
    const totalPages = first.pagination?.totalPages ?? 1
    let rows = first.data

    if (totalPages > 1) {
        const last = await FetchData(`${API_URL}/employee?page=${totalPages}`)
        rows = last.data
        if (rows.length < RECENT_EMPLOYEES_COUNT) {
            const previous = await FetchData(`${API_URL}/employee?page=${totalPages - 1}`)
            rows = [...previous.data, ...rows]
        }
    }
    return rows.slice(-RECENT_EMPLOYEES_COUNT).reverse()
}

// Loads everything the dashboard needs. The stats come from GET /dashboard (page-level error if
// it fails); top companies and recent employees fail on their own so one section can't blank the page.
// includeEmployees=false for roles that can't read /employee (Employee role) so no request is sent
const useDashboard = ({ includeEmployees = true } = {}) => {
    const [stats, setStats] = useState(null)
    const [topCompanies, setTopCompanies] = useState([])
    const [recentEmployees, setRecentEmployees] = useState([])
    const [sectionErrors, setSectionErrors] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), [])

    useEffect(() => {
        let ignore = false

        async function load() {
            if (refreshKey === 0) setIsLoading(true)
            else setIsRefreshing(true)
            setError(null)

            const [statsResult, companiesResult, employeesResult] = await Promise.allSettled([
                FetchData(`${API_URL}/dashboard`),
                fetchTopCompanies(),
                includeEmployees ? fetchRecentEmployees() : Promise.resolve([]),
            ])
            if (ignore) return

            if (statsResult.status === 'rejected') {
                setError(statsResult.reason?.message || 'Failed to load the dashboard')
            } else {
                setStats(statsResult.value)
                setLastUpdated(new Date())
            }

            setTopCompanies(companiesResult.status === 'fulfilled' ? companiesResult.value : [])
            setRecentEmployees(employeesResult.status === 'fulfilled' ? employeesResult.value : [])
            setSectionErrors({
                companies: companiesResult.status === 'rejected' ? companiesResult.reason?.message : null,
                employees: employeesResult.status === 'rejected' ? employeesResult.reason?.message : null,
            })

            setIsLoading(false)
            setIsRefreshing(false)
        }

        load()
        return () => {
            ignore = true
        }
    }, [refreshKey, includeEmployees])

    return { stats, topCompanies, recentEmployees, sectionErrors, isLoading, isRefreshing, error, lastUpdated, refresh }
}

export default useDashboard
