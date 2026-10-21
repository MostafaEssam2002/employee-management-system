// src/hooks/useTableData.js
import { useEffect, useState } from 'react'
import FetchData from './../utilis/FetchData';

const API_URL = 'http://localhost:3000'

const useTableData = (table, currentPage) => {
    const [data, setData] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let ignore = false   // يتجاهل أي رد قديم

        async function getData() {
            try {
                setIsLoading(true)
                setError(null)
                const res = await FetchData(`${API_URL}/${table}?page=${currentPage}`)
                if (ignore) return
                if (res) {
                    setData(res.data)
                    setTotalPages(res.pagination.totalPages)
                } else {
                    setError('failed to fetch data')
                }
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }

        getData()
        return () => { ignore = true }
    }, [table, currentPage])

    return { data, totalPages, isLoading, error }
}

export default useTableData