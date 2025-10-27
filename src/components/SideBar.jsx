"use client"
import Link from 'next/link'
import React from 'react'

const SideBar = ({ active }) => {
    const toggleSideBar = () => {
        const sideBar = document.getElementById("sidebar");
        if (sideBar.style.width == "100vw") {
            sideBar.style.width = "0px";
            Array.from(sideBar.childNodes).forEach((child) => {
                child.style.display = "none";
            });
        }
        else {
            sideBar.style.width = "100vw";
            Array.from(sideBar.childNodes).forEach((child) => {
                child.style.display = "block";
            });
        }
    }
    const links = [
        {
            href: "/hospital/dashboard",
            iconClass: "fa-window-maximize",
            label: "Dashboard",
        },
        {
            href: "/hospital/patients",
            iconClass: "fa-user",
            label: "Patients",
        },
        {
            href: "/hospital/alerts",
            iconClass: "fa-clock",
            label: "Alerts",
        },
        {
            href: "/hospital/appointments",
            iconClass: "fa-calendar",
            label: "Appointments",
        },
        {
            href: "/hospital/add-patient",
            iconClass: "fa-plus",
            label: "Add Patient"
        }
    ]
    return (
        <>
            <aside className='sidebar' id='sidebar'>
                {
                    links.map((link, index) => (
                        link.label.toLowerCase() !== active ?
                            <Link href={link.href} key={index}><i className={"fa-regular " + link.iconClass}></i>{link.label}</Link> : <Link href={link.href} key={index} className='active'><i className={"fa-regular " + link.iconClass}></i>{link.label}</Link>
                    ))
                }
            </aside>
            <button className='menu' id="menu" onClick={toggleSideBar}>
                <div></div>
                <div></div>
                <div></div>
            </button>
        </>

    )
}



export default SideBar