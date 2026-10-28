import { useCallback, useState } from "react"
import Form from "../components/Form"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, UserIcon, BuildingIcon, DepartmentsIcon } from "../assets/icons"
import "./CreateCompany.scss"

// One entry per input. The `name` must match what the API expects.
const FIELDS = [
    {
        name: "name",
        label: "Employee Name",
        type: "text",
        placeholder: "Enter employee name",
        Icon: UserIcon,
        pattern: ".*\\S.*",
        patternMessage: "Employee name can't be blank",
        autoComplete: "name",
    },
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "name@company.com",
        Icon: TextIcon,
        autoComplete: "email",
    },
    {
        name: "mobile",
        label: "Mobile",
        type: "tel",
        placeholder: "+201001234567",
        Icon: TextIcon,
        pattern: "\\+?[0-9\\s\\(\\)\\-]{7,20}",
        patternMessage: "Enter a valid phone number, e.g. +201001234567",
        autoComplete: "tel",
    },
    {
        name: "address",
        label: "Address",
        type: "text",
        placeholder: "Enter address",
        Icon: TextIcon,
        pattern: ".*\\S.*",
        patternMessage: "Address can't be blank",
        autoComplete: "street-address",
    },
    {
        name: "designation",
        label: "Designation",
        type: "text",
        placeholder: "e.g. Software Engineer",
        Icon: TextIcon,
        pattern: ".*\\S.*",
        patternMessage: "Designation can't be blank",
    },
    {
        name: "companyId",
        label: "Company ID",
        type: "number",
        placeholder: "Enter company ID",
        Icon: BuildingIcon,
        min: "1",
        step: "1",
    },
    {
        name: "departmentId",
        label: "Department ID",
        type: "number",
        placeholder: "Enter department ID",
        Icon: DepartmentsIcon,
        min: "1",
        step: "1",
    },
]

const EMPTY_VALUES = Object.fromEntries(FIELDS.map((f) => [f.name, ""]))

const CreateEmployee = () => {
    const [values, setValues] = useState(EMPTY_VALUES)
    const [errors, setErrors] = useState({})
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const closeToast = useCallback(() => setToast(null), [])

    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "Employee created successfully" })
        setValues(EMPTY_VALUES)
        setErrors({})
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to add employee: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field) => (e) => {
        e.preventDefault()
        const { valueMissing, typeMismatch, patternMismatch } = e.target.validity
        let message
        if (valueMissing) message = `${field.label} is required`
        else if (typeMismatch) message = `Enter a valid ${field.label.toLowerCase()}`
        else if (patternMismatch) message = field.patternMessage
        else message = `${field.label} must be a positive whole number`
        setErrors((prev) => ({ ...prev, [field.name]: message }))
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
                    <h1 className="form-page__title">Add New Employee</h1>
                    <p className="form-page__subtitle">
                        Fill in the details below to create a new employee for your organization.
                    </p>
                </header>

                <Form action="http://localhost:3000/employee" method="post" onSuccess={handleSuccess} onError={handleError}>
                    <section className="form-page__card">
                        <h2 className="form-page__section">Employee Details</h2>

                        {FIELDS.map((field, index) => {
                            const { name, label, type, placeholder, Icon, pattern, min, step, autoComplete } = field
                            const id = `employee-${name}`
                            const error = errors[name]

                            return (
                                <div className="form-field" key={name} style={index ? { marginTop: 18 } : undefined}>
                                    <label htmlFor={id}>{label}</label>
                                    <div className="form-field__control">
                                        <span className="form-field__icon"><Icon /></span>
                                        <Input
                                            type={type}
                                            name={name}
                                            id={id}
                                            placeHolder={placeholder}
                                            className={`form-input${error ? " form-input--error" : ""}`}
                                            value={values[name]}
                                            onChange={handleChange(name)}
                                            onInvalid={handleInvalid(field)}
                                            required
                                            pattern={pattern}
                                            min={min}
                                            step={step}
                                            autoComplete={autoComplete}
                                            aria-invalid={error ? "true" : undefined}
                                            aria-describedby={error ? `${id}-error` : undefined}
                                        />
                                    </div>
                                    {error && (
                                        <p id={`${id}-error`} className="form-field__error" role="alert">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </section>

                    <div className="form-page__actions">
                        <Button
                            type="submit"
                            id="submit"
                            className="form-btn form-btn--primary"
                            text="Add New Employee"
                        />
                        <a href="#/employees" className="form-btn form-btn--secondary">Cancel</a>
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

export default CreateEmployee