
import Link from 'next/link'
import React from 'react'
import DarkModeToggle from './DarkModeToggle'

const Header = () => {
    return (
        <header>
            <div className="logo">
                <Link href={"/"}>
                    <i className="fa-regular fa-heart logo-icon"></i>
                    <h1>NavKriti</h1>
                </Link>
                <p>Smart Elder Care Companion</p>
            </div>
            <nav>
                <ul>
                    <li>
                        <DarkModeToggle />
                    </li>
                </ul>
            </nav>
        </header>
    )
}

export default Header