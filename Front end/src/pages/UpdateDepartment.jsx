import { useCallback, useEffect, useState } from "react"
import UpdateForm from "../components/UpdateForm"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, BuildingIcon } from "../assets/icons"
import FetchData from "../utilis/FetchData"
import "./CreateCompany.scss"
import { useParams } from "react-router-dom"

const API_URL = "http://localhost:3000/department"
const AT_LEAST_ONE = "Enter a department name or a company ID to update"

const UpdateDepartment = () => {
    const {id}=useParams()
    const [name, setName] = useState("")
    const [companyId, setCompanyId] = useState("")
    const [errors, setErrors] = useState({})
    const [toast, setToast] = useState(null)
    const closeToast = useCallback(() => setToast(null), [])
    const setFieldError = (field, message) => setErrors((prev) => ({ ...prev, [field]: message }))
    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "Department updated successfully" })
        // setId("")
        setName("")
        setCompanyId("")
        setErrors({})
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to update department: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (field, label, missingMessage) => (e) => {
        e.preventDefault()
        const { valueMissing, patternMismatch, rangeUnderflow } = e.target.validity
        setFieldError(
            field,
            valueMissing
                ? missingMessage || `${label} is required`
                : patternMismatch
                    ? `${label} can't be blank`
                    : rangeUnderflow
                        ? `${label} must be greater than 0`
                        : `${label} must be a positive whole number`
        )
    }
    // name and company ID depend on each other ("at least one"), so clear both errors
    const handleChangeEditable = (setValue) => (e) => {
        setValue(e.target.value)
        setErrors((prev) => ({ ...prev, name: "", companyId: "" }))
    }
    // load the department's current values once a valid ID is entered
    useEffect(() => {
        if (!id || Number(id) < 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName("")
            setCompanyId("")
            return
        }

        let cancelled = false

        FetchData(`${API_URL}/${id}`)
            .then((res) => {
                if (cancelled) return
                const department = res.data
                setName(department.name ?? "")
                setCompanyId(department.companyId ?? department.company_id ?? "")
            })
            .catch(() => {
                if (cancelled) return
                setName("")
                setCompanyId("")
                setFieldError("id", "Department not found")
            })

        // ignore stale responses when the ID changes quickly
        return () => { cancelled = true }
    }, [id])

    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Update Department</h1>
                    <p className="form-page__subtitle">
                        Enter the department ID, then change its name, its company ID, or both.
                    </p>
                </header>

                <UpdateForm
                    action={`${API_URL}/${id}`}
                    method="put"
                    onSuccess={handleSuccess}
                    onError={handleError}
                >
                    <section className="form-page__card">
                        <h2 className="form-page__section">Department Details</h2>

                        <div className="form-field">
                            <label htmlFor="departmentId">Department ID</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><BuildingIcon /></span>
                                {/* no "name": the ID goes in the URL, not in the request body */}
                                <Input
                                    type="number"
                                    id="departmentId"
                                    placeHolder="Enter department ID"
                                    className={`form-input${errors.id ? " form-input--error" : ""}`}
                                    value={id}
                                    disabled={true}
                                    // onChange={handleChange("id", setId)}
                                    onInvalid={handleInvalid("id", "Department ID")}
                                    required
                                    min="1"
                                    step="1"
                                    aria-invalid={errors.id ? "true" : undefined}
                                    aria-describedby={errors.id ? "departmentId-error" : undefined}
                                />
                            </div>
                            {errors.id && (
                                <p id="departmentId-error" className="form-field__error" role="alert">
                                    {errors.id}
                                </p>
                            )}
                        </div>

                        <div className="form-field" style={{ marginTop: 18 }}>
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
                                    onChange={handleChangeEditable(setName)}
                                    onInvalid={handleInvalid("name", "Department name", AT_LEAST_ONE)}
                                    required={!companyId}
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
                                    onChange={handleChangeEditable(setCompanyId)}
                                    onInvalid={handleInvalid("companyId", "Company ID", AT_LEAST_ONE)}
                                    required={!name}
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
                            text="Update Department"
                        />
                        <a href="#/departments" className="form-btn form-btn--secondary">Cancel</a>
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

export default UpdateDepartment