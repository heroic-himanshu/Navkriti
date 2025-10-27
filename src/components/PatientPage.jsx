"use client"
import Image from 'next/image'
import React from 'react'

const PatientPage = ({ patient }) => {
    
  return (
    <div>
        <section className='patientBasics'>
            <div>

                  {/* <div>
                      <Image src={patient.avatar || "/default-avatar.jpg"} alt="Patient Avatar" width={150} height={150} />
                  </div> */}
                  <div className='patientInfo'>
                      <h3>{patient.name}</h3>
                      <p><strong>Age:</strong> {patient.age}</p>
                      <p><strong>Gender:</strong> {patient.sex}</p>
                      <p><strong>Phone Number:</strong> {patient.ph_number}</p>
                  </div>
            </div>
            <div>
                <button>Edit Patient Info</button>
                <button>Contact Patient</button>
            </div>
           
        </section>

          <section className='medicineIntake'>
              <h2>Medicine Schedule</h2>
              <section className='medicalScheduleCards'>
                  {patient.medicine_intakes.length === 0 ? <p>No medicine schedule available.</p> :
                      patient.medicine_intakes.map((element,index) => {
                          return (<div key={index} className={'medicineCard ' + (element.status.toLowerCase() === 'skipped' || element.status.toLowerCase() == "missed" ? 'high-risk-card' : element.status.toLowerCase() === 'taken' ? 'low-risk-card' : "")}>
                              <h3>{element.medicine_name}</h3>
                              <p><strong>Status:</strong> {element.status}</p>
                              <p><strong>Scheduled time : </strong>{element.scheduled_time.split("T")[1].substr(0,5)} am/pm</p>
                          </div>)
                      })
                  }


              </section>
          </section>

        <section className='recentActivity'>
            <h2>Recent Acitivity</h2>
            <section className='activityCards'>
                {patient.med_history.length === 0 ? <p>No medical history available.</p> :
                 patient.med_history.map((element,index) => {
                     return (<div key={index} className={'activityCard ' + (element.alert_type.toLowerCase() === 'high' ? 'high-risk-card' : element.alert_type.toLowerCase() === 'medium' ? 'medium-risk-card' : 'low-risk-card')}>
                         <h3>{element.problem}</h3>
                         <p><strong>Doctor:</strong> {element.doctor_name}</p>
                         <p><strong>Visit Date:</strong> {element.visit_date.split('T')[0]}</p>
                         <p><strong>Department:</strong> {element.dept}</p>
                     </div>)
                 })
                }

                  
            </section>
        </section>
    </div>
  )
}

export default PatientPage