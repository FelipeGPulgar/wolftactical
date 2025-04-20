// src/components/admin/AdminLayout.js
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLayout.css'; // Asegúrate de tener un archivo CSS para estilos
import useNotificationManager from './NotificationManager';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { refreshNotifications } = useNotificationManager();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications(); // Call refreshNotifications from the hook
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [refreshNotifications]);

  const handleLogout = () => {
    // Limpiar ambos sistemas de autenticación
    localStorage.removeItem('isAdminLoggedIn');
    
    // Hacer logout también en el backend
    fetch('http://localhost/schizotactical/backend/logout.php', {
      method: 'POST',
      credentials: 'include'
    })
    .then(() => {
      navigate('/login', { replace: true });
    })
    .catch(error => {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { replace: true });
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Panel de Administración</h2>
        <nav>
          <ul>
            <li>
              <Link to="/admin/productos" className="admin-nav-link">
                <i className="fas fa-boxes"></i> Productos
              </Link>
            </li>
            <li>
              <Link to="/admin/agregar-producto" className="admin-nav-link">
                <i className="fas fa-plus-circle"></i> Agregar Producto
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="admin-logout-btn">
                <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;