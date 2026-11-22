import { useEffect, useState } from 'react'

const getPath = () => window.location.hash.replace(/^#/, '') || '/'

// tiny hash router: returns the current path ("/departments", "/login", ...)
const useHashRoute = () => {
    const [path, setPath] = useState(getPath)

    useEffect(() => {
        const onHash = () => setPath(getPath())
        window.addEventListener('hashchange', onHash)
        return () => window.removeEventListener('hashchange', onHash)
    }, [])

    return path
}

export default useHashRoute
