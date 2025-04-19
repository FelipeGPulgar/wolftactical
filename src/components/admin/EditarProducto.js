import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditarProducto.css';
import notificationBellActive from '../../Images/notification-bell-active.svg';
import notificationBellInactive from '../../Images/notification-bell-inactive.svg';

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState({
    nombre: '',
    modelo: '',
    categoria: '',
    subcategoria: '',
    stock_option: 'preorder',
    stock_quantity: '',
    precio: '',
    imagen: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 120000); // 2 minutes
  };

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        // Ensure the URL is correct and the backend file exists
        const response = await fetch(`http://localhost/schizotactical/backend/get_products.php?id=${id}`, {
          credentials: 'include' // Keep this if your backend requires credentials
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de API (cargarProducto):', data);

        if (data.success && data.data) {
          setProducto({
            nombre: data.data.name || '',
            modelo: data.data.model || '',
            categoria: data.data.category || '',
            subcategoria: data.data.subcategory || '',
            stock_option: data.data.stock_option || 'preorder',
            stock_quantity: data.data.stock_quantity || '',
            precio: data.data.price || '',
            imagen: null
          });
        } else {
          throw new Error(data.message || 'Producto no encontrado');
        }
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarProducto();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setProducto(prev => ({ ...prev, imagen: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', id);
    formData.append('nombre', producto.nombre);
    formData.append('modelo', producto.modelo);
    formData.append('categoria', producto.categoria);
    formData.append('subcategoria', producto.subcategoria);
    formData.append('stock_option', producto.stock_option);
    formData.append('stock_quantity', producto.stock_quantity);
    formData.append('precio', producto.precio);
    if (producto.imagen) {
      formData.append('imagen', producto.imagen);
    }

    try {
      // Ensure the URL is correct and the backend file exists
      const response = await fetch('http://localhost/schizotactical/backend/editar_producto.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Respuesta de edición:', data);

      if (data.success) {
        addNotification('Producto actualizado con éxito', 'success');
        document.querySelector('.notification-bell img').src = notificationBellActive; // Cambiar imagen a activa
        setTimeout(() => {
          document.querySelector('.notification-bell img').src = notificationBellInactive; // Volver a inactiva después de 2 minutos
        }, 120000);
        navigate('/admin/productos');
      } else {
        addNotification(data.message || 'Error al actualizar el producto', 'error');
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      addNotification('Error de conexión con el servidor', 'error');
    }
  };

  if (loading) {
    return <div className="loading">Cargando producto...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="form-container">
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input type="text" name="nombre" value={producto.nombre} onChange={handleChange} required />

        <label>Modelo</label>
        <input type="text" name="modelo" value={producto.modelo} onChange={handleChange} />

        <label>Categoría</label>
        <input type="text" name="categoria" value={producto.categoria} onChange={handleChange} />

        <label>Subcategoría</label>
        <input type="text" name="subcategoria" value={producto.subcategoria} onChange={handleChange} />

        <label>Stock</label>
        <select name="stock_option" value={producto.stock_option} onChange={handleChange}>
          <option value="preorder">Preorden</option>
          <option value="stock">En stock</option>
        </select>

        {producto.stock_option === 'stock' && (
          <>
            <label>Cantidad en stock</label>
            <input
              type="number"
              name="stock_quantity"
              value={producto.stock_quantity}
              onChange={handleChange}
              min="0"
            />
          </>
        )}

        <label>Precio</label>
        <input
          type="number"
          name="precio"
          value={producto.precio}
          onChange={handleChange}
          min="0"
          step="0.01"
        />

        <label>Subir nueva imagen</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button type="submit">Actualizar Producto</button>
      </form>
    </div>
  );
}

export default EditarProducto;