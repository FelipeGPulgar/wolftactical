// src/components/admin/ProductosAdmin.js
import React, { useState, useEffect } from "react";
import { formatCLP } from '../../utils/formatters';
import { useNavigate } from "react-router-dom";
import './ProductosAdmin.css'; // Asegúrate de tener este archivo CSS
import { backendUrl, mediaUrl } from '../../config/api';

function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cargar productos (actualizado para nuevo esquema)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(backendUrl('get_products.php'), {
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

  const buildImageUrl = (path) => mediaUrl(path);

  // Eliminar producto (sin cambios)
  const handleDelete = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto con ID ${id}?`)) {
      try {
        const response = await fetch(
          backendUrl(`eliminar_producto.php?id=${id}`),
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
      </div>
      <div className="table-responsive">
        <table className="productos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Portada</th>
              <th>Nombre</th>
              <th>Modelo</th>
              <th className="col-category">Categoría</th>
              <th className="col-price">Precio</th>
              <th className="col-stock">Stock</th>
              <th>Estado</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td data-label="ID">{product.id}</td>
                <td data-label="Portada">
                  {product.cover_image ? (
                    <img
                       src={buildImageUrl(product.cover_image)}
                       alt={product.name || 'Producto'}
                       className="product-thumbnail"
                       onError={(e) => { 
                         e.target.style.display = 'none';
                         const parent = e.target.parentNode;
                         if (!parent.querySelector('.no-image')) {
                           const placeholder = document.createElement('span');
                           placeholder.className = 'no-image';
                           placeholder.textContent = 'Sin imagen';
                           parent.appendChild(placeholder);
                         }
                       }}
                    />
                  ) : (
                    <span className="no-image">Sin imagen</span>
                  )}
                </td>
                <td data-label="Nombre">{product.name || 'N/A'}</td>
                <td data-label="Modelo">{product.model || 'N/A'}</td>
                <td className="col-category" data-label="Categoría">
                  {(() => {
                    const name = product.category_name || null;
                    const isMissing = name && name.toUpperCase() === 'FALTA CATEGORIA';
                    const display = name || (product.category_id ? `#${product.category_id}` : 'N/A');
                    return <span className={`category-badge ${isMissing ? 'missing' : ''}`}>{display}</span>;
                  })()}
                </td>
                <td className="col-price" data-label="Precio">{formatCLP(product.price)}</td>
                <td className="col-stock" data-label="Stock">
                  {(() => {
                    const status = product?.stock_status
                      ? (product.stock_status === 'en_stock' ? 'En stock' : 'Por encargo')
                      : (product?.stock_option === 'instock' ? 'En stock' : 'Por encargo');
                    return status;
                  })()}
                </td>
                 <td data-label="Estado">
                   <span className={`status ${product.is_active === 1 || product.is_active === '1' ? 'status-active' : 'status-inactive'}`}>
                     {product.is_active === 1 || product.is_active === '1' ? 'Activo' : 'Inactivo'}
                   </span>
                 </td>
                <td className="actions" data-label="Acciones">
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
