// contexts/PusherContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import PusherJS from 'pusher-js';

const PusherContext = createContext(null);

export function PusherProvider({ children }) {
  const [pusher, setPusher] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize Pusher client
    const pusherInstance = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      enabledTransports: ['ws', 'wss'],
    });

    // Connection state listeners
    pusherInstance.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (err) => {
      console.error('Pusher connection error:', err);
    });

    pusherInstance.connection.bind('state_change', (states) => {
      console.log('Pusher state changed:', states.current);
    });

    setPusher(pusherInstance);

    // Cleanup on unmount
    return () => {
      console.log('Disconnecting Pusher...');
      pusherInstance.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusher, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
}
