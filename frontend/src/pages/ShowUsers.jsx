
import { useMemo, useState } from 'react'
import './ShowDepartments.scss'
import Status from '../components/Status/Status'
import Pagination from '../components/Pagination/Pagination'
import BrainWiseLogo from '../assets/BrainWiseLogo'
import {  SearchIcon } from '../assets/icons'
import useTableData from '../hooks/useTableData'
import DataTable from '../components/DataTable/DataTable'
import { useNavigate } from 'react-router-dom';
const handleEdit = (row) => console.log('edit', row)
const handleView = (row) => console.log('view', row)
const handleDelete = (row) => console.log('delete', row)
const handleAdd = (row) => console.log('add', row)
const columns = [
    { key: 'name', label: 'User Name', className: 'table__name' },
    { key: 'email', label: 'User Email', className: 'table__email' },
    { key: 'role', label: 'User Role', className: 'table__role' },
]
const ShowUsers = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState('')
    const { data, totalPages, isLoading, error } = useTableData('user', currentPage)
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
                <button type="button" onClick={()=>navigate("/add-user")} className="departments__create">
                    Create New User
                </button>
            </header>

            <section className="departments__card">
                <label className="departments__search">
                    <SearchIcon />
                    <input type="search" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)}/>
                </label>
                <DataTable columns={columns} data={filtered} emptyText="No departments found" onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onAdd={handleAdd}/>
            </section>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}/>
            <div className="departments__watermark" aria-hidden="true">
                <BrainWiseLogo size={260} color="#cfe9df" />
            </div>
        </main>
    )
}
export default ShowUsers
