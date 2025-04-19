import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './ProductosAdmin.css'; // Asegúrate de tener un archivo CSS para estilos

function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost/schizotactical/backend/get_products.php', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Error al obtener productos');
        }

        const data = await response.json();
        
        // Verificar que data sea un array antes de setearlo
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.data && Array.isArray(data.data)) {
          // Si la respuesta tiene formato { data: [...] }
          setProducts(data.data);
        } else {
          throw new Error('Formato de datos inválido');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const response = await fetch(
          `http://localhost/schizotactical/backend/eliminar_producto.php?id=${id}`, 
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Error al eliminar producto');
        }

        setProducts(products.filter(product => product.id !== id));
      } catch (err) {
        console.error('Error:', err);
        alert('Error al eliminar el producto');
      }
    }
  };

  if (loading) {
    return <div>Cargando productos...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div>
        <p>No hay productos disponibles.</p>
        <Link to="/admin/agregar-producto" className="btn-add">
          Agregar Primer Producto
        </Link>
      </div>
    );
  }

  return (
    <div className="productos-admin-container">
      <div className="productos-header">
        <h2>Lista de Productos</h2>
        <Link to="/admin/agregar-producto" className="btn-add">
          Agregar Producto
        </Link>
      </div>

      <table className="productos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Modelo</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name || 'N/A'}</td>
              <td>{product.model || 'N/A'}</td>
              <td>${product.price ? Number(product.price).toFixed(2) : '0.00'}</td>
              <td>
                {product.stock_option === 'instock' 
                  ? product.stock_quantity || '0' 
                  : 'Por encargo'}
              </td>
              <td className="actions">
                <button 
                  onClick={() => navigate(`/admin/editar-producto/${product.id}`)}
                  className="btn-edit"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="btn-delete"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductosAdmin;