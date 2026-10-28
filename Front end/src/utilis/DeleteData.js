async function DeleteData( url) {
    try {
        const response = await fetch(url, {
            method: "DELETE",
            credentials: "include",
        })

        // the body may be empty / not JSON on some errors
        const result = await response.json().catch(() => ({}))
        console.log("result = ",result)
        if (!response.ok) {
            throw new Error(
                result.message || `Request failed (${response.status})`
            )
        }
        return result
    } catch (error) {
        console.error("Request error:", error.message)
        throw error
    }
}

export default DeleteData