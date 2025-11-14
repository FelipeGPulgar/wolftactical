import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCLP, parseCLPInput } from '../../utils/formatters';
// Asegúrate de tener estilos adecuados, puedes importar los de EditarProducto si son similares
// import './AgregarProducto.css'; // O crea uno específico

function AgregarProducto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    main_category: '',
    stock_option: 'preorder',
    stock_quantity: '',
    price: '',
    main_image: null,
    image_1: null,
    image_2: null,
    descripcion: '',
    incluye: '',
    video_url: ''
  });

  const [categories, setCategories] = useState([]);
  // Subcategorías deshabilitadas
  const [imagePreview, setImagePreview] = useState(null); // Vista previa solo para imagen principal
  const [additionalImages, setAdditionalImages] = useState([]); // Galería de imágenes adicionales
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Para mostrar errores en la UI
  const [colors, setColors] = useState([]); // Array to manage colors
  const [newCategory, setNewCategory] = useState(''); // For creating new categories
  // const [newSubcategory, setNewSubcategory] = useState(''); // Eliminado: subcategorías deshabilitadas

  // --- Efecto para Cargar Categorías Iniciales ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Asume que este endpoint devuelve un array de categorías [{id: 1, name: 'Cat1'}, ...]
        const response = await fetch('http://localhost/schizotactical/backend/get_categories.php');
        if (!response.ok) {
           throw new Error(`Error HTTP al cargar categorías: ${response.status}`);
        }
        const data = await response.json();
        // Validar que la respuesta sea un array
        if (Array.isArray(data)) {
           setCategories(data);
        } else {
           console.warn("Respuesta inesperada para categorías, se esperaba un array:", data);
           setCategories([]); // Establecer vacío si no es array
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setError('No se pudieron cargar las categorías.'); // Informar al usuario
        setCategories([]); // Asegurar que sea un array vacío en caso de error
      }
    };
    fetchCategories();
  }, []); // Se ejecuta solo una vez al montar el componente

  // Subcategorías deshabilitadas: no cargar nada

  // --- Manejador de Cambios en Inputs y Selects ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      handlePriceInputChange(value);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceInputChange = (rawValue) => {
    // Permitir vacío
    if (rawValue.trim() === '') {
      setFormData(prev => ({ ...prev, price: '' }));
      return;
    }
    const numeric = parseCLPInput(rawValue);
    setFormData(prev => ({ ...prev, price: numeric }));
  };

  // --- Manejador de Cambio de Archivos (Imágenes) ---
  const handleFileChange = (e) => {
    const { name } = e.target; // 'main_image', 'image_1', 'image_2'
    const file = e.target.files[0]; // Solo el primer archivo seleccionado

    // Actualiza el estado del formulario con el archivo
    setFormData((prev) => ({
      ...prev,
      [name]: file || null, // Guarda el archivo o null si se cancela
    }));

    // Genera vista previa solo para la imagen principal
    if (name === 'main_image' && file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // Establece la URL de datos para la vista previa
      reader.readAsDataURL(file);
    } else if (name === 'main_image' && !file) {
      setImagePreview(null); // Limpia la vista previa si se cancela la selección
    }
  };

  // --- Manejador para imágenes adicionales (múltiples) ---
  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(files);
  };

  // Add a new color
  const handleAddColor = () => {
    if (colors.length < 8) {
      setColors([...colors, { color: '', image: null }]);
    }
  };

  // Update color or image in the colors array
  const handleColorChange = (index, field, value) => {
    const updatedColors = [...colors];
    updatedColors[index][field] = value;
    setColors(updatedColors);
  };

  // Remove a color
  const handleRemoveColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Handle new category creation
  const handleCreateCategory = async () => {
    if (newCategory.trim()) {
      try {
        const response = await fetch('http://localhost/schizotactical/backend/create_category.php', {
          method: 'POST',
          body: JSON.stringify({ name: newCategory }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          setCategories([...categories, data.category]);
          setNewCategory('');
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error('Error creating category:', err);
      }
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        const response = await fetch(`http://localhost/schizotactical/backend/delete_category.php`, {
          method: 'POST',
          body: JSON.stringify({ category_id: categoryId }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          setCategories(categories.filter((category) => category.id !== categoryId));
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  // Subcategorías deshabilitadas: sin manejo

  // --- Manejador de Envío del Formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir recarga de página
    setIsLoading(true); // Mostrar indicador de carga
    setError(null); // Limpiar errores anteriores

    // Crear FormData para enviar datos (incluyendo archivos)
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // Solo añadir si el valor no es null o vacío
      // Asegurarse de no enviar los campos de 'nueva categoría/subcategoría' si existieran
      if (value !== null && value !== '' && !key.startsWith('new_')) {
        formDataToSend.append(key, value);
      }
    });

    // Adjuntar imágenes adicionales (si las hay)
    if (additionalImages.length > 0) {
      additionalImages.forEach((file) => {
        if (file) formDataToSend.append('additional_images[]', file);
      });
    }

    // Log para depuración (opcional)
    // console.log("Enviando FormData:");
    // for (let [key, value] of formDataToSend.entries()) {
    //   console.log(`${key}:`, value instanceof File ? value.name : value);
    // }

    try {
      const response = await fetch('http://localhost/schizotactical/backend/agregar_producto.php', {
        method: 'POST',
        credentials: 'include', // Enviar cookies (importante para la sesión PHP)
        body: formDataToSend
      });

      // Clonar la respuesta para poder leerla potencialmente dos veces (JSON y texto)
      const clonedResponse = response.clone();

      // Intentar parsear como JSON primero
      try {
        const data = await response.json();
        console.log("Respuesta JSON recibida:", data);

        // Verificar si la respuesta de red fue OK (status 2xx) Y si el backend indica éxito
        if (!response.ok || !data.success) {
          // Si no fue OK o success es false, lanzar error con mensaje del backend o genérico
          throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }

        // Si todo fue bien
        alert('Producto agregado con éxito');
        navigate('/admin/productos'); // Redirigir a la lista de productos

      } catch (jsonError) {
        // Si falló el parseo JSON (probablemente error 500 con HTML o texto plano)
        console.error("Error al parsear JSON:", jsonError);
        // Intentar leer la respuesta como texto
        const text = await clonedResponse.text();
        console.error("Respuesta como texto:", text);
        // Lanzar un error más informativo incluyendo parte del texto recibido
        throw new Error(`Error inesperado del servidor (${response.status}). Respuesta: ${text.substring(0, 200)}...`);
      }

    } catch (error) {
      // Captura cualquier error (de red, lanzado desde el try, etc.)
      console.error('Error en handleSubmit:', error);
      setError(error.message || 'Ocurrió un error inesperado.'); // Establecer mensaje de error para la UI
      // Ya no usamos alert aquí, el error se muestra en el div {error && ...}
    } finally {
      setIsLoading(false); // Ocultar indicador de carga
    }
  };

  // --- Renderizado del Componente ---
  return (
    <div className="form-container"> {/* Usa una clase contenedora general */}
      <h2>Agregar Nuevo Producto</h2>

      {/* Muestra el mensaje de error si existe */}
      {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}

      <form onSubmit={handleSubmit} className="product-form"> {/* Clase específica para el form */}

        {/* Nombre */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nombre del Producto</label>
          <input type="text" id="name" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
        </div>

        {/* Modelo */}
        <div className="form-group">
          <label htmlFor="model" className="form-label">Modelo (opcional)</label>
          <input type="text" id="model" name="model" className="form-control" value={formData.model} onChange={handleChange} />
        </div>

        {/* Categoría Principal */}
        <div className="form-group">
          <label htmlFor="main_category" className="form-label">Categoría Principal</label>
          <div className="category-container">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  backgroundColor: formData.main_category === category.id ? '#e0f7fa' : '#ffffff', // Fondo azul claro si está seleccionada
                  color: '#000', // Texto negro
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
                onClick={() => setFormData({ ...formData, main_category: category.id, subcategory: '' })}
              >
                <span style={{ flex: 1 }}>{category.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que se seleccione la categoría al hacer clic en la "X"
                    handleDeleteCategory(category.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'red',
                    cursor: 'pointer',
                  }}
                  title={`Eliminar ${category.name}`}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nueva Categoría"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ marginTop: '0.5rem' }}
          />
          <button type="button" onClick={handleCreateCategory} style={{ marginTop: '0.5rem' }}>Crear</button>
        </div>

        {/* Subcategorías deshabilitadas */}

        {/* Opciones de Stock */}
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

          {/* Cantidad en Stock (condicional) */}
          {formData.stock_option === 'instock' && (
            <div className="form-group" style={{marginTop: '0.5rem'}}> {/* Añadir un poco de espacio */}
              <label htmlFor="stock_quantity" className="form-label">Cantidad en Stock</label>
              <input type="number" id="stock_quantity" name="stock_quantity" className="form-control" value={formData.stock_quantity} onChange={handleChange} min="0" required />
            </div>
          )}
        </div>

        {/* Precio con formateo en vivo */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">Precio (CLP)</label>
          <input
            type="text"
            id="price"
            name="price"
            className="form-control"
            value={formData.price === '' ? '' : formatCLP(formData.price)}
            onChange={(e) => handleChange(e)}
            required
            placeholder="$0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        {/* Imagen Principal */}
        <div className="form-group">
          <label htmlFor="main_image" className="form-label">Imagen Principal</label>
          <input
            type="file"
            id="main_image"
            name="main_image"
            className="form-control" // Usar clase consistente
            onChange={handleFileChange}
            accept="image/*" // Aceptar cualquier tipo de imagen
            required // La imagen principal es requerida
          />
          {/* Muestra la vista previa si existe */}
          {imagePreview && <img src={imagePreview} alt="Vista previa" className="image-upload-preview" style={{marginTop: '1rem', maxWidth: '200px', height: 'auto'}} />}
        </div>

        {/* Imagen Adicional 1 */}
        <div className="form-group">
          <label htmlFor="image_1" className="form-label">Imagen Adicional 1 (opcional)</label>
          <input
            type="file"
            id="image_1"
            name="image_1"
            className="form-control"
            onChange={handleFileChange}
            accept="image/*"
          />
          {/* Podrías añadir vistas previas para estas también si lo deseas */}
        </div>

        {/* Imagen Adicional 2 */}
        <div className="form-group">
          <label htmlFor="image_2" className="form-label">Imagen Adicional 2 (opcional)</label>
          <input
            type="file"
            id="image_2"
            name="image_2"
            className="form-control"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        {/* Galería de Imágenes (múltiples) */}
        <div className="form-group">
          <label htmlFor="additional_images" className="form-label">Galería (puedes seleccionar varias imágenes)</label>
          <input
            type="file"
            id="additional_images"
            name="additional_images"
            className="form-control"
            onChange={handleAdditionalImagesChange}
            accept="image/*"
            multiple
          />
          <small>Se permite subir varias imágenes (hasta 20 en total por producto).</small>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="descripcion" className="form-label">Descripción</label>
          <textarea id="descripcion" name="descripcion" className="form-control" value={formData.descripcion} onChange={handleChange} required />
        </div>

        {/* Diseño/Materiales eliminados: no existen en la base de datos */}

        {/* Includes */}
        <div className="form-group">
          <label htmlFor="incluye" className="form-label">Incluye</label>
          <textarea id="incluye" name="incluye" className="form-control" value={formData.incluye} onChange={handleChange} />
        </div>

        {/* Video URL */}
        <div className="form-group">
          <label htmlFor="video_url" className="form-label">Video URL (opcional)</label>
          <input type="url" id="video_url" name="video_url" className="form-control" placeholder="https://..." value={formData.video_url} onChange={handleChange} />
          <small>Ejemplo: enlace de YouTube o video alojado.</small>
        </div>

        {/* Colors */}
        <div className="form-group">
          <label className="form-label">Colores</label>
          {colors.map((color, index) => (
            <div key={index} className="color-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              {/* Circular color preview */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: color.color || '#ffffff',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  marginRight: '1rem',
                }}
                onClick={() => document.getElementById(`color-picker-${index}`).click()} // Trigger color picker on click
              ></div>

              {/* Hidden color picker */}
              <input
                type="color"
                id={`color-picker-${index}`}
                value={color.color}
                style={{ display: 'none' }}
                onChange={(e) => handleColorChange(index, 'color', e.target.value)}
              />

              {/* Image upload for the color */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleColorChange(index, 'image', e.target.files[0])}
                style={{ marginRight: '1rem' }}
              />

              {/* Remove color button */}
              <button type="button" onClick={() => handleRemoveColor(index)} className="btn btn-danger">
                Eliminar
              </button>
            </div>
          ))}
          {colors.length < 8 && (
            <button type="button" onClick={handleAddColor} className="btn btn-primary">
              Agregar Color
            </button>
          )}
        </div>

        {/* Botones de Acción */}
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
