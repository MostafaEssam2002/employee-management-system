import UpdateData from "../utilis/UpdateData"

const UpdateForm = ({ action, method = "patch", onSuccess, onError, children }) => {
    const handleSubmit = async (event) => {
        try {
            const result = await UpdateData(event, action)
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

export default UpdateForm
