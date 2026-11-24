import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ShowDepartments.scss'
import Status from '../components/Status/Status'
import Toast from '../components/Toast/Toast'
import Pagination from '../components/Pagination/Pagination'
import BrainWiseLogo from '../assets/BrainWiseLogo'
import { SearchIcon } from '../assets/icons'
import useTableData from '../hooks/useTableData'
import DataTable from '../components/DataTable/DataTable'
import DeleteData from '../utilis/DeleteData'
import { getUser } from '../utilis/auth'

const API_URL = 'http://localhost:3000'
const columns = [
    { key: 'name', label: 'User Name', className: 'table__name' },
    { key: 'email', label: 'User Email', className: 'table__email' },
    { key: 'role', label: 'User Role', className: 'table__role' },
]

const ShowUsers = () => {
    const navigate = useNavigate()
    const currentUser = getUser()
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState('')
    const [deletingIds, setDeletingIds] = useState(() => new Set())
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }
    const closeToast = useCallback(() => setToast(null), [])
    const { data, totalPages, isLoading, error, refetch, removeRow } = useTableData('user', currentPage)

    const handleView = (row) => navigate(`/user/${row.id}`)
    const handleEdit = (row) => navigate(`/update/user/${row.id}`)

    const handleDelete = async (row) => {
        if (deletingIds.has(row.id)) return // ignore repeated clicks
        // the API refuses this too; checking here just gives instant feedback
        if (row.id === currentUser?.id) {
            setToast({ type: 'error', message: 'You cannot delete your own account' })
            return
        }
        if (!window.confirm(`Delete user "${row.name}"? This cannot be undone.`)) return

        setDeletingIds((prev) => new Set(prev).add(row.id))
        try {
            await DeleteData(`${API_URL}/user/${row.id}`)
            removeRow(row.id) // only removed once the API confirmed
            // deleted the last row of a later page: step back instead of showing an empty page
            if (data.length === 1 && currentPage > 1) setCurrentPage((page) => page - 1)
            else refetch()
            setToast({ type: 'success', message: `User "${row.name}" deleted successfully` })
        } catch (err) {
            setToast({ type: 'error', message: `Failed to delete user: ${err.message}` })
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev)
                next.delete(row.id)
                return next
            })
        }
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return q
            ? data.filter((ele) =>
                  [ele.name, ele.email, ele.role].some((value) => value?.toLowerCase().includes(q))
              )
            : data
    }, [data, search])

    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>

    return (
        <main className="departments">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />
            <header className="departments__header">
                <div>
                    <h1 className="departments__title">Users</h1>
                    <p className="departments__subtitle">View and manage all user accounts.</p>
                </div>
                <button type="button" onClick={() => navigate('/add-user')} className="departments__create">
                    Create New User
                </button>
            </header>

            <section className="departments__card">
                <label className="departments__search">
                    <SearchIcon />
                    <input type="search" placeholder="Search by name, email or role" value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
                <DataTable
                    columns={columns}
                    data={filtered}
                    deletingIds={deletingIds}
                    emptyText="No users found"
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={handleDelete}
                />
            </section>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
            <div className="departments__watermark" aria-hidden="true">
                <BrainWiseLogo size={260} color="#cfe9df" />
            </div>
        </main>
    )
}
export default ShowUsers
