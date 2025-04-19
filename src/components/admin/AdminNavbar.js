import React from 'react';
import './AdminNavbar.css';
import notificationBellInactive from '../../Images/notification-bell-inactive.svg';
import notificationBellActive from '../../Images/notification-bell-active.svg';

function AdminNavbar({ notifications = [], isNotificationBellActive = false, removeNotification }) {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-content">
        <div className="notification-bell">
          <img
            src={isNotificationBellActive ? notificationBellActive : notificationBellInactive}
            alt="Notification Bell"
          />
          {notifications.length > 0 && (
            <div className="notification-list">
              {notifications.map(notification => (
                <div key={notification.id} className={`notification ${notification.type === 'success' ? 'notification-success' : 'notification-error'}`}>
                  {notification.message}
                  <button className="close-button" onClick={() => removeNotification(notification.id)}>x</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;