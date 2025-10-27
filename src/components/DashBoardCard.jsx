import React from 'react'

const DashBoardCard = (props) => {
    return (
        <div className='dashboard-card'>
            <p>{props.title} <i className={'fa-regular ' + props.iconClass}></i></p>
            <h3 style={{ color: props.color ? props.color : "black" }}>{props.count}</h3>
            <p>
                {props.lastPara}
            </p>
        </div>
    )
}

export default DashBoardCard