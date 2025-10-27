import PatientSideBar from '@/components/PatientSideBar'
import SOSCard from '@/components/SOSCard'
import Patient from '@/models/patient'
import React from 'react'

const SOS = () => {
  return (
    <div>
        <PatientSideBar active="sos"/>
        <div className="container">
            <SOSCard />
        </div>
    </div>
  )
}

export default SOS