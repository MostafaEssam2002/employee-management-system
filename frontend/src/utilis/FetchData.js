async function FetchData(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Request failed");
        }
        return result;
    } catch (error) {
        console.error("Fetch error:", error.message);
        throw error;
    }
}
export default FetchData;