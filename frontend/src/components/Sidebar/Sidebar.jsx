
import './Sidebar.scss'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrainWiseLogo from '../../assets/BrainWiseLogo'

import {
    DashboardIcon,
    BuildingIcon,
    DepartmentsIcon,
    EmployeesIcon,
    UserIcon,
    ReportsIcon,
    SettingsIcon,
    PlusIcon,
    LogoutIcon,
} from '../../assets/icons'
import { logout } from '../../utilis/session'
import { ADMIN_AND_MANAGER, ADMIN_ONLY, ALL_ROLES, getRole, hasRole } from '../../utilis/auth'

const NAV_ITEMS = [
    // { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon, roles: ALL_ROLES },
    { path: '/companies', label: 'Companies', Icon: BuildingIcon, roles: ADMIN_AND_MANAGER },
    { path: '/departments', label: 'Departments', Icon: DepartmentsIcon, roles: ALL_ROLES },
    { path: '/employees', label: 'Employees', Icon: EmployeesIcon, roles: ADMIN_AND_MANAGER },
    { path: '/users', label: 'Users', Icon: UserIcon, roles: ADMIN_ONLY },
    { path: '/reports', label: 'Reports', Icon: ReportsIcon, roles: ADMIN_AND_MANAGER },
    { path: '/settings', label: 'Settings', Icon: SettingsIcon, roles: ALL_ROLES },
    {
        path: '/add-company',
        label: 'Add New',
        Icon: PlusIcon,
        matchPrefix: '/add-',
        roles: ADMIN_AND_MANAGER,
        children: [
            { path: '/add-company', label: 'Company', roles: ADMIN_ONLY },
            { path: '/add-department', label: 'Department', roles: ADMIN_AND_MANAGER },
            { path: '/add-employee', label: 'Employee', roles: ADMIN_AND_MANAGER },
            { path: '/add-user', label: 'User', roles: ADMIN_ONLY },
        ],
    },
]

const Sidebar = () => {
    const { pathname: currentPath } = useLocation()
    const navigate = useNavigate()
    const handleLogout = async () => {
        await logout() // clears the server cookie and the local session
        navigate('/login', { replace: true })
    }
    const role = getRole()

    // Only show what this role can actually open; the "Add New" group links to its first allowed child
    const navItems = NAV_ITEMS
        .filter((item) => hasRole(item.roles, role))
        .map((item) => {
            if (!item.children) return item
            const children = item.children.filter((child) => hasRole(child.roles, role))
            return { ...item, children, path: children[0]?.path ?? item.path }
        })

    return (
        <aside className="sidebar">
            <Link
                to="/dashboard"
                className="sidebar__brand"
                aria-label="BrainWise"
            >
                <BrainWiseLogo size={36} color="#134e4a" />
                <span className="sidebar__brand-name">BrainWise</span>
            </Link>

            <nav className="sidebar__nav" aria-label="Main navigation">
                {navItems.map(({ path, label, Icon, matchPrefix, children }) => {
                    const isActive = matchPrefix
                        ? currentPath.startsWith(matchPrefix)
                        : currentPath === path

                    return (
                        <div key={label} className="sidebar__group">
                            <Link
                                to={path}
                                className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                                aria-current={
                                    isActive && !children ? 'page' : undefined
                                }
                                title={label}
                            >
                                <Icon />
                                <span className="sidebar__label">
                                    {label}
                                </span>
                            </Link>

                            {children && isActive && (
                                <div className="sidebar__sub">
                                    {children.map((child) => {
                                        const isChildActive =
                                            currentPath === child.path

                                        return (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`sidebar__sublink${isChildActive ? ' sidebar__sublink--active' : ''}`}
                                                aria-current={
                                                    isChildActive
                                                        ? 'page'
                                                        : undefined
                                                }
                                            >
                                                {child.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            <div className="sidebar__footer">
                <button type="button" className="sidebar__link sidebar__logout" onClick={handleLogout} title="Log out">
                    <LogoutIcon />
                    <span className="sidebar__label">Log out</span>
                </button>
                <span className="sidebar__version">
                    Version 1.2.0
                </span>
            </div>
        </aside>
    )
}

export default Sidebar
