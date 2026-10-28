// Sends the form as JSON. Resolves with the parsed response,
// throws an Error (with a readable message) when the request fails.
async function SubmitForm(event, url) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    // FormData always yields strings: convert <input type="number"> fields back to numbers
    for (const el of form.elements) {
        if (el.name && el.type === "number" && el.value !== "") {
            data[el.name] = Number(el.value)
        }
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        })

        // the body may be empty / not JSON on some errors
        const result = await response.json().catch(() => ({}))

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

export default SubmitForm