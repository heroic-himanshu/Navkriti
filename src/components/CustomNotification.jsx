// components/CustomNotification.jsx
'use client';

import { useEffect } from 'react';
import { BellRing, X, MapPin, Clock, Phone, User } from 'lucide-react';

export default function CustomNotification({ alert, onClose, onViewDetails }) {
  // Play custom sound based on alert type
  useEffect(() => {
    if (!alert) return;

    const soundMap = {
      high: '/sounds/high-alert.mp3',
      medium: '/sounds/medium-alert.mp3',
      low: '/sounds/low-alert.mp3',
    };

    const soundFile = soundMap[alert.alert_type] || soundMap.medium;
    
    const audio = new Audio(soundFile);
    audio.volume = 0.8;
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
    });

    if ('vibrate' in navigator) {
      if (alert.alert_type === 'high') {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } else {
        navigator.vibrate(200);
      }
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [alert]);

  if (!alert) return null;

  // Helper function to format location - FIX FOR THE ERROR
  const formatLocation = (location) => {
    if (!location) return null;
    
    // If location is an object with latitude/longitude
    if (typeof location === 'object' && location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    
    // If location is already a string
    if (typeof location === 'string') {
      return location;
    }
    
    return null;
  };

  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-orange-500 bg-orange-50',
    low: 'border-yellow-500 bg-yellow-50',
  };

  const priorityBadgeColors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-yellow-500 text-white',
  };

  const formattedLocation = formatLocation(alert.sos_location);

  return (
    <div className={`z-50 w-96 bg-white rounded-lg shadow-2xl border-l-4 animate-slide-in ${priorityColors[alert.alert_type]} custom-notification`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-black p-4 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-6 h-6 animate-bounce" />
            <div>
              <h3 className="text-lg font-bold">🚨 EMERGENCY ALERT</h3>
              <p className="text-xs text-red-100">SOS Button Activated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-red-700 rounded-full p-1 transition-colors border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Priority Badge */}
        <div className="flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityBadgeColors[alert.alert_type]}`}>
            {alert.alert_type.toUpperCase()} PRIORITY
          </span>
          <span className="text-xs text-gray-500">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(alert.created_at).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Patient Name</p>
              <p className="text-sm font-semibold text-gray-900">{alert.patient_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">
                  {alert.patient_age}y
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Age</p>
                <p className="text-sm font-semibold">{alert.patient_age} years</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-semibold">{alert.patient_phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transcription */}
        {alert.sos_transcription && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1 font-semibold">Voice Transcription:</p>
            <p className="text-sm text-gray-800 italic">"{alert.sos_transcription}"</p>
          </div>
        )}

        {/* Location - FIXED */}
        {formattedLocation && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Location</p>
              <p className="text-sm text-gray-800">{formattedLocation}</p>
              {typeof alert.sos_location === 'object' && alert.sos_location.latitude && (
                <a
                  href={`https://www.google.com/maps?q=${alert.sos_location.latitude},${alert.sos_location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open in Maps →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Audio Duration */}
        {alert.sos_duration && (
          <div className="text-xs text-gray-600">
            Recording Duration: <span className="font-semibold">{alert.sos_duration}s</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 rounded-b-lg flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 font-semibold shadow-lg"
        >
          View Full Details
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
