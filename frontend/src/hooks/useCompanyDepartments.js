import { useCallback, useEffect, useState } from 'react'
import FetchData from '../utilis/FetchData'

const API_URL = 'http://localhost:3000'

// Departments that belong to ONE company (GET /company/:id already returns them),
// so the employee form can never offer a department from another company.
const useCompanyDepartments = (companyId) => {
    // `key` is the company this data was loaded for; while it differs from the
    // current companyId we are loading (and must not show the old list).
    const [state, setState] = useState({ key: null, departments: [], error: '' })
    const [attempt, setAttempt] = useState(0)
    const currentKey = companyId === '' || companyId == null ? null : String(companyId)

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, key: null }))
        setAttempt((prev) => prev + 1)
    }, [])

    useEffect(() => {
        if (currentKey === null) return
        let ignore = false

        async function load() {
            try {
                const res = await FetchData(`${API_URL}/company/${currentKey}`)
                if (ignore) return
                const departments = [...(res.data.departments ?? [])].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
                setState({ key: currentKey, departments, error: '' })
            } catch (err) {
                if (!ignore) setState({ key: currentKey, departments: [], error: err.message })
            }
        }

        load()
        return () => {
            ignore = true
        }
    }, [currentKey, attempt])

    const isReady = currentKey !== null && state.key === currentKey

    return {
        departments: isReady ? state.departments : [],
        isLoading: currentKey !== null && !isReady,
        error: isReady ? state.error : '',
        reload,
    }
}

export default useCompanyDepartments