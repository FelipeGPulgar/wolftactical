import React, { useState, useEffect, useMemo } from 'react';
import './NotificationManager.css';

// Added a default empty object for props to prevent undefined errors
const NotificationManager = (props = {}) => {
  const notifications = useMemo(() => props.notifications || [], [props.notifications]);
  const [localNotifications, setNotifications] = useState(notifications);

  // Re-added the 'refreshNotifications' function to fix the runtime error
  const refreshNotifications = async () => {
    try {
      const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error fetching notifications');
      }
      const data = await response.json();
      setNotifications(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNotifications(notifications);
  }, [notifications]);

  return (
    <div className="notification-container">
      {localNotifications.length === 0 ? (
        <p className="no-notifications">No hay notificaciones</p>
      ) : (
        <table className="notification-table">
          <thead>
            <tr>
              <th>Mensaje</th>
              <th>Tipo</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {localNotifications.map((notification) => (
              <tr key={notification.id}>
                <td>{notification.message}</td>
                <td>{notification.type}</td>
                <td>{new Date(notification.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const fetchNotifications = async () => {
  try {
    const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Error fetching notifications');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

const NotificationPanel = ({
  notifications,
  deleteNotification,
  isOpen,
  onClose,
  error,
  clearError
}) => {
  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notificaciones ({notifications.length})</h3>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        
        {error && (
          <div className="notification-error">
            {error}
            <button onClick={clearError}>×</button>
          </div>
        )}
        
        <div className="notifications-container">
          {notifications.length === 0 ? (
            <p className="no-notifications">No hay notificaciones</p>
          ) : (
            <table className="notification-table">
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.message}</td>
                    <td>{notification.type}</td>
                    <td>{new Date(notification.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// Added a custom hook to export refreshNotifications
export const useNotificationManager = () => {
  const refreshNotifications = async () => {
    try {
      const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error fetching notifications');
      }
      const data = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      return [];
    }
  };

  // Simplified `addNotification` to only send `message` and `type` fields
  const addNotification = async (message, type) => {
    try {
      const response = await fetch('http://localhost/schizotactical/backend/guardar_notificacion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return { refreshNotifications, addNotification };
};

export default NotificationManager;
export { NotificationPanel, fetchNotifications };
