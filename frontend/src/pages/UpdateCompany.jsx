import { useCallback, useEffect, useRef, useState } from "react"
import UpdateForm from "../components/UpdateForm"
import Input from "../components/Input"
import Button from "../components/Button"
import Toast from "../components/Toast/Toast"
import BrainWiseLogo from "../assets/BrainWiseLogo"
import { TextIcon, BuildingIcon } from "../assets/icons"
import "./CreateCompany.scss"
import FetchData from "../utilis/FetchData"
import { useParams } from "react-router-dom"

const UpdateCompany = () => {
    const {id}=useParams()
    // const [id, setId] = useState("")
    const [name, setName] = useState("")
    const [idError, setIdError] = useState("")
    const [nameError, setNameError] = useState("")
    const [toast, setToast] = useState(null) 
    const closeToast = useCallback(() => setToast(null), [])
    const handleSuccess = (result) => {
        setToast({ type: "success", message: result.message || "Company updated successfully" })
        // setId("")
        setName("")
        setIdError("")
        setNameError("")
    }

    const handleError = (message) => {
        // new object each time so repeated failures restart the timer
        setToast({ type: "error", message: `Failed to update company: ${message}` })
    }

    // browser validation fired -> show our own message under the field
    
    const handleInvalidId = (e) => {
        e.preventDefault()

        const message = e.target.validity.valueMissing
            ? "Company ID is required"
            : e.target.validity.rangeUnderflow
                ? "Company ID must be greater than 0"
                : "Please enter a valid Company ID"

        setIdError(message)

        setToast({
            type: "error",
            message
        })
    }

    const handleInvalidName = (e) => {
        e.preventDefault()

        const message = e.target.validity.valueMissing
            ? "Company name is required"
            : e.target.validity.patternMismatch
                ? "Company name can't be blank"
                : "Please enter a valid company name"

        setNameError(message)

        setToast({
            type: "error",
            message
        })
    }
    const handleChangeId = () => {
        // setId(e.target.value)
        setIdError("")
    }

    const handleChangeName = (e) => {
        setName(e.target.value)
        setNameError("")
    }
    useEffect(()=>{
        async function test(){
            if (!id) {
                setName("");
                return;
            }
            const res = await FetchData(`http://localhost:3000/company/${id}`)
            setName(res.data.name)
        };
        test()
    },[id])
    const ref = useRef(null)
    return (
        <main className="form-page">
            <Toast type={toast?.type} message={toast?.message} onClose={closeToast} />
            <div className="form-page__inner">
                <header className="form-page__header">
                    <h1 className="form-page__title">Update Company</h1>
                    <p className="form-page__subtitle">
                        Enter the company ID and its new details to update it.
                    </p>
                </header>

                <UpdateForm
                    action={`http://localhost:3000/company/${id}`}
                    method="put"
                    onSuccess={handleSuccess}
                    onError={handleError}
                >
                    <section className="form-page__card">
                        <h2 className="form-page__section">Company Details</h2>

                        <div className="form-field">
                            <label htmlFor="companyId">Company ID</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><BuildingIcon /></span>
                                <Input
                                    type="number"
                                    name="companyId"
                                    id="companyId"
                                    placeHolder="Enter company ID"
                                    className={`form-input${idError ? " form-input--error" : ""}`}
                                    value={id}
                                    onChange={handleChangeId}
                                    onInvalid={handleInvalidId}
                                    required
                                    min="1"
                                    step="1"
                                    aria-invalid={idError ? "true" : undefined}
                                    aria-describedby={idError ? "companyId-error" : undefined}
                                />
                            </div>
                        </div>

                        <div className="form-field" style={{ marginTop: 18 }}>
                            <label htmlFor="companyName">Company Name</label>
                            <div className="form-field__control">
                                <span className="form-field__icon"><TextIcon /></span>
                                <Input
                                    type="text"
                                    name="name"
                                    ref={ref}
                                    id="companyName"
                                    placeHolder="Enter company name"
                                    className={`form-input${nameError ? " form-input--error" : ""}`}
                                    value={name}
                                    onChange={handleChangeName}
                                    onInvalid={handleInvalidName}
                                    required
                                    pattern=".*\S.*"
                                    autoComplete="organization"
                                    aria-invalid={nameError ? "true" : undefined}
                                    aria-describedby={nameError ? "companyName-error" : undefined}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="form-page__actions">
                        <Button
                            type="submit"
                            id="submit"
                            className="form-btn form-btn--primary"
                            text="Update Company"
                        />
                        <a href="#/companies" className="form-btn form-btn--secondary">Cancel</a>
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

export default UpdateCompany