import PatientSideBar from '@/components/PatientSideBar'
import Patient from '@/models/patient'
import React from 'react'

const SOS = () => {
  return (
    <div>
        <PatientSideBar active="sos"/>
        <div className="container">
            <h1>SOS Page</h1>
            <p>This is the SOS page for patients. Here you can send an emergency alert to your designated contacts and healthcare providers.</p>
            <button className="sos-button">Send SOS Alert</button>
        </div>
    </div>
  )
}

export default SOS