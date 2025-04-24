import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AgregarProducto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    main_category: '',
    subcategory: '',
    stock_option: 'preorder',
    stock_quantity: '',
    price: '',
    main_image: null,
    new_category_name: '',
    new_subcategory_name: '',
    image_1: null,
    image_2: null
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost/schizotactical/backend/get_categories.php');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.main_category && formData.main_category !== 'new_category') {
      const fetchSubcategories = async () => {
        try {
          const response = await fetch(`http://localhost/schizotactical/backend/get_subcategories.php?category_id=${formData.main_category}`);
          const data = await response.json();
          setSubcategories(data);
        } catch (err) {
          console.error('Error al cargar subcategorías:', err);
        }
      };
      fetchSubcategories();
    }
  }, [formData.main_category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'main_category' ? { subcategory: '' } : {})
    }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      if (name === 'main_image') {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    try {
      const response = await fetch('http://localhost/schizotactical/backend/agregar_producto.php', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al agregar producto');
        } catch {
          const text = await response.text();
          throw new Error(text || `Error HTTP: ${response.status}`);
        }
      }

      const data = await response.json();
      if (data.success) {
        alert('Producto agregado con éxito');
        navigate('/admin/productos');
      } else {
        throw new Error(data.message || 'Error al agregar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Agregar Nuevo Producto</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nombre del Producto</label>
          <input type="text" id="name" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="model" className="form-label">Modelo (opcional)</label>
          <input type="text" id="model" name="model" className="form-control" value={formData.model} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="main_category" className="form-label">Categoría Principal</label>
          <select id="main_category" name="main_category" className="form-select" value={formData.main_category} onChange={handleChange} required>
            <option value="">Seleccione una categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
            <option value="new_category">+ Crear Nueva Categoría</option>
          </select>

          {formData.main_category === 'new_category' && (
            <div className="form-group">
              <label htmlFor="new_category_name" className="form-label">Nombre de Nueva Categoría</label>
              <input type="text" id="new_category_name" name="new_category_name" className="form-control" value={formData.new_category_name} onChange={handleChange} required />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="subcategory" className="form-label">Subcategoría</label>
          <select id="subcategory" name="subcategory" className="form-select" value={formData.subcategory} onChange={handleChange} required disabled={!formData.main_category || formData.main_category === 'new_category'}>
            <option value="">{formData.main_category ? 'Seleccione una subcategoría' : 'Seleccione una categoría primero'}</option>
            {subcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>

          {(formData.main_category === 'new_category' || (formData.main_category && subcategories.length === 0)) && (
            <div className="form-group">
              <label htmlFor="new_subcategory_name" className="form-label">Nombre de Nueva Subcategoría</label>
              <input type="text" id="new_subcategory_name" name="new_subcategory_name" className="form-control" value={formData.new_subcategory_name} onChange={handleChange} required />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Opciones de Stock</label>
          <div className="radio-group">
            <label className="radio-option">
              <input type="radio" name="stock_option" value="preorder" checked={formData.stock_option === 'preorder'} onChange={handleChange} />
              Por encargo
            </label>
            <label className="radio-option">
              <input type="radio" name="stock_option" value="instock" checked={formData.stock_option === 'instock'} onChange={handleChange} />
              En stock
            </label>
          </div>

          {formData.stock_option === 'instock' && (
            <div className="form-group">
              <label htmlFor="stock_quantity" className="form-label">Cantidad en Stock</label>
              <input type="number" id="stock_quantity" name="stock_quantity" className="form-control" value={formData.stock_quantity} onChange={handleChange} min="0" required />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="price" className="form-label">Precio (CLP)</label>
          <input type="number" id="price" name="price" className="form-control" value={formData.price} onChange={handleChange} min="0" required />
        </div>

        <div className="form-group">
          <label htmlFor="main_image" className="form-label">Imagen Principal</label>
          <input
            type="file"
            id="main_image"
            name="main_image"
            className="image-upload-control"
            onChange={handleFileChange}
            accept="image/*"
            required
          />
          {imagePreview && <img src={imagePreview} alt="Vista previa" className="image-upload-preview" />}
        </div>

        <div className="form-group">
          <label htmlFor="image_1" className="form-label">Imagen Adicional 1 (opcional)</label>
          <input
            type="file"
            id="image_1"
            name="image_1"
            className="image-upload-control"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image_2" className="form-label">Imagen Adicional 2 (opcional)</label>
          <input
            type="file"
            id="image_2"
            name="image_2"
            className="image-upload-control"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/productos')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Agregando...' : 'Agregar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AgregarProducto;
