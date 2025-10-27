import React from 'react'

const ResolvedAlertCard = ({ className, iconClassName, patient_name, message, time }) => {
    return (
        <div className={'alert-card ' + className}>
            <div>
                <div>
                    <i className={"fa-solid " + iconClassName}></i>
                </div>
                <div>
                    <h3>{patient_name}</h3>
                    <p className='txt-light'>{message}</p>
                    <p className='txt-light'>{time} ago</p>
                </div>
            </div>
            <div>
            </div>
        </div>
    )
}

export default ResolvedAlertCard