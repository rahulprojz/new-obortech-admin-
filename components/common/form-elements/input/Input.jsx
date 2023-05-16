import React from "react";
import PropTypes from "prop-types";
import "./Input.css";

const Input = (props) => {
  const { onChange, className, id, name, value, type = "text" } = props;

  return (
    <input
      {...props}
      type={type}
      onChange={onChange ? onChange : null}
      className={`default-css ${className}`}
      id={id ? id : null}
      name={name ? name : null}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

export default Input;
