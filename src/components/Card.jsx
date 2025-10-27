import React from 'react'

const Card = (props) => {
    return (
        <div className='card'>
            <div style={{ background: props.backgroundColor }}>
                <i className={'fa-regular ' + props.iconClass} style={{ color: props.iconColor }}></i>
            </div>
            <h2>{props.title}</h2>
            <p>{props.description}</p>
        </div>
    )
}

export default Card