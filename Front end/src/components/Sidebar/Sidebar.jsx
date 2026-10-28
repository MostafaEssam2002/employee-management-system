
import './Sidebar.scss'
import { Link, useLocation } from 'react-router-dom'
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
} from '../../assets/icons'

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { path: '/companies', label: 'Companies', Icon: BuildingIcon },
    { path: '/departments', label: 'Departments', Icon: DepartmentsIcon },
    { path: '/employees', label: 'Employees', Icon: EmployeesIcon },
    { path: '/users', label: 'Users', Icon: UserIcon },
    { path: '/reports', label: 'Reports', Icon: ReportsIcon },
    { path: '/settings', label: 'Settings', Icon: SettingsIcon },
    {
        path: '/add-company',
        label: 'Add New',
        Icon: PlusIcon,
        matchPrefix: '/add-',
        children: [
            { path: '/add-company', label: 'Company' },
            { path: '/add-department', label: 'Department' },
            { path: '/add-employee', label: 'Employee' },
            { path: '/add-user', label: 'User' },
        ],
    },
]

const Sidebar = () => {
    const { pathname: currentPath } = useLocation()

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
                {NAV_ITEMS.map(({ path, label, Icon, matchPrefix, children }) => {
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

            <span className="sidebar__version">
                Version 1.2.0
            </span>
        </aside>
    )
}

export default Sidebar
