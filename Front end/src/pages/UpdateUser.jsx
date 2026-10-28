import { useCallback, useEffect, useState } from "react"
import UpdateForm from "../components/UpdateForm"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { UserIcon, MailIcon, BadgeIcon, SettingsIcon, EmployeesIcon } from "../assets/icons"
import FetchData from "../utilis/FetchData"
import "./CreateCompany.scss"

const API_URL = "http://localhost:3000/user"
const AT_LEAST_ONE = "Enter at least one detail to update"

// One entry per editable input. The `name` must match what the API expects.
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
        name: "role",
        label: "Role",
        type: "choice",
        Icon: BadgeIcon,
        // one clickable card per role; the user's current role is disabled
        options: [
            { value: "Admin", Icon: SettingsIcon },
            { value: "Employee", Icon: EmployeesIcon },
            { value: "Manager", Icon: BadgeIcon },
        ],
    },
]

const EMPTY_VALUES = Object.fromEntries(FIELDS.map((f) => [f.name, ""]))

const UpdateUser = () => {
    const [id, setId] = useState("")
    const [values, setValues] = useState(EMPTY_VALUES)
    const [currentRole, setCurrentRole] = useState("") // the role the user has now (its card is disabled)
    const [errors, setErrors] = useState({}) // { id, name, email, ... }
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const closeToast = useCallback(() => setToast(null), [])

    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "User updated successfully" })
        setId("")
        setValues(EMPTY_VALUES)
        setCurrentRole("")
        setErrors({})
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to update user: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field) => (e) => {
        e.preventDefault()
        // several fields can be invalid at once: only toast the first one (the one that gets focus)
        const showToast = (message) => {
            if (e.target.form?.querySelector(":invalid") === e.target) setToast({ type: "error", message })
        }
        const { valueMissing, typeMismatch, patternMismatch, rangeUnderflow } = e.target.validity
        let message
        if (valueMissing) message = field.name === "id" ? `${field.label} is required` : AT_LEAST_ONE
        else if (typeMismatch) message = `Enter a valid ${field.label.toLowerCase()}`
        else if (patternMismatch) message = field.patternMessage
        else if (rangeUnderflow) message = `${field.label} must be greater than 0`
        else message = `${field.label} must be a positive whole number`
        setErrors((prev) => ({ ...prev, [field.name]: message })) // red border only
        showToast(message)
    }

    const handleChangeId = (e) => {
        setId(e.target.value)
        setErrors((prev) => ({ ...prev, id: "" }))
    }

    // the editable fields depend on each other ("at least one"), so clear all their errors
    const handleChange = (name) => (e) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }))
        setErrors((prev) => ({ id: prev.id }))
    }

    // load the user's current values once a valid ID is entered
    useEffect(() => {
        if (!id || Number(id) < 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValues(EMPTY_VALUES)
            setCurrentRole("")
            return
        }

        let cancelled = false

        FetchData(`${API_URL}/${id}`)
            .then((res) => {
                if (cancelled) return
                const user = res.data
                // role starts empty: the user picks a NEW role, the current one is shown disabled
                setValues(
                    Object.fromEntries(
                        FIELDS.map((f) => [f.name, f.name === "role" ? "" : user[f.name] ?? ""])
                    )
                )
                setCurrentRole(user.role ?? "")
            })
            .catch(() => {
                if (cancelled) return
                setValues(EMPTY_VALUES)
                setCurrentRole("")
                setErrors((prev) => ({ ...prev, id: "User not found" })) // red border only
                setToast({ type: "error", message: "User not found" })
            })

        // ignore stale responses when the ID changes quickly
        return () => { cancelled = true }
    }, [id])

    // a field is only required while every other editable field is empty
    const isRequired = (name) =>
        FIELDS.every((f) => f.name === name || String(values[f.name]).trim() === "")

    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Update User</h1>
                    <p className="form-page__subtitle">
                        Enter the user ID, then change any of the details below.
                    </p>
                </header>

                <UpdateForm
                    action={`${API_URL}/${id}`}
                    method="put"
                    onSuccess={handleSuccess}
                    onError={handleError}
                >
                    <section className="form-page__card">
                        <h2 className="form-page__section">User Details</h2>

                        <div className="form-field">
                            <label htmlFor="userId">User ID</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><UserIcon /></span>
                                {/* no "name": the ID goes in the URL, not in the request body */}
                                <Input
                                    type="number"
                                    id="userId"
                                    placeHolder="Enter user ID"
                                    className={`form-input${errors.id ? " form-input--error" : ""}`}
                                    value={id}
                                    onChange={handleChangeId}
                                    onInvalid={handleInvalid({ name: "id", label: "User ID" })}
                                    required
                                    min="1"
                                    step="1"
                                    aria-invalid={errors.id ? "true" : undefined}
                                />
                            </div>
                        </div>

                        {FIELDS.map((field) => {
                            const { name, label, type, placeholder, Icon, pattern, min, step, autoComplete } = field
                            const fieldId = `user-${name}`
                            const error = errors[name]

                            return (
                                <div className="form-field" key={name} style={{ marginTop: 18 }}>
                                    <label htmlFor={fieldId}>{label}</label>
                                    <div className="form-field__control">
                                        {type !== "choice" && <span className="form-field__icon"><Icon /></span>}
                                        {type === "choice" ? (
                                            <div className="role-picker" role="radiogroup" aria-label={label}>
                                                {field.options.map((opt) => {
                                                    const isCurrent = currentRole.toLowerCase() === opt.value.toLowerCase()
                                                    return (
                                                        <label key={opt.value} className="role-picker__option">
                                                            <input
                                                                type="radio"
                                                                name={name}
                                                                value={opt.value}
                                                                checked={values[name] === opt.value}
                                                                onChange={handleChange(name)}
                                                                onInvalid={handleInvalid(field)}
                                                                disabled={isCurrent}
                                                                required={isRequired(name)}
                                                            />
                                                            <span className="role-picker__card">
                                                                <opt.Icon />
                                                                <span>{opt.value}</span>
                                                                {isCurrent && <small>Current</small>}
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                        <Input
                                            type={type}
                                            name={name}
                                            id={fieldId}
                                            placeHolder={placeholder}
                                            className={`form-input${error ? " form-input--error" : ""}`}
                                            value={values[name]}
                                            onChange={handleChange(name)}
                                            onInvalid={handleInvalid(field)}
                                            required={isRequired(name)}
                                            pattern={pattern}
                                            min={min}
                                            step={step}
                                            autoComplete={autoComplete}
                                            aria-invalid={error ? "true" : undefined}
                                        />
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
                            text="Update User"
                        />
                        <a href="#/users" className="form-btn form-btn--secondary">Cancel</a>
                    </div>
                </UpdateForm>
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

export default UpdateUser