"use client"
import PatientSideBar from '@/components/PatientSideBar'
import SideBar from '@/components/SideBar'
import { usePathname } from 'next/navigation'
import React from 'react'

const NotFound = () => {
    const pathname = usePathname()
    console.log(pathname.split("/"));

    return (
        <div>
            {pathname.split("/")[1] == "patient" ? <PatientSideBar /> : pathname.split("/")[1] == "hospital" ? <SideBar /> : ""}
            <div className="container">
                <h1>Following page does not exist!</h1>
            </div>
        </div>
    )
}

export default NotFound;