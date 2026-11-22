import { useCallback, useEffect, useState } from "react"
import UpdateForm from "../components/UpdateForm"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, UserIcon, BuildingIcon, DepartmentsIcon, EmployeesIcon } from "../assets/icons"
import FetchData from "../utilis/FetchData"
import "./CreateCompany.scss"
import { useParams } from "react-router-dom"

const API_URL = "http://localhost:3000/employee"
const AT_LEAST_ONE = "Enter at least one detail to update"

// One entry per editable input. The `name` must match what the API expects.
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

const UpdateEmployee = () => {
    const {id}=useParams()
    const [values, setValues] = useState(EMPTY_VALUES)
    const [errors, setErrors] = useState({}) // { id, name, email, ... }
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const closeToast = useCallback(() => setToast(null), [])

    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "Employee updated successfully" })
        setValues(EMPTY_VALUES)
        setErrors({})
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to update employee: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field) => (e) => {
        e.preventDefault()
        const { valueMissing, typeMismatch, patternMismatch, rangeUnderflow } = e.target.validity
        let message
        if (valueMissing) message = field.name === "id" ? `${field.label} is required` : AT_LEAST_ONE
        else if (typeMismatch) message = `Enter a valid ${field.label.toLowerCase()}`
        else if (patternMismatch) message = field.patternMessage
        else if (rangeUnderflow) message = `${field.label} must be greater than 0`
        else message = `${field.label} must be a positive whole number`
        setErrors((prev) => ({ ...prev, [field.name]: message }))
    }

    

    // the editable fields depend on each other ("at least one"), so clear all their errors
    const handleChange = (name) => (e) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }))
        setErrors((prev) => ({ id: prev.id }))
    }

    // load the employee's current values once a valid ID is entered
    useEffect(() => {
        if (!id || Number(id) < 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValues(EMPTY_VALUES)
            return
        }

        let cancelled = false

        FetchData(`${API_URL}/${id}`)
            .then((res) => {
                if (cancelled) return
                const employee = res.data
                setValues(
                    Object.fromEntries(FIELDS.map((f) => [f.name, employee[f.name] ?? ""]))
                )
            })
            .catch(() => {
                if (cancelled) return
                setValues(EMPTY_VALUES)
                setErrors((prev) => ({ ...prev, id: "Employee not found" }))
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
                    <h1 className="form-page__title">Update Employee</h1>
                    <p className="form-page__subtitle">
                        Enter the employee ID, then change any of the details below.
                    </p>
                </header>

                <UpdateForm action={`${API_URL}/${id}`} method="put" onSuccess={handleSuccess} onError={handleError}>
                    <section className="form-page__card">
                        <h2 className="form-page__section">Employee Details</h2>
                        <div className="form-field">
                            <label htmlFor="employeeId">Employee ID</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><EmployeesIcon /></span>
                                {/* no "name": the ID goes in the URL, not in the request body */}
                                <Input
                                    type="number"
                                    id="employeeId"
                                    placeHolder="Enter employee ID"
                                    className={`form-input${errors.id ? " form-input--error" : ""}`}
                                    value={id}
                                    disabled={true}
                                    onInvalid={handleInvalid({ name: "id", label: "Employee ID" })}
                                    required
                                    min="1"
                                    step="1"
                                    aria-invalid={errors.id ? "true" : undefined}
                                    aria-describedby={errors.id ? "employeeId-error" : undefined}
                                />
                            </div>
                            {errors.id && (
                                <p id="employeeId-error" className="form-field__error" role="alert">
                                    {errors.id}
                                </p>
                            )}
                        </div>

                        {FIELDS.map((field) => {
                            const { name, label, type, placeholder, Icon, pattern, min, step, autoComplete } = field
                            const fieldId = `employee-${name}`
                            const error = errors[name]

                            return (
                                <div className="form-field" key={name} style={{ marginTop: 18 }}>
                                    <label htmlFor={fieldId}>{label}</label>
                                    <div className="form-field__control">
                                        <span className="form-field__icon"><Icon /></span>
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
                                            aria-describedby={error ? `${fieldId}-error` : undefined}
                                        />
                                    </div>
                                    {error && (
                                        <p id={`${fieldId}-error`} className="form-field__error" role="alert">
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
                            text="Update Employee"
                        />
                        <a href="#/employees" className="form-btn form-btn--secondary">Cancel</a>
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

export default UpdateEmployee