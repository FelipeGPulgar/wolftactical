import React, { useState, useEffect } from 'react';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
          credentials: 'include', // Ensure cookies are sent with the request
        });
        if (!response.ok) {
          throw new Error('Error fetching notifications');
        }
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setNotifications(data.data); // Ensure notifications is always an array
        } else {
          setNotifications([]); // Fallback to an empty array if data is not an array
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]); // Fallback to an empty array in case of an error
      }
    };

    fetchNotifications();

    // Fetch notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 2000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const toggleNotificationCenter = () => {
    setNotificationCenterOpen(!isNotificationCenterOpen);
  };

  // Removed any timeout logic to ensure notifications remain permanent
  const deleteNotification = async (id) => {
    try {
      const response = await fetch('http://localhost/schizotactical/backend/eliminar_notificacion.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Asegúrate de enviar credenciales si tu backend las necesita para la sesión
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      // Intenta obtener el cuerpo de la respuesta, incluso si no es 'ok'
      let data = {}; // Inicializa data
      try {
          data = await response.json(); // Intenta parsear como JSON
      } catch (jsonError) {
          // Si falla el JSON, lee como texto (útil para errores 500 con HTML)
          const textResponse = await response.text();
          console.error("Respuesta no JSON del endpoint de eliminación:", textResponse.substring(0, 500)); // Loguea parte de la respuesta
          // Asigna un mensaje de error basado en el status si no hay JSON
          data = { success: false, message: `Error ${response.status}: Respuesta no válida del servidor.` };
      }

      // Ahora verifica si la respuesta de red fue exitosa
      if (!response.ok) {
        // Lanza un error usando el mensaje del backend si existe, sino uno genérico
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }

      // Si response.ok es true, asumimos que data.success también lo es (según el PHP)
      // No es estrictamente necesario volver a verificar data.success aquí si confías en tu backend
      console.log(`Notificación ID ${id} eliminada correctamente por backend. Actualizando UI...`);
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));

    } catch (error) {
      // Muestra el mensaje de error específico capturado
      console.error('Error al eliminar la notificación:', error.message || error);
      // Considera mostrar este error al usuario de forma más visible si es necesario
      // alert(`Error: ${error.message || 'No se pudo eliminar la notificación.'}`);
    }
  };


  const getNotificationBellIcon = () => {
    if (notifications.length > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" strokeWidth="2">
          <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
          <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
          <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727"></path>
          <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727"></path>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" strokeWidth="2">
          <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
          <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
        </svg>
      );
    }
  };

  return (
    <div className="admin-navbar">
      <div className="admin-navbar-content">
        <div className="notification-bell" onClick={toggleNotificationCenter}>
          {getNotificationBellIcon()}
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