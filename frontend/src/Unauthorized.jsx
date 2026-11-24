import { Link } from 'react-router-dom'

const Unauthorized = () => {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1>Access denied</h1>
      <p>Your role doesn't have permission to open this page.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  )
}

export default Unauthorized
