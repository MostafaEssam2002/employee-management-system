import { useEffect } from 'react'
import './Toast.scss'

// type: 'error' | 'success'. Closes itself after `duration` ms.
const Toast = ({ type = 'error', message, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [message, duration, onClose])

    if (!message) return null

    return (
        <div className={`toast toast--${type}`} role={type === 'error' ? 'alert' : 'status'}>
            <span className="toast__icon" aria-hidden="true">{type === 'error' ? '!' : '✓'}</span>
            <p className="toast__message">{message}</p>
            <button type="button" className="toast__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
    )
}

export default Toast
