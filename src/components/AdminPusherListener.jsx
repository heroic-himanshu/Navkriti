// components/AdminPusherListener.jsx
'use client';

import { useEffect, useState } from 'react';
import { usePusher } from '@/contexts/PusherContext';
import { Wifi, WifiOff } from 'lucide-react';
import CustomNotification from './CustomNotification';

export default function AdminPusherListener() {
  const { pusher, isConnected } = usePusher();
  const [latestAlert, setLatestAlert] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!pusher) return;

    const channel = pusher.subscribe('admin-alerts');

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to admin-alerts');
    });

    channel.bind('new-alert', (data) => {
      console.log('🚨 New alert received:', data.alert_id);
      
      setLatestAlert(data);
      setShowNotification(true);
      console.log('Latest alert set:', data);
      if (window.updateAlertList?.addAlert) {
        window.updateAlertList.addAlert(data);
      }

      setTimeout(() => setShowNotification(false), 15000);
    });

    channel.bind('alert-update', (data) => {
      if (window.updateAlertList?.updateAlert) {
        window.updateAlertList.updateAlert(data);
      }
    });

    channel.bind('alert-dismiss', (data) => {
      if (latestAlert && latestAlert._id === data.alertId) {
        setShowNotification(false);
      }
      
      if (window.updateAlertList?.removeAlert) {
        window.updateAlertList.removeAlert(data.alertId);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-alerts');
    };
  }, [pusher, latestAlert]);

  const handleViewDetails = () => {
    if (latestAlert) {
      window.location.href = `/admin/alerts/${latestAlert._id}`;
    }
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <div style={{
    position: "fixed",
    top: "40px",
    left: "250px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "white",
    padding: "0.5rem 0.75rem",
    borderRadius: "3rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  }}>
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-semibold">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-sm text-red-600">Connecting...</span>
          </>
        )}
      </div>

      {/* Custom Notification Popup */}
      {showNotification && latestAlert && (
        <CustomNotification
          alert={latestAlert}
          onClose={() => setShowNotification(false)}
          onViewDetails={handleViewDetails}
        />
      )}
    </>
  );
}
