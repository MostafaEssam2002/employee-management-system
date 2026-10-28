import { useMemo, useState } from 'react'
import './ShowDepartments.scss'
import Status from '../components/Status/Status'
import Pagination from '../components/Pagination/Pagination'
import BrainWiseLogo from '../assets/BrainWiseLogo'
import { LockIcon, SearchIcon } from '../assets/icons'
import useTableData from '../hooks/useTableData'
import DataTable from '../components/DataTable/DataTable'
import DeleteData from '../utilis/DeleteData'
import { useNavigate } from 'react-router-dom'
const handleAdd = (row) => console.log('add', row)
const columns = [
    { key: 'name', label: 'Department Name', className: 'table__name' },
    { key: 'numberOfEmployees', label: <>Number of<br />Employees</>, type: 'count' },
    { key: 'managersStatus', label: 'Managers', type: 'pill' },
    {
        key: 'company',
        label: <>Company<br /><span className="table__locked">(Locked) <LockIcon /></span></>,
    },
    { key: 'createdAt', label: 'Created On', type: 'date' },
]
const ShowDepartments = () => {
    const navigate= useNavigate();
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState('')
    const [deletingIds, setDeletingIds] = useState(() => new Set())
    const { data, totalPages, isLoading, error, refetch, removeRow } = useTableData("department", currentPage)
    const handleDelete = async (row) => {
        if (deletingIds.has(row.id)) return // امنع الضغط المتكرر
        // الصف يفضل ظاهر وباهت لحد ما الـ response يرجع
        setDeletingIds((prev) => new Set(prev).add(row.id))
        try {
            const response = await DeleteData(`http://localhost:3000/department/${row.id}`)
            removeRow(row.id) // يتشال خالص بعد نجاح الحذف بس
            refetch()         // مزامنة هادية في الخلفية
            return response
        } catch (error) {
            console.error('Failed to delete department:', error.message)
            // الصف هيرجع طبيعي
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev)
                next.delete(row.id)
                return next
            })
        }
    }
    const handleView = (row) => navigate(`/department/${row.id}`);
    const handleEdit = (row) => navigate(`/update/department/${row.id}`)

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return q ? data.filter((ele) => ele.name?.toLowerCase().includes(q)) : data
    }, [data, search])
    if (isLoading) return <Status>Loading...</Status>
    if (error) return <Status type="error">{error}</Status>
    const companyName = data[0]?.company ?? ''
    return (
        <main className="departments">
            <header className="departments__header">
                <div>
                    <h1 className="departments__title">
                        Departments{companyName && `: ${companyName}`}
                    </h1>
                    <p className="departments__subtitle">
                        View and manage all departments{companyName && ` for ${companyName}`}.
                    </p>
                </div>
                <button type="button" className="departments__create" onClick={()=>{navigate("/add-department")}}>
                    Create New Department
                </button>
            </header>
            <section className="departments__card">
                <label className="departments__search">
                    <SearchIcon />
                    <input type="search" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)}/>
                </label>
                <DataTable columns={columns} data={filtered} deletingIds={deletingIds} emptyText="No departments found" onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onAdd={handleAdd}/>
            </section>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}/>
            <div className="departments__watermark" aria-hidden="true">
                <BrainWiseLogo size={260} color="#cfe9df" />
            </div>
        </main>
    )
}
export default ShowDepartments