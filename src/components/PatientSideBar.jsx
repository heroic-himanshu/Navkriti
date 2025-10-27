"use client"
import Link from 'next/link'
import React from 'react'

const PatientSideBar = ({ active }) => {
    const toggleSideBar = () => {
        const sideBar = document.getElementById("sidebar");
        if (sideBar.style.width == "100vw") {
            sideBar.style.width = "0px";
            sideBar.style.background = "white";
            Array.from(sideBar.childNodes).forEach((child) => {
                child.style.display = "none";
            });

        }
        else {
            sideBar.style.width = "100vw";
            sideBar.style.background = "#f5f5f5";
            Array.from(sideBar.childNodes).forEach((child) => {
                child.style.display = "block";
            });
        }
    }
    const links = [
        {
            href: "/patient/home",
            iconClass: "fa-home",
            label: "Home",
        },
        {
            href: "/patient/medicines",
            iconClass: "fa-solid fa-capsules",
            label: "Medicines",
        },
        {
            href: "/patient/checkups",
            iconClass: "fa-calendar-minus",
            label: "Checkups",
        },{
            href: "/patient/sos",
            iconClass: "fa-solid fa-triangle-exclamation",
            label: "SOS",
        }
    ]
    return (
        <>
            <aside className='sidebar show-aside' id='sidebar'>
                {links.map((link, index) => (
                    link.label.toLowerCase() !== active ?
                        <Link href={link.href} key={index}><i className={"fa-regular " + link.iconClass}></i>{link.label}</Link> : <Link href={link.href} key={index} className='active'><i className={"fa-regular " + link.iconClass}></i>{link.label}</Link>
                ))}
            </aside>
            <button className='menu' id="menu" onClick={toggleSideBar}>
                <div></div>
                <div></div>
                <div></div>
            </button>
        </>
    )
}



export default PatientSideBar