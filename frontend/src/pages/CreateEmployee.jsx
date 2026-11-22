import { useCallback, useMemo, useState } from "react"
import Form from "../components/Form"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import SearchSelect from "../components/SearchSelect/SearchSelect"
import useCompanies from "../hooks/useCompanies"
import useCompanyDepartments from "../hooks/useCompanyDepartments"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, UserIcon, BuildingIcon, DepartmentsIcon } from "../assets/icons"
import "./CreateCompany.scss"

// One entry per text input. The `name` must match what the API expects.
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
]

// the two searchable dropdowns (values are ids, "" = nothing selected)
const COMPANY_FIELD = { name: "companyId", label: "Company" }
const DEPARTMENT_FIELD = { name: "departmentId", label: "Department" }

const EMPTY_VALUES = {
    ...Object.fromEntries(FIELDS.map((f) => [f.name, ""])),
    companyId: "",
    departmentId: "",
}

const toOption = (item) => ({ value: item.id, label: item.name, meta: `ID ${item.id}` })

const CreateEmployee = () => {
    const [values, setValues] = useState(EMPTY_VALUES)
    const [errors, setErrors] = useState({})
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const companies = useCompanies()
    const departments = useCompanyDepartments(values.companyId)

    const companyOptions = useMemo(() => companies.companies.map(toOption), [companies.companies])
    const departmentOptions = useMemo(() => departments.departments.map(toOption), [departments.departments])

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
        else message = e.target.validationMessage
        setErrors((prev) => ({ ...prev, [field.name]: message }))
    }

    const handleChange = (name) => (e) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // changing the company invalidates the department (it belongs to the old company)
    const handleCompanyChange = (companyId) => {
        setValues((prev) => ({ ...prev, companyId, departmentId: "" }))
        setErrors((prev) => ({ ...prev, companyId: "", departmentId: "" }))
    }

    const handleDepartmentChange = (departmentId) => {
        setValues((prev) => ({ ...prev, departmentId }))
        setErrors((prev) => ({ ...prev, departmentId: "" }))
    }

    const hasCompany = values.companyId !== ""

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
                            const { name, label, type, placeholder, Icon, pattern, autoComplete } = field
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

                        <div className="form-field" style={{ marginTop: 18 }}>
                            <label htmlFor="employee-companyId">{COMPANY_FIELD.label}</label>
                            <SearchSelect
                                id="employee-companyId"
                                name={COMPANY_FIELD.name}
                                label={COMPANY_FIELD.label}
                                value={values.companyId}
                                options={companyOptions}
                                onChange={handleCompanyChange}
                                placeholder={companies.isLoading ? "Loading companies…" : "Search and select a company"}
                                Icon={BuildingIcon}
                                isLoading={companies.isLoading}
                                loadError={companies.error}
                                onRetry={companies.reload}
                                emptyText="No companies yet"
                                hasError={Boolean(errors.companyId)}
                                required
                                onInvalid={handleInvalid(COMPANY_FIELD)}
                                aria-invalid={errors.companyId ? "true" : undefined}
                                aria-describedby={errors.companyId ? "employee-companyId-error" : undefined}
                            />
                            {errors.companyId && (
                                <p id="employee-companyId-error" className="form-field__error" role="alert">
                                    {errors.companyId}
                                </p>
                            )}
                        </div>

                        <div className="form-field" style={{ marginTop: 18 }}>
                            <label htmlFor="employee-departmentId">{DEPARTMENT_FIELD.label}</label>
                            <SearchSelect
                                id="employee-departmentId"
                                name={DEPARTMENT_FIELD.name}
                                label={DEPARTMENT_FIELD.label}
                                value={values.departmentId}
                                options={departmentOptions}
                                onChange={handleDepartmentChange}
                                placeholder={
                                    !hasCompany
                                        ? "Select a company first"
                                        : departments.isLoading
                                            ? "Loading departments…"
                                            : "Search and select a department"
                                }
                                Icon={DepartmentsIcon}
                                disabled={!hasCompany}
                                isLoading={departments.isLoading}
                                loadError={departments.error}
                                onRetry={departments.reload}
                                emptyText="This company has no departments yet"
                                hasError={Boolean(errors.departmentId)}
                                required
                                onInvalid={handleInvalid(DEPARTMENT_FIELD)}
                                aria-invalid={errors.departmentId ? "true" : undefined}
                                aria-describedby={errors.departmentId ? "employee-departmentId-error" : undefined}
                            />
                            {errors.departmentId && (
                                <p id="employee-departmentId-error" className="form-field__error" role="alert">
                                    {errors.departmentId}
                                </p>
                            )}
                        </div>
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