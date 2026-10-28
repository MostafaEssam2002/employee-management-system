import { useCallback, useState } from "react"
import Form from "../components/Form"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { UserIcon, MailIcon, LockIcon, SettingsIcon, EmployeesIcon, BadgeIcon, EyeIcon, EyeOffIcon } from "../assets/icons"
import "./CreateCompany.scss"

const FIELDS = [
    {
        name: "name",
        label: "User Name",
        type: "text",
        placeholder: "Enter user name",
        Icon: UserIcon,
        pattern: ".*\\S.*",
        patternMessage: "User name can't be blank",
        autoComplete: "name",
    },
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "name@company.com",
        Icon: MailIcon,
        autoComplete: "email",
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter password",
        Icon: LockIcon,
        pattern: ".{6,}",
        patternMessage: "Password must be at least 6 characters",
        autoComplete: "new-password",
    },
    {
        name: "role",
        label: "Role",
        type: "choice",
        Icon: BadgeIcon,
        // one clickable card per role
        options: [
            { value: "Admin", Icon: SettingsIcon },
            { value: "Employee", Icon: EmployeesIcon },
            { value: "Manager", Icon: BadgeIcon },
        ],
    },
]

const EMPTY_VALUES = Object.fromEntries(FIELDS.map((f) => [f.name, ""]))

const CreateUser = () => {
    const [values, setValues] = useState(EMPTY_VALUES)
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const closeToast = useCallback(() => setToast(null), [])

    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "User created successfully" })
        setValues(EMPTY_VALUES)
        setErrors({})
        setShowPassword(false)
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to add user: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field) => (e) => {
        e.preventDefault()
        // several fields can be invalid at once: only toast the first one (the one that gets focus)
        const showToast = (message) => {
            if (e.target.form?.querySelector(":invalid") === e.target) setToast({ type: "error", message })
        }
        const { valueMissing, typeMismatch, patternMismatch } = e.target.validity
        let message
        if (valueMissing) message = `${field.label} is required`
        else if (typeMismatch) message = `Enter a valid ${field.label.toLowerCase()}`
        else if (patternMismatch) message = field.patternMessage
        else message = `${field.label} is invalid`
        setErrors((prev) => ({ ...prev, [field.name]: message })) // red border only
        showToast(message)
    }

    const handleChange = (name) => (e) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Add New User</h1>
                    <p className="form-page__subtitle">
                        Fill in the details below to create a new user account.
                    </p>
                </header>

                <Form action="http://localhost:3000/user" method="post" onSuccess={handleSuccess} onError={handleError}>
                    <section className="form-page__card">
                        <h2 className="form-page__section">User Details</h2>

                        {FIELDS.map((field, index) => {
                            const { name, label, type, placeholder, Icon, pattern, autoComplete } = field
                            const id = `user-${name}`
                            const error = errors[name]
                            const isPassword = name === "password"

                            return (
                                <div className="form-field" key={name} style={index ? { marginTop: 18 } : undefined}>
                                    <label htmlFor={id}>{label}</label>
                                    <div className="form-field__control">
                                        {type !== "choice" && <span className="form-field__icon"><Icon /></span>}
                                        {type === "choice" ? (
                                            <div className="role-picker" role="radiogroup" aria-label={label}>
                                                {field.options.map((opt, i) => (
                                                    <label key={opt.value} className="role-picker__option">
                                                        <input
                                                            type="radio"
                                                            name={name}
                                                            value={opt.value}
                                                            checked={values[name] === opt.value}
                                                            onChange={handleChange(name)}
                                                            onInvalid={handleInvalid(field)}
                                                            required={i === 0}
                                                        />
                                                        <span className="role-picker__card">
                                                            <opt.Icon />
                                                            <span>{opt.value}</span>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                        <Input
                                            type={isPassword && showPassword ? "text" : type}
                                            name={name}
                                            id={id}
                                            placeHolder={placeholder}
                                            className={`form-input${error ? " form-input--error" : ""}${isPassword ? " form-input--has-toggle" : ""}`}
                                            value={values[name]}
                                            onChange={handleChange(name)}
                                            onInvalid={handleInvalid(field)}
                                            required
                                            pattern={pattern}
                                            autoComplete={autoComplete}
                                            aria-invalid={error ? "true" : undefined}
                                        />
                                        )}
                                        {isPassword && (
                                            <button
                                                type="button"
                                                className="form-field__toggle"
                                                onClick={() => setShowPassword((v) => !v)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </section>

                    <div className="form-page__actions">
                        <Button
                            type="submit"
                            id="submit"
                            className="form-btn form-btn--primary"
                            text="Add New User"
                        />
                        <a href="#/users" className="form-btn form-btn--secondary">Cancel</a>
                    </div>
                </Form>
            </div>

            <footer className="form-page__footer">
                <span>© 2026 BrainWise Inc.</span>
            </footer>

            <div className="form-page__watermark" aria-hidden="true">
                <BrainWiseLogo size={260} color="#cfe9df" />
            </div>
        </main>
    )
}

export default CreateUser