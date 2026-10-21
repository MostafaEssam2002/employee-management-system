
import './Pagination.scss'

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 0) return null

    const getPages = () => {
        if (totalPages <= 7) {
            return Array.from(
                { length: totalPages },
                (_, i) => i + 1
            )
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages]
        }

        if (currentPage >= totalPages - 3) {
            return [
                1,
                '...',
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ]
        }

        return [
            1,
            '...',
            currentPage - 1,
            currentPage,
            currentPage + 1,
            '...',
            totalPages,
        ]
    }

    return (
        <nav className="pagination" aria-label="Pagination">
            <button
                type="button"
                className="pagination__btn"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Previous
            </button>

            {getPages().map((page, index) =>
                page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination__ellipsis">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        type="button"
                        className={`pagination__btn ${
                            page === currentPage
                                ? 'pagination__btn--active'
                                : ''
                        }`}
                        aria-current={page === currentPage ? 'page' : undefined}
                        disabled={page === currentPage}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                type="button"
                className="pagination__btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </nav>
    )
}

export default Pagination
