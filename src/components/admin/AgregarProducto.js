import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './AgregarProducto.css'; // Asegúrate de tener un archivo CSS para estilos

function AgregarProducto() {
  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    categoria: '',
    subcategoria: '',
    stock_option: 'preorder',
    stock_quantity: '',
    precio: '',
    imagen: null
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, imagen: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) formDataToSend.append(key, value);
    });

    try {
      const response = await fetch('http://localhost/schizotactical/backend/agregar_producto.php', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        navigate('/admin/productos');
      } else {
        alert(data.message || 'Error al agregar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="form-container">
      <h2>Agregar Nuevo Producto</h2>
      <form onSubmit={handleSubmit}>
        {/* Campos del formulario */}
        <div className="form-group">
          <label>Nombre:</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        
        {/* Agrega los demás campos aquí */}
        
        <div className="form-group">
          <label>Imagen:</label>
          <input type="file" name="imagen" onChange={handleFileChange} required />
        </div>
        
        <button type="submit">Agregar Producto</button>
      </form>
    </div>
  );
}

export default AgregarProducto;