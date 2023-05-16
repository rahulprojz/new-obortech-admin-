import "./FormHelperMessage.css";

const FormHelperMessage = ({ message, className, children }) => {
  return children ? (
    <small className={`helperText ${className}`}>{children}</small>
  ) : (
    <small className={`helperText ${className}`}>{message}</small>
  );
};

export default FormHelperMessage;
