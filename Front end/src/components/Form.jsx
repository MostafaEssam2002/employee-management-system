import SubmitForm from "../utilis/SubmitForm"

const Form = ({action,method,children}) => {
    
    return (
        <form action={action} method={method} onSubmit={SubmitForm}>
            {children}
        </form>
    )
}

export default Form