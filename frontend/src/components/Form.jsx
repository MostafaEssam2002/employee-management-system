import SubmitForm from "../utilis/SubmitForm"

const Form = ({ action, method = "post", onSuccess, onError, children }) => {
    const handleSubmit = async (event) => {
        try {
            const result = await SubmitForm(event, action)
            onSuccess?.(result)
        } catch (error) {
            onError?.(error.message)
        }
    }

    return (
        <form action={action} method={method} onSubmit={handleSubmit}>
            {children}
        </form>
    )
}

export default Form
