function SubmitForm(event) {
    // event.preventDefault();
    const formData = new FormData(event.target);
    let keys = [...formData.keys()];
    const data={};
    keys.forEach(key => {
        data[key]=formData.get(key)
    });
    console.log(data)
    return data
}
export default SubmitForm