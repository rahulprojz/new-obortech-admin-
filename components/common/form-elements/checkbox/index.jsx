import React from "react";
import PropTypes from "prop-types";
import "./Checkbox.css";

const Checkbox = (props) => {
	const { onChange, className, id, name } = props;
	return (
		<input
			{...props}
			type="checkbox"
			onChange={onChange ? onChange : null}
			className={`default-css ${className}`}
			id={id ? id : null}
			name={name ? name : null}
		/>
	);
};

Checkbox.propTypes = {
	type: PropTypes.string,
	onChange: PropTypes.func,
	className: PropTypes.string,
	id: PropTypes.string,
	name: PropTypes.string,
	placeholder: PropTypes.string,
	value: PropTypes.string,
};

export default Checkbox;
