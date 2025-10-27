import React from 'react'


const SOSCard = () => {
    const data = { "id": { "$oid": "68ffab7fbb733ec9d285f548" }, "alert_id": "ALERT-20251022-F2D2", "alert_type": "high", "category": "medication", "patient_id": { "$oid": "68f724b010ca83ba99d454ec" }, "patient_name": "Devansh", "patient_phone": { "$numberDouble": "7900339430.0" }, "consecutive_missed": { "$numberInt": "15" }, "total_missed": { "$numberInt": "0" }, "ai_risk_factors": [], "ai_recommendations": ["Take bath in hot water"], "status": "resolved", "priority": { "$numberInt": "3" }, "createdAt": { "$date": { "$numberLong": "1761126534332" } }, "updatedAt": { "$date": { "$numberLong": "1761153294851" } }, "_v": { "$numberInt": "0" } };
    const riskClass =
        data.alert_type === "high"
            ? "sos-card-high-risk"
            : data.alert_type === "medium"
            ? "sos-card-medium-risk"
            : "sos-card-low-risk";

    console.log(`sos-card ${riskClass}`);
    
    return (
        <div className={`sos-card ${riskClass}`} >
            <p>Type: {data.alert_type}</p>
            <p>Category: {data.category}</p>
            <p>Patient: {data.patient_name}</p>
            <p>Status: {data.status}</p>
            <p>AI recommendations : {data.ai_recommendations?.[0] ?? "—"}</p>
        </div>
    )
}

export default SOSCard