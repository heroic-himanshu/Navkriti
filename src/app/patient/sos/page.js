// app/patient/sos/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSideBar from '@/components/PatientSideBar';
import { Phone, Clock, Activity } from 'lucide-react';

export default function SOSFirstAidPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sosData, setSOSData] = useState(null);
  const [firstAid, setFirstAid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSOSData();
  }, []);

  const loadSOSData = async () => {
    try {
      const storedData = sessionStorage.getItem('sosAlertData');
      
      if (!storedData) {
        setError('No SOS alert data found');
        setLoading(false);
        return;
      }

      const data = JSON.parse(storedData);
      setSOSData(data);

      await fetchFirstAid(data.transcription);

    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFirstAid = async (transcription) => {
    try {
      const response = await fetch('/api/alerts/sos/first-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setFirstAid(data.firstAid);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch first aid instructions');
      setLoading(false);
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertColorLight = (alertType) => {
    switch (alertType) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      case 'low': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const getAlertColorDark = (alertType) => {
    switch (alertType) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#4b5563';
    }
  };

  if (loading) {
    return (
      <>
        <PatientSideBar active="SOS" />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          padding: '20px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '18px' }}>
            Getting emergency first aid instructions...
          </p>
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PatientSideBar active="home" />
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: '#fee', 
            border: '2px solid #fcc', 
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h2 style={{ color: '#c33', marginBottom: '10px' }}>Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push('/patient/home')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const alertColor = getAlertColor(sosData?.alertType);
  const alertColorLight = getAlertColorLight(sosData?.alertType);
  const alertColorDark = getAlertColorDark(sosData?.alertType);

  return (
    <>
      <PatientSideBar active="home" />
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', marginBottom: '100px' }}>
        <div style={{ 
          background: `linear-gradient(135deg, ${alertColor} 0%, ${alertColorDark} 100%)`,
          borderRadius: '15px',
          padding: '25px',
          color: 'white',
          marginBottom: '25px',
          boxShadow: `0 4px 6px ${alertColor}4d`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ fontSize: '40px' }}>🚨</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Emergency Response Active</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                Help is on the way • Follow these instructions
              </p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              padding: '10px 15px', 
              borderRadius: '8px',
              flex: '1',
              minWidth: '150px',
              border: `2px solid rgba(255, 255, 255, 0.3)`
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Alert Level</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {sosData?.alertType || 'MEDIUM'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              padding: '10px 15px', 
              borderRadius: '8px',
              flex: '1',
              minWidth: '150px'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Time</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {sosData?.timestamp ? new Date(sosData.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: alertColorLight,
          border: `2px solid ${alertColor}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: alertColorDark, 
            fontSize: '18px', 
            fontWeight: 'bold' 
          }}>
            ⚠️ If Condition Worsens
          </h3>
          <a
            href="tel:102"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '18px',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Phone style={{ width: '24px', height: '24px' }} />
            Call 102 Immediately
          </a>
        </div>

        {firstAid && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '25px',
            borderLeft: `4px solid ${alertColor}`
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: 'bold', color: '#111' }}>
              🏥 AI-Generated First Aid Instructions
            </h2>
            
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.8',
              color: '#374151',
              fontSize: '16px'
            }}>
              {firstAid}
            </div>
          </div>
        )}

        {sosData?.transcription && (
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            borderLeft: `4px solid ${alertColor}`
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#374151' }}>
              Your Emergency Message:
            </h3>
            <p style={{ 
              margin: 0, 
              fontStyle: 'italic', 
              color: '#6b7280',
              fontSize: '15px',
              lineHeight: '1.6'
            }}>
              &quot;{sosData.transcription}&quot;
            </p>
          </div>
        )}

        <button
          onClick={() => {
            sessionStorage.removeItem('sosAlertData');
            router.push('/patient/home');
          }}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    </>
  );
}
