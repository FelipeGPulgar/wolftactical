// src/components/admin/AdminLayout.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLayout.css'; // Asegúrate de tener un archivo CSS para estilos
import { backendUrl } from '../../config/api';

function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpiar ambos sistemas de autenticación
    localStorage.removeItem('isAdminLoggedIn');
    
    // Hacer logout también en el backend
    fetch(backendUrl('logout.php'), {
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