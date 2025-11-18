import React, { useState, useEffect } from 'react';
import './AdminNavbar.css'; // Importa los estilos SOLO de la navbar
import { NotificationPanel } from './NotificationManager'; // Importa el panel
import { backendUrl } from '../../config/api';

const AdminNavbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [error, setError] = useState(null);

  // --- Lógica de Fetch y Delete se mantiene aquí ---
  // porque este componente necesita los datos para el contador
  // y pasa la función delete al panel.
  const fetchNotifications = async () => {
    // setError(null); // No limpiar error automáticamente al refrescar
    try {
      const response = await fetch(backendUrl('notificaciones.php'), {
        credentials: 'include',
      });
      if (response.status === 401) { // No autorizado: probablemente sesión expirada
        setNotifications([]);
        return; // Silenciar error visible
      }
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch (e) { /* Ignorar */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        // setError(null); // Limpiar error solo si la carga es exitosa
      } else {
        console.warn('Respuesta inválida al obtener notificaciones:', data);
        setNotifications([]);
        // setError(data.message || 'Formato de datos inválido');
      }
    } catch (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      // Solo actualiza el error si no hay uno ya (para no sobreescribir errores de delete)
      if (!error) {
        setError(`Error al cargar: ${fetchError.message}`);
      }
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo al montar

  const toggleNotificationCenter = () => {
    setNotificationCenterOpen(!isNotificationCenterOpen);
    // Limpiar error al cerrar el panel
    if (isNotificationCenterOpen) {
      setError(null);
    }
  };

  const deleteNotification = async (id) => {
    setError(null); // Limpiar error antes de intentar eliminar
    console.log(`Intentando eliminar notificación ID: ${id}`);
    try {
      const response = await fetch(backendUrl('eliminar_notificacion.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch (jsonError) { /* Ignorar */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (data.success) {
        console.log('Notificación eliminada con éxito.');
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        console.error('Error del backend al eliminar:', data.message);
        setError(data.message || 'El backend indicó un error al eliminar.');
      }
    } catch (deleteError) {
      console.error('Error al eliminar la notificación:', deleteError);
      setError(`Error al eliminar: ${deleteError.message}`);
    }
  };

  // Función para limpiar el error manualmente (pasada al panel)
  const clearError = () => {
    setError(null);
  };

  // --- Icono de la campana (sin cambios) ---
  const getNotificationBellIcon = () => {
    // (Tu código SVG original aquí...)
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

  // --- Renderizado ---
  return (
    <> {/* Usamos Fragment porque el panel ahora es un hermano */}
      <div className="admin-navbar">
        <div className="admin-navbar-content">
          {/* Otros elementos de tu navbar */}
          <div className="notification-area">
            <button className="notification-bell" onClick={toggleNotificationCenter} aria-label="Ver notificaciones">
              {getNotificationBellIcon()}
              {notifications.length > 0 && (
                <span className="notification-count">{notifications.length}</span>
              )}
            </button>
          </div>
          {/* Más elementos */}
        </div>
      </div>

      {/* Renderiza el Panel de Notificaciones importado */}
      <NotificationPanel
        isOpen={isNotificationCenterOpen}
        onClose={toggleNotificationCenter}
        notifications={notifications}
        deleteNotification={deleteNotification}
        error={error}
        clearError={clearError} // Pasamos la función para limpiar error
      />
    </>
  );
};

export default AdminNavbar;
