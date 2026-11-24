import './Layout.scss'
import Sidebar from '../Sidebar/Sidebar'
import useSessionExpiry from '../../hooks/useSessionExpiry'

// Wraps every dashboard page: fixed sidebar on the left, page content on the right
const Layout = ({ currentPath, children }) => {
    useSessionExpiry()
    return (
        <div className="app-layout">
            <Sidebar currentPath={currentPath} />
            <div className="app-layout__content">{children}</div>
        </div>
    )
}

export default Layout
