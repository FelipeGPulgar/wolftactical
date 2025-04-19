import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
  const [imagenActual, setImagenActual] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        const response = await fetch(`http://localhost/schizotactical/backend/get_product.php?id=${id}`, {
          credentials: 'include' // Esto es crucial para enviar las cookies de sesión
        });
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setProducto({
            nombre: data.product.name || '',
            modelo: data.product.model || '',
            categoria: data.product.category || '',
            subcategoria: data.product.subcategory || '',
            stock_option: data.product.stock_option || 'preorder',
            stock_quantity: data.product.stock_quantity || '',
            precio: data.product.price || '',
            imagen: null
          });
          setImagenActual(data.product.main_image || '');
        } else {
          throw new Error(data.message || 'Producto no encontrado');
        }
      } catch (err) {
        console.error('Error:', err);
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
      const response = await fetch('http://localhost/schizotactical/backend/editar_producto.php', {
        method: 'POST',
        credentials: 'include', // Importante para mantener la sesión
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        navigate('/admin/productos');
      } else {
        setError(data.message || 'Error al actualizar el producto');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
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
      <h2>Editar Producto</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Campos del formulario (igual que antes) */}
        {/* ... */}
      </form>
    </div>
  );
}

export default EditarProducto;