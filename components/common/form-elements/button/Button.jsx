import React from "react";
import PropTypes from "prop-types";
import "./Button.css";

const Button = (props) => {
    const { children, className } = props;

    return (
        <button {...props} className={`default-css ${className}`}>
            {children}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    type: PropTypes.string,
    onClick: PropTypes.func,
};

export default Button;
