import { useCallback, useState } from "react"
import Form from "../components/Form"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon } from "../assets/icons"
import "./CreateCompany.scss"

const CreateCompany = () => {
    const [name, setName] = useState("")
    const [nameError, setNameError] = useState("")
    const [toast, setToast] = useState(null) // { type: 'error' | 'success', message }

    const closeToast = useCallback(() => setToast(null), [])

    const handleSuccess = (result) => {
        // console.log(result.message)
        // console.log(result.data)
        setToast({ type: "success", message: result.message || "Company created successfully" })
        setName("")
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to add company: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    const handleInvalid = (e) => {
        e.preventDefault()
        setNameError(
            e.target.validity.valueMissing? "Company name is required": "Company name can't be blank"
        )
    }

    const handleChange = (e) => {
        setName(e.target.value)
        setNameError("")
    }

    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />

            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Add New Company</h1>
                    <p className="form-page__subtitle">
                        Fill in the details below to create a new company for your organization.
                    </p>
                </header>

                <Form action="http://localhost:3000/company" method="post" onSuccess={handleSuccess} onError={handleError}>
                    <section className="form-page__card">
                        <h2 className="form-page__section">Company Details</h2>

                        <div className="form-field">
                            <label htmlFor="companyName">Company Name</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><TextIcon /></span>
                                <Input
                                    type="text"
                                    name="name"
                                    id="companyName"
                                    placeHolder="Enter company name"
                                    className={`form-input${nameError ? " form-input--error" : ""}`}
                                    value={name}
                                    onChange={handleChange}
                                    onInvalid={handleInvalid}
                                    required
                                    pattern=".*\S.*"
                                    autoComplete="organization"
                                    aria-invalid={nameError ? "true" : undefined}
                                    aria-describedby={nameError ? "companyName-error" : undefined}
                                />
                            </div>
                            {nameError && (
                                <p id="companyName-error" className="form-field__error" role="alert">
                                    {nameError}
                                </p>
                            )}
                        </div>

                    </section>

                    <div className="form-page__actions">
                        <Button
                            type="submit"
                            id="submit"
                            className="form-btn form-btn--primary"
                            text="Add New Company"
                        />
                        <a href="#/companies" className="form-btn form-btn--secondary">Cancel</a>
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

export default CreateCompany
