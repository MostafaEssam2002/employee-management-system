async function SubmitForm(event,url) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    try{
        const response = await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            credentials:"include",
            body:JSON.stringify(data)
        })
        const result = await response.json()
        if (!response.ok) {
            throw new Error(
                result.message || "Registration failed"
            );
        }
        if(result.token){
            console.log(result.token)
        }
    }catch(error){
        console.error("Registration error:", error.message);
    }
    return data
}
export default SubmitForm