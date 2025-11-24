// src/components/admin/EditarProducto.js
// (Tu código React proporcionado es robusto y maneja bien la carga y el envío)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que este CSS exista y tenga los estilos necesarios
import './AgregarProducto.css'; // Reutilizando estilos
import { backendUrl, mediaUrl } from '../../config/api';
import { formatCLP, parseCLPInput } from '../../utils/formatters';

function EditarProducto() {
  console.log("Renderizando EditarProducto..."); // Log inicial

  const { id } = useParams();
  console.log(`ID obtenido de useParams: ${id} (Tipo: ${typeof id})`); // Log descriptivo

  const navigate = useNavigate();

  // --- Estados ---
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    main_category: '', // Almacenará el ID de la categoría
    stock_option: 'preorder',
    stock_quantity: '',
    price: '',
    main_image: null, // Para el archivo nuevo, si se selecciona
    is_active: 1,     // Default a activo
    video_url: ''
  });
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // URL de la imagen actual
  const [imagePreview, setImagePreview] = useState(null); // Vista previa de la nueva imagen
  const [categories, setCategories] = useState([]); // Lista de categorías principales
  const [gallery, setGallery] = useState([]); // Imágenes existentes del producto
  const [additionalImages, setAdditionalImages] = useState([]); // Nuevas imágenes a agregar
  // Subcategorías deshabilitadas
  const [isLoading, setIsLoading] = useState(true); // Estado de carga general
  const [error, setError] = useState(null); // Mensaje de error para UI
  const [newCategory, setNewCategory] = useState('');
  const [colors, setColors] = useState([]); // Colores existentes del producto
  const [newColors, setNewColors] = useState([]); // Nuevos colores a agregar

  // --- Efecto para Cargar Datos Iniciales del Producto ---
  useEffect(() => {
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      console.error(`[Error Carga Inicial] ID de producto no válido en URL: '${id}'.`);
      setError(`ID de producto inválido: ${id}`);
      setIsLoading(false);
      return; // Detener si el ID no es válido
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`[Carga Inicial] Iniciando fetch para producto ID: ${parsedId}`);

      try {
        // Llamada GET al backend para obtener los datos
        const response = await fetch(backendUrl(`editar_producto.php?id=${parsedId}`), {
          credentials: 'include', // Enviar cookies de sesión
        });
        console.log(`[Carga Inicial] Respuesta recibida, status: ${response.status}`);

        // Leer como texto para depuración robusta
        const responseText = await response.text();
        console.log("[Carga Inicial] Texto de respuesta recibido:", responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

        let data;
        try {
          data = JSON.parse(responseText); // Intentar parsear JSON
        } catch (jsonError) {
          console.error("[Error Carga Inicial] Fallo al parsear JSON. Status:", response.status, "Error:", jsonError);
          throw new Error(`Respuesta inesperada del servidor (Status ${response.status}, no es JSON válido): ${responseText.substring(0, 200)}...`);
        }

        console.log("[Carga Inicial] Datos JSON parseados:", data);

        if (!response.ok) {
          console.error(`[Error Carga Inicial] Respuesta HTTP no OK. Status: ${response.status}`);
          throw new Error(data?.message || `Error en la solicitud al servidor (HTTP ${response.status})`);
        }

        // Verificar si el backend indicó éxito y envió los datos
        if (data.success && data.product) {
          const product = data.product;
          console.log("[Carga Inicial] Producto recibido:", product);

          // Actualizar estado del formulario con los datos recibidos
          setFormData({
            name: product.name || '',
            model: product.model || '',
            main_category: product.category_id || '', // ID de categoría
            stock_option: product.stock_option || 'preorder',
            // Asegurar que stock_quantity sea string para el input number
            stock_quantity: product.stock_quantity !== null ? String(product.stock_quantity) : '',
            price: product.price || '',
            main_image: null, // Resetear el campo de archivo
            // Convertir a 1 o 0 para el checkbox
            is_active: (product.is_active === 1 || product.is_active === '1') ? 1 : 0,
            video_url: product.video_url || ''
          });
          console.log("[Carga Inicial] Estado formData actualizado.");

          // Establecer URL de la imagen actual (si existe)
          const imageUrl = product.main_image ? mediaUrl(product.main_image) : '';
          setCurrentImageUrl(imageUrl);
          console.log("[Carga Inicial] URL de imagen actual establecida:", imageUrl || '(Ninguna)');

          // Cargar listas de categorías
          // Ocultar la categoría fallback "FALTA CATEGORIA" visualmente, a menos que el producto la tenga
          const originalCats = Array.isArray(data.categories) ? data.categories : [];
          const fallbackNameCheck = (n) => {
            if (!n) return false;
            const s = String(n).trim().toUpperCase();
            return s === 'FALTA CATEGORIA' || s === 'FALTA CATEGORÍA';
          };
          // Filtrar fuera fallback
          let visibleCats = originalCats.filter(c => !fallbackNameCheck(c.name));
          // Si el producto actual tiene la categoría fallback, incluirla (al inicio) para que siga apareciendo
          if (product && fallbackNameCheck(product.category_name)) {
            const fallbackCat = originalCats.find(c => fallbackNameCheck(c.name) || Number(c.id) === Number(product.category_id));
            if (fallbackCat) {
              // Evitar duplicados
              if (!visibleCats.some(c => Number(c.id) === Number(fallbackCat.id))) {
                visibleCats = [fallbackCat, ...visibleCats];
              }
            }
          }
          setCategories(visibleCats);
          console.log(`[Carga Inicial] Categorías visibles cargadas: ${visibleCats.length} (original: ${originalCats.length})`);

          // Cargar galería completa
          setGallery(Array.isArray(data.images) ? data.images : []);

          // Cargar colores existentes
          const existingColors = Array.isArray(data.colors) ? data.colors : [];
          setColors(existingColors);
          console.log(`[Carga Inicial] Colores cargados: ${existingColors.length}`, existingColors);

        } else {
          console.error("[Error Carga Inicial] Respuesta del backend no exitosa o faltan datos. Mensaje:", data?.message);
          throw new Error(data?.message || 'Los datos recibidos del servidor no son válidos o el producto no existe.');
        }
      } catch (err) {
        console.error('[Error Carga Inicial] Error detallado:', err);
        setError(`Error al cargar datos: ${err.message}`); // Mostrar error en UI
      } finally {
        setIsLoading(false); // Finalizar estado de carga
        console.log("[Carga Inicial] Proceso de carga finalizado.");
      }
    };

    fetchData(); // Ejecutar la función de carga
  }, [id]); // Dependencia: el ID de la URL

  // Subcategorías deshabilitadas: no cargar

  // --- Manejador de Cambios en Inputs y Selects ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'price') {
      if (value.trim() === '') {
        setFormData(prev => ({ ...prev, price: '' }));
        return;
      }
      const numeric = parseCLPInput(value);
      setFormData(prev => ({ ...prev, price: numeric }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      // Manejar checkbox (is_active) y otros inputs
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // --- Manejador: nuevas imágenes adicionales (múltiples) ---
  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(files);
  };

  // --- Manejador de Cambio de Archivo (Imagen) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Obtener el archivo seleccionado
    if (file) {
      // Guardar el archivo en el estado
      setFormData((prev) => ({ ...prev, main_image: file }));
      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // URL de datos para <img>
      reader.readAsDataURL(file);
    } else {
      // Si el usuario cancela, limpiar el archivo y la vista previa
      setFormData((prev) => ({ ...prev, main_image: null }));
      setImagePreview(null);
    }
  };

  // --- Crear categoría ---
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await fetch(backendUrl('create_category.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCategory.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }
      // Agregar a la lista y seleccionar la nueva categoría
      setCategories((prev) => [...prev, data.category]);
      setFormData((prev) => ({ ...prev, main_category: data.category.id, subcategory: '' }));
      setNewCategory('');
    } catch (err) {
      console.error('Error creando categoría:', err);
      setError(`No se pudo crear la categoría: ${err.message}`);
    }
  };

  // --- Eliminar categoría seleccionada ---
  const handleDeleteCategory = async () => {
    if (!formData.main_category) return;
    const categoryId = Number(formData.main_category);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      console.error('handleDeleteCategory: category_id inválido', formData.main_category);
      setError('Categoría seleccionada inválida.');
      return;
    }
    if (!window.confirm('¿Eliminar la categoría seleccionada?')) return;
    try {
      const response = await fetch(backendUrl('delete_category.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_id: categoryId })
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = { success: false, message: text }; }
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }
      // Quitar de la lista y limpiar selección
      setCategories((prev) => prev.filter(c => Number(c.id) !== categoryId));
      setFormData((prev) => ({ ...prev, main_category: '', subcategory: '' }));
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      setError(`No se pudo eliminar la categoría: ${err.message}`);
    }
  };

  // --- Funciones para gestionar colores ---
  const handleAddColor = () => {
    if (newColors.length < 8) {
      setNewColors([...newColors, { color: '', image: null }]);
    }
  };

  const handleColorChange = (index, field, value) => {
    const updatedColors = [...newColors];
    updatedColors[index][field] = value;
    setNewColors(updatedColors);
  };

  const handleRemoveNewColor = (index) => {
    setNewColors(newColors.filter((_, i) => i !== index));
  };

  const handleDeleteExistingColor = async (colorId) => {
    if (!window.confirm('¿Eliminar este color?')) return;
    try {
      const response = await fetch(backendUrl('manage_product_colors.php'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color_id: colorId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }
      // Quitar del estado local
      setColors(colors.filter(c => c.id !== colorId));
    } catch (err) {
      console.error('Error eliminando color:', err);
      setError(`No se pudo eliminar el color: ${err.message}`);
    }
  };

  // --- Eliminar imagen de galería ---
  const handleDeleteGalleryImage = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen de la galería?')) return;
    try {
      const response = await fetch(backendUrl('delete_gallery_image.php'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image_id: imageId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }
      // Quitar del estado local
      setGallery(gallery.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Error eliminando imagen:', err);
      setError(`No se pudo eliminar la imagen: ${err.message}`);
    }
  };

  // Subcategorías deshabilitadas
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir recarga
    setIsLoading(true); // Iniciar carga
    setError(null); // Limpiar errores previos
    console.log("[Submit] Iniciando envío de formulario...");

    // Crear FormData para enviar datos (incluyendo el archivo si existe)
    const formDataToSend = new FormData();
    formDataToSend.append('id', id); // ¡Importante enviar el ID!

    // Recorrer el estado formData y añadir al FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'main_image') {
        // Añadir el archivo solo si es una instancia de File (o sea, si se seleccionó uno nuevo)
        if (value instanceof File) {
          formDataToSend.append(key, value);
        }
        // Si es null (no se seleccionó nuevo), no se envía, el backend mantendrá la imagen actual
      } else if (value !== null && value !== '') {
        // Añadir otros campos si no son null o vacíos
        formDataToSend.append(key, value);
      } else if (key === 'subcategory' && value === '') {
        // Asegurarse de enviar subcategoría vacía si se deseleccionó
        formDataToSend.append(key, '');
      }
    });

    // Adjuntar nuevas imágenes adicionales
    if (additionalImages.length > 0) {
      additionalImages.forEach((file) => {
        if (file) formDataToSend.append('additional_images[]', file);
      });
    }

    // Adjuntar nuevos colores
    if (newColors.length > 0) {
      newColors.forEach((color, index) => {
        if (color.color) {
          formDataToSend.append(`new_colors[${index}][hex]`, color.color);
          formDataToSend.append(`new_colors[${index}][name]`, color.color);

          // Adjuntar imagen del color si existe
          if (color.image instanceof File) {
            formDataToSend.append(`new_color_image_${index}`, color.image);
          }
        }
      });
    }

    // Log para depuración (opcional)
    // console.log("[Submit] FormData a enviar:");
    // for (let [key, value] of formDataToSend.entries()) { console.log(`  ${key}:`, value instanceof File ? value.name : value); }

    try {
      // Llamada POST al backend para actualizar
      const response = await fetch(backendUrl('editar_producto.php'), {
        method: 'POST',
        credentials: 'include', // Enviar cookies
        body: formDataToSend // Enviar FormData
      });
      console.log(`[Submit] Respuesta recibida, status: ${response.status}`);

      // Leer como texto para manejo robusto de errores
      const responseText = await response.text();
      console.log("[Submit] Texto de respuesta recibido:", responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

      let data;
      try { data = JSON.parse(responseText); } // Intentar parsear
      catch (jsonError) {
        throw new Error(`Respuesta inesperada del servidor al actualizar (Status ${response.status}, no es JSON): ${responseText.substring(0, 200)}...`);
      }

      console.log("[Submit] Datos JSON parseados:", data);

      if (!response.ok) {
        console.error(`[Error Submit] Respuesta HTTP no OK. Status: ${response.status}`);
        throw new Error(data?.message || `Error al actualizar (HTTP ${response.status})`);
      }
      // Verificar el flag 'success' del backend
      if (data.success) {
        // Actualizar galería si el backend agregó imágenes
        if (typeof data.gallery_added === 'number' && data.gallery_added > 0) {
          // Forzar recarga de datos para reflejar nuevas imágenes
          window.setTimeout(() => window.location.reload(), 300);
        }
        console.log("[Submit] Producto actualizado con éxito.");
        alert('Producto actualizado con éxito'); // Mensaje para el usuario
        navigate('/admin/productos'); // Redirigir a la lista
      } else {
        console.error("[Error Submit] Respuesta del backend no exitosa. Mensaje:", data?.message);
        throw new Error(data?.message || 'Error desconocido al actualizar el producto.');
      }
    } catch (error) {
      console.error('[Error Submit] Error detallado:', error);
      setError(`Error al actualizar: ${error.message}`); // Mostrar error en la UI
    } finally {
      setIsLoading(false); // Finalizar carga
      console.log("[Submit] Proceso de envío finalizado.");
    }
  };

  // --- Renderizado Condicional (Carga/Error) ---
  if (isLoading && !error) { // Mostrar carga solo si no hay error todavía
    return <div className="form-container"><p>Cargando datos del producto...</p></div>;
  }
  // Si hay error (incluso durante la carga), se mostrará en el form

  // --- Renderizado del Formulario ---
  // Determinar si la categoría seleccionada es la fallback (para deshabilitar eliminación)
  const selectedCategoryObj = categories.find(c => String(c.id) === String(formData.main_category));
  const isSelectedFallback = selectedCategoryObj && (String(selectedCategoryObj.name || '').trim().toUpperCase() === 'FALTA CATEGORIA' || String(selectedCategoryObj.name || '').trim().toUpperCase() === 'FALTA CATEGORÍA');
  return (
    <div className="form-container">
      <h2>Editar Producto (ID: {id})</h2>
      {/* Mostrar error si existe */}
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</div>}

      <form onSubmit={handleSubmit} className="product-form">
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

        {/* Categoría y Subcategoría (lado a lado) */}
        <div className="form-group-dual">
          <div className="form-group">
            <label htmlFor="main_category" className="form-label">Categoría Principal</label>
            <select id="main_category" name="main_category" className="form-select" value={formData.main_category} onChange={handleChange} required>
              <option value="">Seleccione una categoría</option>
              {/* Mapear categorías principales */}
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {/* Crear/Eliminar categoría */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Nueva categoría"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="form-control"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-primary" onClick={handleCreateCategory}>
                Crear categoría
              </button>
            </div>
            <button
              type="button"
              style={{ marginTop: '0.5rem' }}
              onClick={handleDeleteCategory}
              disabled={!formData.main_category || isSelectedFallback}
              title={isSelectedFallback ? 'No se puede eliminar la categoría de fallback desde aquí' : ''}
            >
              Eliminar categoría seleccionada
            </button>
          </div>
          {/* Subcategorías deshabilitadas */}
        </div>

        {/* Opciones de Stock y Cantidad (lado a lado) */}
        <div className="form-group-dual">
          <div className="form-group">
            <div className="form-label">Opciones de Stock</div>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="stock_option" value="preorder" checked={formData.stock_option === 'preorder'} onChange={handleChange} /> Por encargo
              </label>
              <label className="radio-option">
                <input type="radio" name="stock_option" value="instock" checked={formData.stock_option === 'instock'} onChange={handleChange} /> En stock
              </label>
            </div>
          </div>
          {/* Mostrar cantidad solo si 'En stock' está seleccionado */}
          {formData.stock_option === 'instock' && (
            <div className="form-group">
              <label htmlFor="stock_quantity" className="form-label">Cantidad en Stock</label>
              <input type="number" id="stock_quantity" name="stock_quantity" className="form-control" value={formData.stock_quantity} onChange={handleChange} min="0" required />
            </div>
          )}
        </div>

        {/* Precio */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">Precio (CLP)</label>
          <input
            type="text"
            id="price"
            name="price"
            className="form-control"
            value={formData.price === '' ? '' : formatCLP(formData.price)}
            onChange={handleChange}
            required
            placeholder="$0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        {/* Estado (Activo/Inactivo) */}
        <div className="form-group">
          <div className="form-label">Estado</div>
          <div className="checkbox-group">
            <label className="checkbox-option">
              <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} /> Activo (visible en la tienda)
            </label>
          </div>
        </div>

        {/* Video URL */}
        <div className="form-group">
          <label htmlFor="video_url" className="form-label">Video URL (opcional)</label>
          <input type="url" id="video_url" name="video_url" className="form-control" placeholder="https://..." value={formData.video_url} onChange={handleChange} />
        </div>

        {/* Imagen Principal */}
        <div className="form-group">
          <label htmlFor="main_image" className="form-label">Imagen Principal</label>
          {/* Mostrar vista previa de nueva imagen O imagen actual */}
          {(imagePreview || currentImageUrl) && (
            <img
              src={imagePreview || currentImageUrl} // Prioriza la vista previa nueva
              alt={imagePreview ? "Vista previa nueva imagen" : "Imagen actual"}
              className="image-upload-preview"
              style={{ display: 'block', marginBottom: '1rem', maxWidth: '200px', height: 'auto' }}
            />
          )}
          <input
            type="file"
            id="main_image"
            name="main_image"
            className="form-control"
            onChange={handleFileChange}
            accept="image/*" // Aceptar cualquier tipo de imagen
          />
          <small>Selecciona una nueva imagen solo si deseas reemplazar la actual.</small>
        </div>

        {/* Galería de Imágenes Existentes */}
        {gallery.length > 0 && (
          <div className="form-group">
            <div className="form-label">Galería Actual ({gallery.length} imagen(es))</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              {gallery.map((img) => (
                <div key={img.id} style={{ position: 'relative', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={mediaUrl(img.path)}
                    alt="Galería"
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  {img.is_cover === 1 && (
                    <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0, 200, 0, 0.8)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      Portada
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryImage(img.id)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(255, 0, 0, 0.8)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} {/* Agregar nuevas imágenes a la galería */}
        <div className="form-group">
          <label htmlFor="additional_images" className="form-label">Agregar a Galería (puedes seleccionar varias)</label>
          <input
            type="file"
            id="additional_images"
            name="additional_images"
            className="form-control"
            onChange={handleAdditionalImagesChange}
            accept="image/*"
            multiple
          />
        </div>

        {/* Colores Existentes y Nuevos */}
        <div className="form-group">
          <div className="form-label">Colores del Producto</div>

          {/* Colores existentes */}
          {colors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Colores actuales:</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {colors.map((color) => (
                  <div
                    key={color.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: color.color_hex,
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}
                      title={color.color_name || color.color_hex}
                    />
                    {color.image_path && (
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>📷</div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingColor(color.id)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.7)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nuevos colores */}
          {newColors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Nuevos colores:</div>
              {newColors.map((color, index) => (
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
                    onClick={() => document.getElementById(`new-color-picker-${index}`).click()}
                  ></div>

                  {/* Hidden color picker */}
                  <input
                    type="color"
                    id={`new-color-picker-${index}`}
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
                  <button type="button" onClick={() => handleRemoveNewColor(index)} className="btn btn-danger">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón agregar color */}
          {newColors.length < 8 && (
            <button type="button" onClick={handleAddColor} className="btn btn-primary">
              Agregar Color
            </button>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/productos')} disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarProducto;
