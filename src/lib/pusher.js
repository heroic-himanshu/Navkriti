// lib/pusher.js
import Pusher from 'pusher';

// Debug: Log environment variables
console.log('=== Pusher Server Configuration ===');
console.log('PUSHER_APP_ID:', process.env.PUSHER_APP_ID || '❌ UNDEFINED');
console.log('PUSHER_APP_KEY:', process.env.PUSHER_APP_KEY || '❌ UNDEFINED');
console.log('PUSHER_APP_SECRET:', process.env.PUSHER_APP_SECRET || '❌ UNDEFINED');
console.log('PUSHER_APP_CLUSTER:', process.env.PUSHER_APP_CLUSTER || '❌ UNDEFINED');

// Validate environment variables before creating instance
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_APP_KEY || !process.env.PUSHER_APP_SECRET) {
  throw new Error('Missing Pusher environment variables! Check your .env.local file.');
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER || 'ap2',
  useTLS: true,
});

console.log('✅ Pusher server initialized successfully');

// Helper functions to trigger events
export async function triggerNewAlert(alertData) {
  try {
    console.log('📡 Triggering Pusher event: admin-alerts/new-alert');
    
    const result = await pusherServer.trigger('admin-alerts', 'new-alert', alertData);
    
    console.log('✅ Alert triggered successfully on Pusher');
    console.log('Pusher response:', result);
    return true;
  } catch (error) {
    console.error('❌ Error triggering alert on Pusher:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
}

export async function triggerAlertUpdate(alertData) {
  try {
    await pusherServer.trigger('admin-alerts', 'alert-update', alertData);
    console.log('✅ Alert update triggered on Pusher');
    return true;
  } catch (error) {
    console.error('❌ Error triggering alert update:', error);
    return false;
  }
}

export async function triggerAlertDismiss(alertId) {
  try {
    await pusherServer.trigger('admin-alerts', 'alert-dismiss', { alertId });
    console.log('✅ Alert dismiss triggered on Pusher');
    return true;
  } catch (error) {
    console.error('❌ Error triggering alert dismiss:', error);
    return false;
  }
}
