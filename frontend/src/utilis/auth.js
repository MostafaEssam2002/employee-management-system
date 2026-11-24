// Single source of truth for the role-based UI rules.
// Keep in sync with the @Roles(...) decorators in the backend controllers.
export const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
}

export const ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]
export const ADMIN_AND_MANAGER = [ROLES.ADMIN, ROLES.MANAGER]
export const ADMIN_ONLY = [ROLES.ADMIN]

export const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'))
    } catch {
        return null
    }
}

export const getRole = () => getUser()?.role ?? null

export const hasRole = (allowed, role = getRole()) => Boolean(role) && allowed.includes(role)
