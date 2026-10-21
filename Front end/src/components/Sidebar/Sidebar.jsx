import './Sidebar.scss'
import BrainWiseLogo from '../../assets/BrainWiseLogo'
import {
    DashboardIcon,
    BuildingIcon,
    DepartmentsIcon,
    EmployeesIcon,
    UserIcon,
    ReportsIcon,
    SettingsIcon,
} from '../../assets/icons'

export const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { path: '/companies', label: 'Companies', Icon: BuildingIcon },
    { path: '/departments', label: 'Departments', Icon: DepartmentsIcon },
    { path: '/employees', label: 'Employees', Icon: EmployeesIcon },
    { path: '/users', label: 'Users', Icon: UserIcon },
    { path: '/reports', label: 'Reports', Icon: ReportsIcon },
    { path: '/settings', label: 'Settings', Icon: SettingsIcon },
]

const Sidebar = ({ currentPath }) => {
    return (
        <aside className="sidebar">
            <a href="#/dashboard" className="sidebar__brand" aria-label="BrainWise">
                <BrainWiseLogo size={36} color="#134e4a" />
                <span className="sidebar__brand-name">BrainWise</span>
            </a>

            <nav className="sidebar__nav" aria-label="Main navigation">
                {NAV_ITEMS.map(({ path, label, Icon }) => {
                    const isActive = currentPath === path
                    return (
                        <a
                            key={path}
                            href={`#${path}`}
                            className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                            title={label}
                        >
                            <Icon />
                            <span className="sidebar__label">{label}</span>
                        </a>
                    )
                })}
            </nav>
        </aside>
    )
}

export default Sidebar
