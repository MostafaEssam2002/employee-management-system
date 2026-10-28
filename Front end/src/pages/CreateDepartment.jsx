import { useCallback, useState } from "react"
import Form from "../components/Form"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, BuildingIcon } from "../assets/icons"
import "./CreateCompany.scss"

const CreateDepartment = () => {
    const [name, setName] = useState("")
    const [companyId, setCompanyId] = useState("")
    const [errors, setErrors] = useState({}) // { name, companyId }
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }
    const closeToast = useCallback(() => setToast(null), [])
    const setFieldError = (field, message) =>setErrors((prev) => ({ ...prev, [field]: message }))
    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "Department created successfully" })
        setName("")
        setCompanyId("")
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to add department: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field, label) => (e) => {
        e.preventDefault()
        const { valueMissing, patternMismatch } = e.target.validity
        setFieldError(
            field,
            valueMissing
                ? `${label} is required`
                : patternMismatch
                    ? `${label} can't be blank`
                    : `${label} must be a positive whole number`
        )
    }

    const handleChange = (field, setValue) => (e) => {
        setValue(e.target.value)
        setFieldError(field, "")
    }

    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Add New Department</h1>
                    <p className="form-page__subtitle">
                        Fill in the details below to create a new department for your organization.
                    </p>
                </header>

                <Form action="http://localhost:3000/department" method="post" onSuccess={handleSuccess} onError={handleError}>
                    <section className="form-page__card">
                        <h2 className="form-page__section">Department Details</h2>

                        <div className="form-field">
                            <label htmlFor="departmentName">Department Name</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><TextIcon /></span>
                                <Input
                                    type="text"
                                    name="name"
                                    id="departmentName"
                                    placeHolder="Enter department name"
                                    className={`form-input${errors.name ? " form-input--error" : ""}`}
                                    value={name}
                                    onChange={handleChange("name", setName)}
                                    onInvalid={handleInvalid("name", "Department name")}
                                    required
                                    pattern=".*\S.*"
                                    aria-invalid={errors.name ? "true" : undefined}
                                    aria-describedby={errors.name ? "departmentName-error" : undefined}
                                />
                            </div>
                            {errors.name && (
                                <p id="departmentName-error" className="form-field__error" role="alert">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="form-field" style={{ marginTop: 18 }}>
                            <label htmlFor="companyId">Company ID</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><BuildingIcon /></span>
                                <Input
                                    type="number"
                                    name="companyId"
                                    id="companyId"
                                    placeHolder="Enter company ID"
                                    className={`form-input${errors.companyId ? " form-input--error" : ""}`}
                                    value={companyId}
                                    onChange={handleChange("companyId", setCompanyId)}
                                    onInvalid={handleInvalid("companyId", "Company ID")}
                                    required
                                    min="1"
                                    step="1"
                                    aria-invalid={errors.companyId ? "true" : undefined}
                                    aria-describedby={errors.companyId ? "companyId-error" : undefined}
                                />
                            </div>
                            {errors.companyId && (
                                <p id="companyId-error" className="form-field__error" role="alert">
                                    {errors.companyId}
                                </p>
                            )}
                        </div>
                    </section>

                    <div className="form-page__actions">
                        <Button
                            type="submit"
                            id="submit"
                            className="form-btn form-btn--primary"
                            text="Add New Department"
                        />
                        <a href="#/departments" className="form-btn form-btn--secondary">Cancel</a>
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

export default CreateDepartment