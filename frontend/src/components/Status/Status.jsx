import './Status.scss'

const Status = ({ type = 'loading', children }) => {
    return <p className={`status status--${type}`}>{children}</p>
}

export default Status