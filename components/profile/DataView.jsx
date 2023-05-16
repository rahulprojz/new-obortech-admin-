import React from 'react';
function DataView(props){
    return(
        <p className={props?.className || ''}>{props.heading}: <span>{props.caption}</span></p>
    )
}
export default DataView;