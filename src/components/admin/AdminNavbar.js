import React, { useState, useEffect } from 'react';
import './AdminNavbar.css'; // Asegúrate que la ruta a tu CSS sea correcta

const AdminNavbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [error, setError] = useState(null); // Estado para manejar errores de fetch/delete

  // --- Función para obtener notificaciones ---
  const fetchNotifications = async () => {
    // No resetear error aquí para que los errores de eliminación persistan si es necesario
    // setError(null);
    try {
      const response = await fetch('http://localhost/schizotactical/backend/notificaciones.php', {
        credentials: 'include', // Correcto: Enviar cookies para autenticación
      });
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) { /* Ignorar si no hay JSON */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setError(null); // Limpiar error si la carga fue exitosa
      } else {
        console.warn('Respuesta inválida al obtener notificaciones:', data);
        setNotifications([]); // Mantener como array vacío
        // Podrías establecer un error aquí si data.success es false
        // setError(data.message || 'Formato de datos inválido');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(`Error al cargar: ${error.message}`); // Mostrar error de carga
      setNotifications([]); // Fallback en caso de error
    }
  };

  // --- Efecto para cargar notificaciones iniciales y establecer intervalo ---
  useEffect(() => {
    fetchNotifications(); // Carga inicial

    // Actualizar cada 5 segundos (ajusta según necesidad)
    const interval = setInterval(fetchNotifications, 5000); // Intervalo de 5 segundos

    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(interval);
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  // --- Alternar visibilidad del centro de notificaciones ---
  const toggleNotificationCenter = () => {
    setNotificationCenterOpen(!isNotificationCenterOpen);
    if (isNotificationCenterOpen) { // Si se está cerrando, limpiar errores
        setError(null);
    }
  };

  // --- Función para eliminar una notificación ---
  const deleteNotification = async (id) => {
    setError(null); // Limpiar errores previos antes de intentar eliminar
    console.log(`Intentando eliminar notificación ID: ${id}`);
    try {
      const response = await fetch('http://localhost/schizotactical/backend/eliminar_notificacion.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ***** CORRECCIÓN IMPORTANTE *****
        credentials: 'include', // ¡Necesario para enviar la cookie de sesión!
        // ***********************************
        body: JSON.stringify({ id }),
      });

      // Verificar si la respuesta NO fue exitosa (ej. 401, 404, 500)
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage; // Usar mensaje del backend si existe
        } catch (jsonError) {
          // No se pudo parsear JSON, usar el mensaje genérico
          console.warn("No se pudo parsear JSON de error en delete:", jsonError);
        }
        throw new Error(errorMessage); // Lanza el error para ser capturado abajo
      }

      // Si la respuesta fue OK (ej. 200), procesar el JSON
      const data = await response.json();
      if (data.success) {
        console.log('Notificación eliminada con éxito. Actualizando estado.');
        // Actualizar el estado local eliminando la notificación
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notification) => notification.id !== id)
        );
      } else {
        // El backend devolvió success: false pero con estado 200
        console.error('Error del backend al eliminar:', data.message);
        setError(data.message || 'El backend indicó un error al eliminar.'); // Mostrar error del backend
      }
    } catch (error) {
      // Captura errores de red o los errores lanzados desde el bloque try
      console.error('Error al eliminar la notificación:', error);
      setError(`Error al eliminar: ${error.message}`); // Mostrar error en la UI
    }
  };


  // --- Función para obtener el ícono de la campana ---
  // Mantenida como en tu código original
  const getNotificationBellIcon = () => {
    if (notifications.length > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" strokeWidth="2">
          <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
          <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
          {/* Indicador de vibración (opcional, puedes quitarlo si no te gusta) */}
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

  // --- Renderizado del componente ---
  return (
    <div className="admin-navbar">
      <div className="admin-navbar-content">
        {/* Contenido de tu navbar (logo, links, etc.) iría aquí */}
        <div className="notification-area"> {/* Contenedor para la campana */}
          <button className="notification-bell" onClick={toggleNotificationCenter} aria-label="Ver notificaciones">
            {getNotificationBellIcon()}
            {/* Contador de notificaciones (opcional) */}
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </button>
        </div>
        {/* Más contenido de la navbar */}
      </div>

      {/* Overlay para cerrar el panel */}
      {isNotificationCenterOpen && (
        <div className="notification-overlay" onClick={toggleNotificationCenter}></div>
      )}

      {/* Panel de Notificaciones */}
      {isNotificationCenterOpen && (
        // Detener propagación para que el clic dentro no cierre el panel
        <div className="notification-center" onClick={e => e.stopPropagation()}>
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <button className="close-button" onClick={toggleNotificationCenter} aria-label="Cerrar notificaciones">X</button>
          </div>

          {/* Mostrar error si existe */}
          {error && <div className="notification-error-message">{error}</div>}

          <div className="notification-list"> {/* Contenedor para la lista */}
            {notifications.length === 0 && !error ? ( // Mostrar solo si no hay notificaciones Y no hay error
              <p className="no-notifications">No hay notificaciones</p>
            ) : (
              notifications.map((notification) => (
                // Clases originales mantenidas aquí
                <div key={notification.id} className={`notification notification-${notification.type || 'info'}`}>
                  <span>{notification.message}</span>
                  {/* Añadido stopPropagation para evitar cerrar el panel al eliminar */}
                  <button
                    className="delete-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                    }}
                    aria-label={`Eliminar notificación ${notification.id}`}
                  >
                    Eliminar {/* O usa un icono como &times; */}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNavbar;
