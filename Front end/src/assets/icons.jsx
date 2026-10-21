const base = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
}

export const UserIcon = () => (
    <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" /></svg>
)
export const MailIcon = () => (
    <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
)
export const LockIcon = () => (
    <svg {...base}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const PhoneIcon = () => (
    <svg {...base}><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
)
export const BadgeIcon = () => (
    <svg {...base}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M9 6V4h6v2" /><circle cx="9" cy="13" r="2" /><path d="M14 12h4M14 15h3" /></svg>
)
export const PinIcon = () => (
    <svg {...base}><path d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12Z" /><circle cx="12" cy="9" r="2.500" /></svg>
)
export const BuildingIcon = () => (
    <svg {...base}><path d="M5 21V4h9v17M14 9h5v12M3 21h18" /><path d="M8 8h3M8 12h3M8 16h3" /></svg>
)
export const CalendarIcon = () => (
    <svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)
export const EyeIcon = () => (
    <svg {...base}><path d="M2.500 12C4.500 8 8 6 12 6s7.500 2 9.500 6c-2 4-5.500 6-9.500 6S4.500 16 2.500 12Z" /><circle cx="12" cy="12" r="2.800" /></svg>
)
export const EyeOffIcon = () => (
    <svg {...base}><path d="M2.500 12C4.500 8 8 6 12 6s7.500 2 9.500 6c-2 4-5.500 6-9.500 6S4.500 16 2.500 12Z" /><circle cx="12" cy="12" r="2.800" /><path d="M4 20 20 4" /></svg>
)
export const SearchIcon = () => (
    <svg {...base}><circle cx="11" cy="11" r="6.500" /><path d="m20 20-4.200-4.200" /></svg>
)
export const EditIcon = () => (
    <svg {...base}><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" /><path d="m18.500 3.500 2 2L12 14l-3 1 1-3 8.500-8.500Z" /></svg>
)
export const TrashIcon = () => (
    <svg {...base}><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
)
export const PlusIcon = () => (
    <svg {...base}><path d="M12 5v14M5 12h14" /></svg>
)

export const DashboardIcon = () => (
    <svg {...base}><circle cx="12" cy="13" r="8" /><path d="m12 13 4-4M12 5v1.500M5.500 13H4M20 13h-1.500" /></svg>
)
export const DepartmentsIcon = () => (
    <svg {...base}><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-4h12v4" /></svg>
)
export const EmployeesIcon = () => (
    <svg {...base}><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20c0-3.500 3-5.500 6.500-5.500s6.500 2 6.500 5.500" /><path d="M16 4.500a3.500 3.500 0 0 1 0 7M18 14.800c2 .7 3.500 2.300 3.500 5.200" /></svg>
)
export const ReportsIcon = () => (
    <svg {...base}><path d="M4 20V4M4 20h16" /><path d="M9 20v-7M14 20V8M19 20v-4" /></svg>
)
export const SettingsIcon = () => (
    <svg {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100" /></svg>
)
