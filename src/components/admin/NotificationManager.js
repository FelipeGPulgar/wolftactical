import React, { useState, useEffect, useMemo } from 'react';
import './NotificationManager.css'; // Asegúrate que este archivo CSS exista y contenga los estilos

// --- Componente Panel Lateral (Usado por AdminNavbar) ---
// Recibe todo como props desde el componente que lo usa (AdminNavbar)
const NotificationPanel = ({
  notifications = [], // Lista de notificaciones
  deleteNotification, // Función para eliminar una notificación
  isOpen,             // Booleano para indicar si el panel está abierto
  onClose,            // Función para cerrar el panel
  error,              // Mensaje de error (si lo hay)
  clearError          // Función opcional para limpiar el error
}) => {
  // No renderiza nada si no está abierto
  if (!isOpen) return null;

  // Función para formatear la fecha (puedes ajustarla)
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha inválida';
    try {
      // Intenta crear una fecha; si falla, devuelve un mensaje
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleString('es-ES', { // Formato local español
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Error formateando fecha:", dateString, e);
      return 'Fecha inválida';
    }
  };


  return (
    // Overlay oscuro para cerrar al hacer clic fuera
    <div className="notification-overlay" onClick={onClose}>
      {/* Contenedor principal del panel, detiene la propagación para no cerrar al hacer clic dentro */}
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        {/* Cabecera del panel */}
        <div className="notification-header">
          <h3>Notificaciones ({notifications.length})</h3>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Muestra un mensaje de error si existe */}
        {error && (
          // Usamos la estructura de una notificación para mostrar el error
          <div className="notification notification-error">
            <div className="notification-content">
              <span className="notification-message">{error}</span>
            </div>
            {/* Botón opcional para limpiar el error si se proporciona la función */}
            {clearError && (
              <button
                className="delete-button" // Reutilizamos estilo del botón eliminar
                onClick={clearError}
                aria-label="Descartar error"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Contenedor de la lista de notificaciones */}
        <div className="notifications-container">
          {notifications.length === 0 && !error ? (
            // Mensaje si no hay notificaciones y no hay error
            <p className="no-notifications">No hay notificaciones</p>
          ) : (
            // Lista de notificaciones
            // Usaremos una lista <ul> simple aquí, pero podrías cambiarla por la tabla si prefieres
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map((notification) => (
                <li key={notification.id} className={`notification notification-${notification.type || 'info'}`}>
                  {/* Contenido de la notificación (mensaje y hora) */}
                  <div className="notification-content">
                    <span className="notification-message">{notification.message}</span>
                    {/* Asegúrate que 'created_at' exista en tus datos */}
                    <span className="notification-time">{formatDateTime(notification.created_at)}</span>
                  </div>
                  {/* Botón para eliminar (si se proporciona la función) */}
                  {deleteNotification && (
                    <button
                      className="delete-button"
                      onClick={() => deleteNotification(notification.id)}
                      aria-label="Eliminar notificación"
                    >
                      × {/* Icono 'X' para eliminar */}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            /*
            // --- Alternativa con Tabla ---
            <table className="notification-table">
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th></th> // Columna para botón
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  // Aplicar clase de tipo a la fila <tr>
                  <tr key={notification.id} className={`notification-row-${notification.type || 'info'}`}>
                    <td className="message-cell">{notification.message}</td>
                    <td>{notification.type || 'info'}</td>
                    <td>{formatDateTime(notification.created_at)}</td>
                    <td className="action-cell">
                      {deleteNotification && (
                        <button
                          className="delete-button"
                          onClick={() => deleteNotification(notification.id)}
                          aria-label="Eliminar notificación"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            */
          )}
        </div>
      </div>
    </div>
  );
};


// --- Componente Principal (Vista de página completa - Mantenido como estaba) ---
const NotificationManager = (props = {}) => {
  const initialNotifications = useMemo(() => props.notifications || [], [props.notifications]);
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshNotifications = async () => {
    setError(null);
    try {
      const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setLocalNotifications(data.data);
      } else {
        console.error("Error o formato inválido al refrescar notificaciones:", data.message || data);
        setLocalNotifications([]);
      }
    } catch (error) {
      console.error('Error refrescando notificaciones:', error);
      setError(error.message);
      setLocalNotifications([]);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    refreshNotifications().finally(() => setIsLoading(false));
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
       setLocalNotifications(initialNotifications);
    }
  }, [initialNotifications, isLoading]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha inválida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Fecha inválida'; }
  };

  if (isLoading) {
    return <div className="notification-container"><p>Cargando notificaciones...</p></div>;
  }

  if (error) {
     return <div className="notification-container error-message">Error: {error}</div>;
  }

  return (
    <div className="notification-container"> {/* Asegúrate que esta clase exista si usas esta vista */}
      <h3>Historial de Notificaciones</h3>
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
              <tr key={notification.id} className={`notification-row-${notification.type || 'info'}`}>
                <td className="message-cell">{notification.message}</td>
                <td>{notification.type || 'info'}</td>
                <td>{formatDateTime(notification.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// --- Hook Personalizado (Mantenido como estaba) ---
export const useNotificationManager = () => {
  const refreshNotifications = async () => {
    try {
      const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return (data.success && Array.isArray(data.data)) ? data.data : [];
    } catch (error) {
      console.error('Error refrescando notificaciones desde hook:', error);
      return [];
    }
  };

  const addNotification = async (message, type = 'info') => {
    if (!message) {
      console.error("Intento de añadir notificación sin mensaje.");
      return;
    }
    try {
      const response = await fetch('http://localhost/schizotactical/backend/guardar_notificacion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Error añadiendo notificación desde hook:', error);
    }
  };

  return { refreshNotifications, addNotification };
};

// --- Exportaciones ---
export default NotificationManager; // Exporta el componente de página completa
export { NotificationPanel }; // Exporta el componente del panel lateral
