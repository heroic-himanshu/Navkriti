import React from 'react'

const AppointmentCard = ({ patient }) => {
    return (
        <div className='appointment-card'>
            <div className='introPara'>
                <i className='fa-regular fa-user'></i>
                <div>
                    <h3>{patient.name}</h3>
                    <p className='text-light'>{patient.date}</p>
                </div>
            </div>
            <div className='detailsPara'>
                <div>
                    <i className="fa-solid fa-clock"></i>
                    {patient.med_history[patient.med_history.length - 1].problem}
                </div>
                <div>
                    <i className="fa-solid fa-user"></i>
                    {patient.med_history[patient.med_history.length - 1].doctor_name}
                </div>
                <div>
                    <i className="fa-solid fa-location-dot"></i>
                    {patient.med_history[patient.med_history.length - 1].dept}
                </div>
            </div>
        </div>
    )
}

export default AppointmentCard