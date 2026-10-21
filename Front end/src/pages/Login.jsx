import { useState } from "react"
import Button from "../components/Button"
import Input from "../components/Input"
import Form from './../components/Form';
import BrainWiseLogo from "../assets/BrainWiseLogo"
import LoginIllustration from "../assets/LoginIllustration"
import "./Login.css"

const EyeOffIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.500 12C4.500 8 8 6 12 6s7.500 2 9.500 6c-2 4-5.500 6-9.500 6S4.500 16 2.500 12Z" />
        <circle cx="12" cy="12" r="2.800" />
        <path d="M4 20 20 4" />
    </svg>
)

const EyeIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.500 12C4.500 8 8 6 12 6s7.500 2 9.500 6c-2 4-5.500 6-9.500 6S4.500 16 2.500 12Z" />
        <circle cx="12" cy="12" r="2.800" />
    </svg>
)

const Login = () => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="login-page">
            <div className="login-bg-mark" aria-hidden="true" />

            <header className="login-brand">
                <BrainWiseLogo size={62} />
                <span className="login-brand-name">BrainWise</span>
            </header>

            <section className="login-hero">
                <LoginIllustration />
            </section>

            <main className="login-card">
                <h1 className="login-title">Employee Login</h1>

                <Form action="http://localhost:3000/auth/login" method="post">
                    <div className="login-field">
                        <label htmlFor="email">Email Address</label>
                        <Input name="email" type="email" placeHolder="corporate.email@brainwise.com" id="email" className="emailClass login-input" />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <div className="login-password">
                            <Input name="password" type={showPassword ? "text" : "password"} placeHolder="enter your password" id="password" className="passwordClass login-input" />
                            <button
                                type="button"
                                className="login-eye"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                            </button>
                        </div>
                    </div>

                    <a href="#" className="login-forgot">Forgot Password?</a>

                    <Button type="submit" id="submit" className="submitClass login-submit" text="Secure Login" />

                    <a href="#/register" className="login-request">Request Access</a>
                </Form>
            </main>

            <footer className="login-footer">
                <span>1.3.18</span>
                <span>© 2026 BrainWise EMS, Inc. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Login
