import React, { useState, useEffect, useMemo } from 'react';
import './NotificationManager.css';

// --- Componente Principal (si se usa en una página dedicada) ---
const NotificationManager = (props = {}) => {
  // Usar useMemo para evitar recalcular innecesariamente si las props no cambian
  const initialNotifications = useMemo(() => props.notifications || [], [props.notifications]);
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para refrescar notificaciones
  const refreshNotifications = async () => {
    // No iniciar carga si ya está cargando para evitar múltiples llamadas
    // setIsLoading(true); // Quitado para que el polling sea menos intrusivo visualmente
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
        // Si success es false o data.data no es array
        console.error("Error o formato inválido al refrescar notificaciones:", data.message || data);
        setLocalNotifications([]); // Mantener como array vacío
      }
    } catch (error) {
      console.error('Error refrescando notificaciones:', error);
      setError(error.message); // Mostrar error si falla el refresh
      setLocalNotifications([]); // Limpiar en caso de error grave
    } finally {
      // setIsLoading(false); // Quitado
    }
  };

  // Efecto para carga inicial y polling
  useEffect(() => {
    setIsLoading(true); // Marcar carga solo al inicio
    refreshNotifications().finally(() => setIsLoading(false)); // Carga inicial

    const interval = setInterval(refreshNotifications, 5000); // Polling cada 5 segundos
    return () => clearInterval(interval); // Limpiar intervalo al desmontar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar

  // Efecto para actualizar desde props (si se pasan desde fuera)
  useEffect(() => {
    // Solo actualizar si las props realmente cambian y no estamos cargando
    if (!isLoading) {
       setLocalNotifications(initialNotifications);
    }
  }, [initialNotifications, isLoading]);


  if (isLoading) {
    return <div className="notification-container"><p>Cargando notificaciones...</p></div>;
  }

  if (error) {
     return <div className="notification-container error-message">Error: {error}</div>;
  }

  return (
    <div className="notification-container">
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
              {/* Podrías añadir botón de eliminar aquí si esta vista lo requiere */}
            </tr>
          </thead>
          <tbody>
            {localNotifications.map((notification) => (
              <tr key={notification.id}>
                <td>{notification.message}</td>
                <td>{notification.type}</td>
                {/* CORREGIDO: Usar created_at */}
                <td>{new Date(notification.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// --- Componente Panel Lateral (Usado por AdminNavbar) ---
const NotificationPanel = ({
  notifications = [], // Default a array vacío
  deleteNotification, // Función para eliminar
  isOpen,
  onClose,
  error,
  clearError // Función para limpiar error (si la implementas)
}) => {
  if (!isOpen) return null;

  return (
    // Overlay para cerrar al hacer clic fuera
    <div className="notification-overlay" onClick={onClose}>
      {/* Contenedor del panel, detiene la propagación del clic */}
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notificaciones ({notifications.length})</h3>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Muestra error si existe */}
        {error && (
          <div className="notification notification-error"> {/* Usar clase de notificación */}
            <span>{error}</span>
            {/* Botón opcional para limpiar el error */}
            {clearError && <button className="delete-button" onClick={clearError}>×</button>}
          </div>
        )}

        {/* Contenedor de la lista/tabla de notificaciones */}
        <div className="notifications-container">
          {notifications.length === 0 ? (
            <p className="no-notifications">No hay notificaciones</p>
          ) : (
            // Puedes usar una lista <ul> o la tabla <table>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map((notification) => (
                <li key={notification.id} className={`notification notification-${notification.type}`}>
                  <div className="notification-content">
                     <span className="notification-message">{notification.message}</span>
                     {/* CORREGIDO: Usar created_at */}
                     <span className="notification-time">{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                  {/* Botón para eliminar, llama a la función pasada por props */}
                  {deleteNotification && (
                     <button
                       className="delete-button"
                       onClick={() => deleteNotification(notification.id)}
                       aria-label="Eliminar notificación"
                     >
                       ×
                     </button>
                  )}
                </li>
              ))}
            </ul>
            /* O si prefieres la tabla:
            <table className="notification-table">
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th></th> // Columna para botón eliminar
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.message}</td>
                    <td>{notification.type}</td>
                    <td>{new Date(notification.created_at).toLocaleString()}</td>
                    <td>
                      {deleteNotification && (
                        <button
                          className="delete-button" // Podrías necesitar estilos específicos
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

// --- Hook Personalizado (para lógica reutilizable) ---
// Este hook centraliza la lógica de refrescar y añadir, pero no maneja el estado global.
// Podría ser útil si diferentes componentes necesitan estas funciones.
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
      // Asegura devolver un array
      return (data.success && Array.isArray(data.data)) ? data.data : [];
    } catch (error) {
      console.error('Error refrescando notificaciones desde hook:', error);
      return []; // Devuelve array vacío en error
    }
  };

  // Función para añadir notificaciones generales
  const addNotification = async (message, type = 'info') => { // Default a 'info'
    if (!message) {
      console.error("Intento de añadir notificación sin mensaje.");
      return;
    }
    try {
      const response = await fetch('http://localhost/schizotactical/backend/guardar_notificacion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }), // Solo envía message y type
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      // Opcional: podrías llamar a refreshNotifications() aquí si quieres verla inmediatamente
      // o confiar en el polling.
    } catch (error) {
      console.error('Error añadiendo notificación desde hook:', error);
    }
  };

  // Podrías añadir aquí la función deleteNotification si quieres centralizarla también

  return { refreshNotifications, addNotification };
};


// --- Exportaciones ---
// Exporta el componente principal (si se usa)
export default NotificationManager;
// Exporta el panel y la función fetch (usados por AdminNavbar)
export { NotificationPanel, fetchNotifications }; // fetchNotifications aquí es redundante si usas el hook
