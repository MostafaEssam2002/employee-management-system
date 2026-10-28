import { useEffect, useState, useCallback } from 'react'
import FetchData from './../utilis/FetchData'

const API_URL = 'http://localhost:3000'

const useTableData = (table, currentPage) => {
    const [data, setData] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)

    // refetch من غير ما يظهر Loading (background refresh)
    const refetch = useCallback(() => {
        setRefreshKey((prev) => prev + 1)
    }, [])

    // يشيل الصف من الـ state فورًا
    const removeRow = useCallback((id) => {
        setData((prev) => prev.filter((row) => row.id !== id))
    }, [])
    const restoreRow = useCallback((row, index) => {
            setData((prev) => {
                if (prev.some((r) => r.id === row.id)) return prev
                const next = [...prev]
                next.splice(index, 0, row)
                return next
            })
        }, [])
    useEffect(() => {
        let ignore = false
        // الـ loading يظهر بس لو مفيش داتا لسه (أول تحميل أو تغيير صفحة)
        const isBackgroundRefresh = refreshKey > 0

        async function getData() {
            try {
                if (!isBackgroundRefresh) setIsLoading(true)
                setError(null)

                const res = await FetchData(
                    `${API_URL}/${table}?page=${currentPage}`
                )

                if (ignore) return

                if (res) {
                    setData(res.data)
                    setTotalPages(res.pagination.totalPages)
                } else {
                    setError('Failed to fetch data')
                }
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }

        getData()

        return () => {
            ignore = true
        }
    }, [table, currentPage, refreshKey])

    return { data, totalPages, isLoading, error, refetch, removeRow,restoreRow }
}

export default useTableData