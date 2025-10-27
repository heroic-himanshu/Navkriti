import React from 'react'

const SOSBtn = ({ handleMouseDown, handleMouseUp, handleTouchStart, handleTouchEnd, handleClick, disabled, message }) => {
    return (
        <button className='sos-btn' onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
            disabled={disabled}>

            <h1>{message}</h1>
        </button>
    )
}

export default SOSBtn