import { useState } from 'react';
import './NotificationManager.css';

const useNotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState(null);

  const addNotification = (message, type, duration = 5000) => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      createdAt: new Date(),
      duration
    };

    setNotifications(prev => [newNotification, ...prev]);

    if (duration > 0) {
      setTimeout(() => {
        deleteNotification(id);
      }, duration);
    }
  };

  const deleteNotificationFromDB = async (id) => {
    try {
      const response = await fetch(`http://localhost/schizotactical/backend/eliminar_notificacion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la notificación en la base de datos');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error desconocido al eliminar la notificación');
      }

      console.log(`Notificación con ID ${id} eliminada del backend con éxito.`);
    } catch (error) {
      console.error('Error al eliminar la notificación:', error);
    }
  };

  const deleteNotification = (id) => {
    console.log(`Intentando eliminar notificación con ID: ${id}`); // Log para depuración

    // Verificar si la notificación existe en el estado actual
    const notificationExists = notifications.some((notification) => notification.id === id);
    if (!notificationExists) {
      console.warn(`La notificación con ID ${id} no existe en el estado actual.`);
      return;
    }

    // Eliminar del frontend
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));

    // Intentar eliminar del backend
    deleteNotificationFromDB(id)
      .then(() => {
        console.log(`Notificación con ID ${id} eliminada del backend con éxito.`);
      })
      .catch((error) => {
        console.error(`Error al eliminar la notificación con ID ${id} del backend:`, error);
      });
  };

  const toggleNotificationPanel = () => {
    setIsPanelOpen(prev => !prev);
  };

  return {
    notifications,
    isPanelOpen,
    error,
    addNotification,
    deleteNotification,
    toggleNotificationPanel,
    clearError: () => setError(null)
  };
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

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
    }
  };

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
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification notification-${notification.type}`}
              >
                <div className="notification-content">
                  <span>{notification.message}</span>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(notification.id)}
                  aria-label="Eliminar notificación"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default useNotificationManager;
export { NotificationPanel };
