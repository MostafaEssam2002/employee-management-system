import './DataTable.scss'
import { EditIcon, EyeIcon, TrashIcon, PlusIcon } from '../../assets/icons'

const formatDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().slice(0, 10)
}

// أنواع جاهزة للخلايا: type: 'date' | 'count' | 'pill'
const cellTypes = {
    date: (value) => formatDate(value),
    count: (value) => <span className="table__count">{value}</span>,
    pill: (value) =>
        value ? (
            <span className={`table__pill table__pill--${String(value).toLowerCase()}`}>{value}</span>
        ) : '—',
}

const renderCell = (col, row) => {
    if (col.render) return col.render(row)               // أقصى مرونة
    const value = row[col.key]
    if (col.type && cellTypes[col.type]) return cellTypes[col.type](value)
    return value ?? '—'
}

const DataTable = ({
    columns,
    data,
    onEdit,
    onView,
    onDelete,
    onAdd,
    emptyText = 'No data found',
}) => {
    const hasActions = Boolean(onEdit || onView || onDelete || onAdd)

    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                        {hasActions && <th className="table__actions-head">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            {columns.map((col) => (
                                <td key={col.key} className={col.className}>
                                    {renderCell(col, row)}
                                </td>
                            ))}
                            {hasActions && (
                                <td>
                                    <div className="table__actions">
                                        {onEdit && <button type="button" aria-label="Edit" onClick={() => onEdit(row)}><EditIcon /></button>}
                                        {onView && <button type="button" aria-label="View" onClick={() => onView(row)}><EyeIcon /></button>}
                                        {onDelete && <button type="button" aria-label="Delete" className="table__actions-muted" onClick={() => onDelete(row)}><TrashIcon /></button>}
                                        {onAdd && <button type="button" aria-label="Add" onClick={() => onAdd(row)}><PlusIcon /></button>}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + (hasActions ? 1 : 0)} className="table__empty">
                                {emptyText}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default DataTable