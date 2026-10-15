import Button from "../components/Button"
import Input from "../components/Input"
import Form from './../components/Form';

const Register = () => {
    return (
        <Form action="http://localhost:3000/auth/register" method="post" >
            <Input name="name" type="text" placeHolder="enter name" id="name" className="nameClass"/>
            <Input name="email" type="email" placeHolder="enter email" id="email" className="emailClass"/>
            <Input name="password" type="password" placeHolder="enter password" id="password" className="passwordClass"/>
            <Input name="role" type="text" value="Employee" hidden={true} readOnly={true} placeHolder="enter role" id="role" className="roleClass"/>
            <Input name="mobile" type="mobile" placeHolder="enter mobile" id="mobile" className="mobileClass"/>
            <Input name="address" type="text" placeHolder="enter address" id="address" className="addressClass"/>
            <Input name="departmentId" type="number" placeHolder="enter departmentId" id="departmentId" className="departmentIdClass"/>
            <Input name="hiredOn" type="Date" placeHolder="enter hiredOn" id="hiredOn" className="hiredOnClass"/>
            <Input name="designation" type="text" placeHolder="enter designation" id="designation" className="designationClass"/>
            <Button type="submit" id="submit" className="submitClass" text="Register" />
        </Form>
    )
}

export default Register