import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../utilis/auth'
import { EXPIRED_LOGIN_URL, clearSession, isSessionExpired } from '../utilis/session'

// Sends the user to /login the moment their session expires, even if they are idle on a page
// that makes no requests. Also re-checks when the tab becomes visible again, because browsers
// throttle timers in background tabs.
const useSessionExpiry = () => {
    const navigate = useNavigate()

    useEffect(() => {
        let timer

        const expire = () => {
            clearSession()
            navigate(EXPIRED_LOGIN_URL, { replace: true })
        }

        const schedule = () => {
            clearTimeout(timer)
            const user = getUser()
            if (!user || typeof user.expiresAt !== 'number') return
            if (isSessionExpired(user)) return expire()
            // cap at 2^31-1 ms (setTimeout limit)
            timer = setTimeout(schedule, Math.min(user.expiresAt - Date.now(), 2 ** 31 - 1))
        }

        const onVisible = () => document.visibilityState === 'visible' && schedule()

        schedule()
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', schedule)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', schedule)
        }
    }, [navigate])
}

export default useSessionExpiry
