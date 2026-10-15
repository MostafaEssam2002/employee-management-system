import Button from "../components/Button"
import Input from "../components/Input"
import Form from './../components/Form';

const Login = () => {
    return (
        <Form action="http://localhost:3000/auth/login" method="post">
            <Input name="email" type="email" placeHolder="enter email" id="email" className="emailClass"/>
            <Input name="password" type="password" placeHolder="enter password" id="password" className="passwordClass"/>
            <Button type="submit" id="submit" className="submitClass" text="Login" />
        </Form>
    )
}

export default Login