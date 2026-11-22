import { useState } from "react"
import Button from "../components/Button"
import Input from "../components/Input"
import Form from './../components/Form';
import BrainWiseLogo from "../assets/BrainWiseLogo"
import registerIllustration from "../assets/register-illustration.png"
import {
    UserIcon, MailIcon, LockIcon, PhoneIcon, BadgeIcon,
    PinIcon, BuildingIcon, CalendarIcon, EyeIcon, EyeOffIcon,
} from "../assets/icons"
import "./Register.css"

const Register = () => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="reg-page">
            {/* ---------- left: brand + illustration ---------- */}
            <aside className="reg-left">
                <header className="reg-brand">
                    <BrainWiseLogo size={46} color="#0c5a60" />
                    <span className="reg-brand-name">BrainWise</span>
                </header>

                <div className="reg-hero">
                    <img src={registerIllustration} alt="Team collaborating around an employee dashboard" draggable="false" />
                </div>

                <span className="reg-version">Version 1.3.18</span>
            </aside>

            {/* ---------- right: form ---------- */}
            <section className="reg-right">
                <main className="reg-card">
                    <h1 className="reg-title">Join BrainWise: Employee Management System</h1>
                    <p className="reg-subtitle">Create your account to start managing companies, departments, and employees securely.</p>

                    <Form action="http://localhost:3000/auth/register" method="post">
                        <div className="reg-grid">
                            <div className="reg-field">
                                <label htmlFor="name">Full Name</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><UserIcon /></span>
                                    <Input name="name" type="text" placeHolder="Full Name" id="name" className="nameClass reg-input" required autoComplete="name" />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="email">Email Address</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><MailIcon /></span>
                                    <Input name="email" type="email" placeHolder="Email Address" id="email" className="emailClass reg-input" required autoComplete="email" />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="password">Password</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><LockIcon /></span>
                                    <Input name="password" type={showPassword ? "text" : "password"} placeHolder="Password" id="password" className="passwordClass reg-input reg-input-pw" required autoComplete="new-password" />
                                    <button
                                        type="button"
                                        className="reg-eye"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="mobile">Mobile Number</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><PhoneIcon /></span>
                                    <Input name="mobile" type="tel" placeHolder="Mobile Number" id="mobile" className="mobileClass reg-input" required autoComplete="tel" />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="designation">Designation</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><BadgeIcon /></span>
                                    <Input name="designation" type="text" placeHolder="Designation" id="designation" className="designationClass reg-input" required />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="departmentId">Department ID</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><BuildingIcon /></span>
                                    <Input name="departmentId" type="number" placeHolder="Department ID" id="departmentId" className="departmentIdClass reg-input" required min="1" />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="address">Address</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><PinIcon /></span>
                                    <Input name="address" type="text" placeHolder="Address" id="address" className="addressClass reg-input" required autoComplete="street-address" />
                                </div>
                            </div>

                            <div className="reg-field">
                                <label htmlFor="hiredOn">Hired On</label>
                                <div className="reg-control">
                                    <span className="reg-icon"><CalendarIcon /></span>
                                    <Input name="hiredOn" type="date" placeHolder="Hired On" id="hiredOn" className="hiredOnClass reg-input" required />
                                </div>
                            </div>
                        </div>

                        <Input name="role" type="text" value="Employee" hidden={true} readOnly={true} placeHolder="enter role" id="role" className="roleClass" />

                        <Button type="submit" id="submit" className="submitClass reg-submit" text="Register Account" />
                    </Form>

                    <p className="reg-login-line">Already have an account? <a href="#/login">Login</a></p>
                    <a href="#" className="reg-terms">Terms of Service</a>
                </main>

                <footer className="reg-footer">
                    <span>© 2026 BrainWise Inc.</span>
                </footer>
            </section>
        </div>
    )
}

export default Register
