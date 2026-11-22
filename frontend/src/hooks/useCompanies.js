import { useCallback, useEffect, useState } from 'react'
import FetchData from './../utilis/FetchData';

const API_URL = 'http://localhost:3000'

// Loads every company once (the API is paginated, so the remaining pages are
// requested in parallel after page 1) and keeps them sorted by name.
const useCompanies = () => {
    const [state, setState] = useState({ companies: [], isLoading: true, error: '' })
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, isLoading: true, error: '' }))
        setAttempt((prev) => prev + 1)
    }, [])

    useEffect(() => {
        let ignore = false

        async function load() {
            try {
                const first = await FetchData(`${API_URL}/company?page=1`)
                const totalPages = first.pagination?.totalPages ?? 1
                const rest = await Promise.all(
                    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
                        FetchData(`${API_URL}/company?page=${i + 2}`)
                    )
                )
                if (ignore) return

                const companies = [first, ...rest]
                    .flatMap((res) => res.data)
                    .sort((a, b) => a.name.localeCompare(b.name))
                setState({ companies, isLoading: false, error: '' })
            } catch (err) {
                if (!ignore) setState({ companies: [], isLoading: false, error: err.message })
            }
        }

        load()
        return () => {
            ignore = true
        }
    }, [attempt])

    return { ...state, reload }
}

export default useCompanies