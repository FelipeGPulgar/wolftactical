// src/components/admin/ProductosAdmin.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './ProductosAdmin.css'; // Asegúrate de tener este archivo CSS

function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cargar productos (sin cambios)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost/schizotactical/backend/get_products.php', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data && data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
           console.warn("Respuesta de API inesperada (array directo), se procesará.");
           setProducts(data);
        } else {
          throw new Error(data.message || 'Formato de datos inválido recibido del servidor');
        }
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Eliminar producto (sin cambios)
  const handleDelete = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto con ID ${id}?`)) {
      try {
        const response = await fetch(
          `http://localhost/schizotactical/backend/eliminar_producto.php?id=${id}`,
          {
            method: 'GET', // Considera usar DELETE si tu backend lo soporta
            credentials: 'include'
          }
        );
        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
           throw new Error(errorData.message || 'Error en la respuesta del servidor al eliminar');
        }
        const data = await response.json();
        if (data.success) {
          setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
          alert('Producto eliminado con éxito');
        } else {
          throw new Error(data.message || 'Error al eliminar el producto en el backend');
        }
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        alert(`Error al eliminar el producto: ${err.message}`);
      }
    }
  };

  // Renderizados condicionales (sin cambios)
  if (loading) {
    return <div className="loading-message">Cargando productos...</div>;
  }
  if (error) {
    return <div className="error-message">Error al cargar productos: {error}</div>;
  }
  if (!products || products.length === 0) {
    return (
      <div className="productos-admin-container">
         <div className="productos-header">
            <h2>Lista de Productos</h2>
            <Link to="/admin/agregar-producto" className="btn-add">
              Agregar Primer Producto
            </Link>
         </div>
        <p>No hay productos disponibles para mostrar.</p>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="productos-admin-container">
      <div className="productos-header">
        <h2>Lista de Productos ({products.length})</h2>
        <Link to="/admin/agregar-producto" className="btn-add">
          + Agregar Producto
        </Link>
      </div>
      <div className="table-responsive">
        <table className="productos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Modelo</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  {product.main_image ? (
                    <img
                       src={`http://localhost/schizotactical/backend/${product.main_image}`}
                       alt={product.name || 'Producto'}
                       className="product-thumbnail"
                       onError={(e) => { e.target.style.display = 'none'; }} // Oculta si la imagen no carga
                    />
                  ) : (
                    <span className="no-image">Sin imagen</span>
                  )}
                </td>
                <td>{product.name || 'N/A'}</td>
                <td>{product.model || 'N/A'}</td>
                <td>${product.price ? Number(product.price).toLocaleString('es-CL') : '0'}</td>
                <td>
                  {product.stock_option === 'instock'
                    ? `En Stock (${product.stock_quantity || '0'})`
                    : 'Por encargo'}
                </td>
                 <td>
                   <span className={`status ${product.is_active === 1 || product.is_active === '1' ? 'status-active' : 'status-inactive'}`}>
                     {product.is_active === 1 || product.is_active === '1' ? 'Activo' : 'Inactivo'}
                   </span>
                 </td>
                <td className="actions">
                  {/* --- CORRECCIÓN AQUÍ --- */}
                  <button
                    onClick={() => navigate(`/admin/editar-producto/${product.id}`)} // Cambiado a 'editar-producto'
                    className="btn-edit"
                    title="Editar Producto"
                  >
                    Editar
                  </button>
                  {/* ----------------------- */}
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn-delete"
                    title="Eliminar Producto"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductosAdmin;
