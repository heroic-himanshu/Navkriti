// app/patient/sos/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSideBar from '@/components/PatientSideBar';
import { fetchWithProgress } from '@/lib/fetchWithProgess';
import { AlertTriangle, Phone, MapPin, Clock, Loader, CheckCircle, Activity } from 'lucide-react';

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
      // Get SOS data from session storage
      const storedData = sessionStorage.getItem('sosAlertData');
      
      if (!storedData) {
        setError('No SOS alert data found');
        setLoading(false);
        return;
      }

      const data = JSON.parse(storedData);
      setSOSData(data);

      // Fetch first aid from OpenAI
      await fetchFirstAid(data.transcription, data.alertType);

    } catch (error) {
      console.error('Error loading SOS data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFirstAid = async (transcription, alertType) => {
    try {
      const response = await fetchWithProgress('/api/first-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription, alertType }),
      });

      const data = await response.json();
      setFirstAid(data.firstAid);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching first aid:', error);
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

  if (loading) {
    return (
      <>
        <PatientSideBar active="home" />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          padding: '20px'
        }}>
          <Loader style={{ width: '48px', height: '48px', color: '#ef4444', animation: 'spin 1s linear infinite' }} />
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
            <AlertTriangle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 15px' }} />
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

  return (
    <>
      <PatientSideBar active="home" />
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', marginBottom: '100px' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '15px',
          padding: '25px',
          color: 'white',
          marginBottom: '25px',
          boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <AlertTriangle style={{ width: '40px', height: '40px' }} />
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
              minWidth: '150px'
            }}>
              <Activity style={{ width: '18px', height: '18px', marginBottom: '5px' }} />
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
              <Clock style={{ width: '18px', height: '18px', marginBottom: '5px' }} />
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Time</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {sosData?.timestamp ? new Date(sosData.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#92400e', fontSize: '18px', fontWeight: 'bold' }}>
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

        {/* First Aid Instructions */}
        {firstAid && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '25px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CheckCircle style={{ width: '28px', height: '28px', color: '#10b981' }} />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#111' }}>
                AI-Generated First Aid Instructions
              </h2>
            </div>
            
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

        {/* Transcription */}
        {sosData?.transcription && (
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
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
              "{sosData.transcription}"
            </p>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => {
            sessionStorage.removeItem('sosAlertData');
            router.push('/patient/dashboard');
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
          Back to Dashboard
        </button>
      </div>
    </>
  );
}
