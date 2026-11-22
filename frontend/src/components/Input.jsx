const Input = ({ type, placeHolder, id, className ,name,disabled ,hidden,value,readOnly, ...rest }) => {
    return (
        
        <input name={name} type={type} placeholder={placeHolder} className={className} id={id} hidden={hidden} disabled={disabled} value={value} readOnly={readOnly} {...rest}/>
    );
};
export default Input;