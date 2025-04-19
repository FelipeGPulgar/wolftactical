import React, { useState } from 'react';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Producto actualizado: Chaleco Táctico', type: 'success' },
    { id: 2, message: 'Error al eliminar producto', type: 'error' },
    { id: 3, message: 'Nuevo producto agregado: Casco Balístico', type: 'info' },
  ]);
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);

  const toggleNotificationCenter = () => {
    setNotificationCenterOpen(!isNotificationCenterOpen);
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  return (
    <div className="admin-navbar">
      <div className="admin-navbar-content">
        <div className="notification-bell" onClick={toggleNotificationCenter}>
          <img
            src="/Images/notification-bell-inactive.svg"
            alt="Notification Bell"
          />
        </div>
      </div>

      {isNotificationCenterOpen && (
        <div className="notification-overlay" onClick={toggleNotificationCenter}></div>
      )}

      {isNotificationCenterOpen && (
        <div className="notification-center">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <button className="close-button" onClick={toggleNotificationCenter}>X</button>
          </div>
          {notifications.length === 0 ? (
            <p>No hay notificaciones</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={`notification notification-${notification.type}`}>
                <span>{notification.message}</span>
                <button
                  className="delete-button"
                  onClick={() => deleteNotification(notification.id)}
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNavbar;