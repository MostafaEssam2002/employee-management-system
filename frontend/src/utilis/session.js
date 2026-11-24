// Client-side session handling: remember when the cookie dies, and send the user to /login
// (instead of showing raw errors) when it does or when the API answers 401.
const API_URL = 'http://localhost:3000'
const SESSION_KEY = 'user'
// Must match SESSION_MAX_AGE_MS in the backend (auth.constants.ts); only a fallback,
// the login response normally carries the exact expiresAt.
const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000

export const LOGIN_PATH = '/login'
export const EXPIRED_LOGIN_URL = `${LOGIN_PATH}?reason=expired`
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.'

export const saveSession = (data) => {
    const user = { ...data, expiresAt: data?.expiresAt ?? Date.now() + DEFAULT_SESSION_TTL_MS }
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {
        // storage unavailable: the user will simply be sent back to /login
    }
    return user
}

export const clearSession = () => {
    try {
        localStorage.removeItem(SESSION_KEY)
    } catch {
        // ignore
    }
}

// A stored user whose cookie has already expired is not a valid session.
// Sessions saved before expiresAt existed are left to the server's 401.
export const isSessionExpired = (user) =>
    Boolean(user) && typeof user.expiresAt === 'number' && Date.now() >= user.expiresAt

export class SessionExpiredError extends Error {
    constructor() {
        super(SESSION_EXPIRED_MESSAGE)
        this.name = 'SessionExpiredError'
    }
}

let redirecting = false

// Call with every API response. On 401 (except the login/register calls, where 401 means
// "wrong credentials") it clears the session, redirects to /login and throws.
export const assertAuthorized = (response, url = '') => {
    if (response.status !== 401) return
    if (/\/auth\/(login|register)\b/.test(url)) return

    clearSession()
    if (!redirecting && window.location.pathname !== LOGIN_PATH) {
        redirecting = true // several parallel requests can all return 401; redirect once
        window.location.replace(EXPIRED_LOGIN_URL)
    }
    throw new SessionExpiredError()
}

export const logout = async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {
        // offline / server down: still drop the local session below
    } finally {
        clearSession()
    }
}
