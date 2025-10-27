"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchWithPatientAuth } from "@/utils/patientAuth";
import { PulseLoader } from "react-spinners";
const MedicineReminder = () => {
    const [schedule, setSchedule] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [activeTab, setActiveTab] = useState('today');
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [error, setError] = useState(null);

    const notifiedMedsRef = useRef(new Set());
    const intervalRef = useRef(null);

    // Load data function with proper error handling
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [scheduleRes, historyRes] = await Promise.all([
                fetchWithPatientAuth('/api/patients/medicines/schedule'),
                fetchWithPatientAuth('/api/patients/medicines/history?days=7')
            ]);

            const scheduleData = await scheduleRes.json();
            const historyData = await historyRes.json();

            if (!scheduleRes.ok || !historyRes.ok) {
                throw new Error('Failed to fetch medicine data');
            }

            if (scheduleData.success && Array.isArray(scheduleData.data)) {
                setSchedule(scheduleData.data);
            }

            if (historyData.success) {
                if (Array.isArray(historyData.data.history)) {
                    setHistory(historyData.data.history);
                }
                if (historyData.data.stats) {
                    setStats(historyData.data.stats);
                }
            }
        } catch (error) {
            console.error('Error loading medicine data:', error);
            setError('Unable to load medicine data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter medicines to show only current and future time slots
    const getFilteredSchedule = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();

        return schedule.filter(med => {
            if (!med.time_range) return true;

            const endHour = parseInt(med.time_range.end);
            return currentHour <= endHour;
        });
    }, [schedule]);

    // Check if medicine is in current time slot
    const isMedicineInCurrentTimeSlot = useCallback((med) => {
        if (!med.time_range) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(med.time_range.start);
        const endHour = parseInt(med.time_range.end);

        return currentHour >= startHour && currentHour <= endHour;
    }, []);

    // Check if medicine can be taken (time has arrived)
    const canTakeMedicine = useCallback((med) => {
        if (!med.time_range) return true;

        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(med.time_range.start);

        return currentHour >= startHour;
    }, []);

    // Check and show reminders
    const checkReminders = useCallback(() => {
        if (notificationPermission !== 'granted' || schedule.length === 0) return;

        const now = new Date();
        const REMINDER_WINDOW_MINUTES = 15;

        schedule.forEach(med => {
            try {
                const medTime = new Date(med.scheduled_time);
                const timeDiffMinutes = (medTime - now) / (1000 * 60);

                const medIdentifier = `${med.prescription_id}-${med.medicine_name}-${med.scheduled_time}`;

                if (
                    timeDiffMinutes > 0 &&
                    timeDiffMinutes <= REMINDER_WINDOW_MINUTES &&
                    !notifiedMedsRef.current.has(medIdentifier)
                ) {
                    showNotification(med);
                    notifiedMedsRef.current.add(medIdentifier);

                    const notifiedIds = Array.from(notifiedMedsRef.current);
                    localStorage.setItem('notifiedMeds', JSON.stringify(notifiedIds));
                }
            } catch (error) {
                console.error('Error processing reminder:', error);
            }
        });
    }, [schedule, notificationPermission]);

    // Show notification
    const showNotification = useCallback((med) => {
        try {
            const notification = new Notification('💊 Medicine Reminder', {
                body: `Time to take ${med.medicine_name}${med.dosage ? ` - ${med.dosage}` : ''}`,
                icon: '/medicine-icon.png',
                badge: '/medicine-badge.png',
                tag: `med-${med.prescription_id}-${med.medicine_name}`,
                requireInteraction: true,
                vibrate: [200, 100, 200],
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }, []);

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                alert('✅ Notifications enabled successfully!');
            } else if (permission === 'denied') {
                alert('❌ Notification permission denied. Please enable it in browser settings.');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            alert('Failed to request notification permission');
        }
    }, []);

    // Record medicine intake with optimistic updates
    const recordIntake = useCallback(async (med, status) => {
        const medKey = `${med.prescription_id}-${med.medicine_name}-${status}`;

        try {
            setActionLoading(prev => ({ ...prev, [medKey]: true }));

            const response = await fetchWithPatientAuth('/api/patients/medicines/intake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prescription_id: med.prescription_id,
                    medicine_name: med.medicine_name,
                    status,
                    recorded_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to record intake');
            }

            const data = await response.json();

            if (data.success) {
                setSchedule(prev => prev.filter(m =>
                    !(m.prescription_id === med.prescription_id &&
                        m.medicine_name === med.medicine_name &&
                        m.scheduled_time === med.scheduled_time)
                ));

                setHistory(prev => [{
                    medicine_name: med.medicine_name,
                    prescription_id: med.prescription_id,
                    scheduled_time: med.scheduled_time,
                    status,
                    recorded_at: new Date().toISOString(),
                }, ...prev]);

                if (stats) {
                    setStats(prev => ({
                        ...prev,
                        [status]: (prev[status] || 0) + 1,
                        pending: Math.max(0, (prev.pending || 0) - 1),
                        adherence_rate: calculateAdherenceRate(prev, status),
                    }));
                }
            }
        } catch (error) {
            console.error('Error recording intake:', error);
            alert(`❌ Failed to record medicine as ${status}. Please try again.`);
            loadData();
        } finally {
            setActionLoading(prev => ({ ...prev, [medKey]: false }));
        }
    }, [stats, loadData]);

    // Calculate adherence rate
    const calculateAdherenceRate = (currentStats, newStatus) => {
        const taken = (currentStats.taken || 0) + (newStatus === 'taken' ? 1 : 0);
        const total = taken + (currentStats.missed || 0) + (currentStats.skipped || 0) + (newStatus === 'skipped' ? 1 : 0);
        return total > 0 ? Math.round((taken / total) * 100) : 0;
    };

    // Initial load
    useEffect(() => {
        loadData();

        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        try {
            const stored = localStorage.getItem('notifiedMeds');
            if (stored) {
                notifiedMedsRef.current = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading notified meds:', error);
        }
    }, [loadData]);

    // Set up reminder interval
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        checkReminders();

        intervalRef.current = setInterval(() => {
            checkReminders();
        }, 60000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkReminders]);

    // Clear notified meds at midnight
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow - now;

        const midnightTimer = setTimeout(() => {
            notifiedMedsRef.current.clear();
            localStorage.removeItem('notifiedMeds');
            loadData();
        }, msUntilMidnight);

        return () => clearTimeout(midnightTimer);
    }, [loadData]);

    if (loading) {
        return (
            <div className="medicine-reminder-container" style={{ marginLeft: "500px" }}>
                <div className="loading">
                    <PulseLoader />
                    <p>Loading medicine schedule...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="medicine-reminder-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadData} className="retry-btn">
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    const filteredSchedule = getFilteredSchedule();

    return (
        <div className="medicine-reminder-container">
            <div className="header">
                <h2>💊 Medicine Reminder</h2>
                {notificationPermission !== 'granted' && (
                    <button onClick={requestNotificationPermission} className="notify-btn">
                        🔔 Enable Notifications
                    </button>
                )}
            </div>

            {/* Statistics Card */}
            {stats && (
                <div className="stats-card">
                    <div className="stat-item">
                        <span className="stat-value">{stats.adherence_rate || 0}%</span>
                        <span className="stat-label">Adherence Rate</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.taken || 0}</span>
                        <span className="stat-label">Taken</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.missed || 0}</span>
                        <span className="stat-label">Missed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.pending || 0}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={activeTab === 'today' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('today')}
                    aria-selected={activeTab === 'today'}
                    role="tab"
                >
                    Today's Schedule
                </button>
                <button
                    className={activeTab === 'history' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('history')}
                    aria-selected={activeTab === 'history'}
                    role="tab"
                >
                    History (7 Days)
                </button>
            </div>

            {/* Today's Schedule */}
            {activeTab === 'today' && (
                <div className="schedule-list" role="tabpanel">
                    {filteredSchedule.length === 0 ? (
                        <div className="no-data">
                            <span className="no-data-icon">✓</span>
                            <p>No medicines scheduled for remaining time today</p>
                        </div>
                    ) : (
                        filteredSchedule.map((med, index) => {
                            const medKey = `${med.prescription_id}-${med.medicine_name}-${med.scheduled_time || ''}-${index}`;
                            const actionKey = `${med.prescription_id}-${med.medicine_name}`;
                            const isTakingAction = actionLoading[`${actionKey}-taken`];
                            const isSkippingAction = actionLoading[`${actionKey}-skipped`];
                            const isInCurrentSlot = isMedicineInCurrentTimeSlot(med);
                            const canTake = canTakeMedicine(med);

                            return (
                                <div key={medKey} className={`medicine-card ${isInCurrentSlot ? 'current-slot' : ''} ${!canTake ? 'future-slot' : ''}`}>
                                    <div className="medicine-info">
                                        <div className="medicine-header">
                                            <span className="medicine-name">{med.medicine_name}</span>
                                            {isInCurrentSlot && (
                                                <span className="current-badge">Current Time</span>
                                            )}
                                            {!canTake && (
                                                <span className="future-badge">Scheduled for Later</span>
                                            )}
                                            {med.color && (
                                                <span
                                                    className="medicine-color"
                                                    style={{ backgroundColor: med.color }}
                                                    aria-label="Medicine color indicator"
                                                ></span>
                                            )}
                                        </div>
                                        {med.time_range && (
                                            <p className="medicine-time">
                                                ⏰ {med.time_range.start}:00 - {med.time_range.end}:00
                                            </p>
                                        )}
                                        {med.dosage && (
                                            <p className="medicine-dosage">💊 {med.dosage}</p>
                                        )}
                                        {med.instructions && (
                                            <p className="medicine-instructions">📝 {med.instructions}</p>
                                        )}
                                        <p className="medicine-doctor">
                                            👨‍⚕️ {med.doctor_name || 'N/A'} - {med.dept || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => recordIntake(med, 'taken')}
                                            className="btn-taken"
                                            disabled={!canTake || isTakingAction || isSkippingAction}
                                            aria-label={`Mark ${med.medicine_name} as taken`}
                                            title={!canTake ? 'Medicine time has not arrived yet' : ''}
                                        >
                                            {isTakingAction ? '⏳' : '✓'} Taken
                                        </button>
                                        <button
                                            onClick={() => recordIntake(med, 'skipped')}
                                            className="btn-skipped"
                                            disabled={!canTake || isTakingAction || isSkippingAction}
                                            aria-label={`Skip ${med.medicine_name}`}
                                            title={!canTake ? 'Medicine time has not arrived yet' : ''}
                                        >
                                            {isSkippingAction ? '⏳' : '⊗'} Skip
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
                <div className="history-list" role="tabpanel">
                    {history.length === 0 ? (
                        <div className="no-data">
                            <span className="no-data-icon">📋</span>
                            <p>No history available</p>
                        </div>
                    ) : (
                        history.map((intake, index) => {
                            const intakeDate = new Date(intake.scheduled_time);
                            const formattedDate = intakeDate.toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                            const formattedTime = intakeDate.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            const historyKey = `${intake.prescription_id || 'hist'}-${intake.medicine_name}-${intake.scheduled_time}-${intake.status}-${index}`;

                            return (
                                <div key={historyKey} className={`history-card ${intake.status}`}>
                                    <div className="history-info">
                                        <span className="history-medicine">{intake.medicine_name}</span>
                                        <span className="history-date">
                                            {formattedDate} at {formattedTime}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${intake.status}`}>
                                        {intake.status.toUpperCase()}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <style jsx>{`
        .medicine-reminder-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .notify-btn,
        .retry-btn {
          padding: 10px 15px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .notify-btn:hover,
        .retry-btn:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .notify-btn:active,
        .retry-btn:active {
          transform: translateY(0);
        }

        .stats-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.3s ease;
        }

        .tab:hover {
          color: #007bff;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          font-weight: 600;
        }

        .schedule-list,
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .medicine-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .medicine-card.current-slot {
          border: 2px solid #28a745;
          background: #f8fff9;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
        }

        .medicine-card.future-slot {
          background: #f9f9f9;
          opacity: 0.85;
        }

        .medicine-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .medicine-info {
          flex: 1;
        }

        .medicine-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .medicine-name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .current-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .future-badge {
          background: #6c757d;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .medicine-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #ddd;
          flex-shrink: 0;
        }

        .medicine-time,
        .medicine-dosage,
        .medicine-instructions,
        .medicine-doctor {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-taken,
        .btn-skipped {
          padding: 8px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .btn-taken:disabled,
        .btn-skipped:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #e0e0e0;
          color: #999;
        }

        .btn-taken:disabled:hover,
        .btn-skipped:disabled:hover {
          transform: none;
          box-shadow: none;
          background: #e0e0e0;
        }

        .btn-taken {
          background: #28a745;
          color: white;
        }

        .btn-taken:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .btn-skipped {
          background: #ffc107;
          color: #333;
        }

        .btn-skipped:hover:not(:disabled) {
          background: #e0a800;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
        }

        .history-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .history-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .history-card.missed {
          border-left: 4px solid #dc3545;
        }

        .history-card.taken {
          border-left: 4px solid #28a745;
        }

        .history-card.skipped {
          border-left: 4px solid #ffc107;
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .history-medicine {
          font-weight: 600;
          color: #333;
          font-size: 15px;
        }

        .history-date {
          font-size: 12px;
          color: #666;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.taken {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.missed {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.skipped {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.pending {
          background: #d1ecf1;
          color: #0c5460;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          color: #999;
          font-size: 16px;
        }

        .no-data-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 15px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          font-size: 16px;
          color: #666;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 40px 20px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          color: #856404;
        }

        .error-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 15px;
        }

        .error-message p {
          margin-bottom: 20px;
          font-size: 16px;
        }

        @media (max-width: 600px) {
          .medicine-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .action-buttons {
            width: 100%;
            margin-top: 15px;
          }

          .btn-taken,
          .btn-skipped {
            flex: 1;
          }

          .stats-card {
            grid-template-columns: repeat(2, 1fr);
          }

          .header h2 {
            font-size: 20px;
          }
        }
      `}</style>
        </div>
    );
};

export default MedicineReminder;
