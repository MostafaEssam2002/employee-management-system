const Button = ({type,text,id,className}) => {
    return (
        <button type={type} id={id} className={className}>{text}</button>
    )
}

export default Button