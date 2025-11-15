// src/components/admin/EditarProducto.js
// (Tu código React proporcionado es robusto y maneja bien la carga y el envío)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que este CSS exista y tenga los estilos necesarios
import './AgregarProducto.css'; // Reutilizando estilos
import { backendUrl, mediaUrl } from '../../config/api';

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
          setCategories(data.categories || []);
          console.log(`[Carga Inicial] Categorías cargadas: ${data.categories?.length || 0}`);

          // Cargar galería completa
              setGallery(Array.isArray(data.images) ? data.images : []);

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
    if (!formData.main_category) return;
    if (!window.confirm('¿Eliminar la categoría seleccionada?')) return;
    try {
      const response = await fetch(backendUrl('delete_category.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_id: formData.main_category })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }
      // Quitar de la lista y limpiar selección
      setCategories((prev) => prev.filter(c => c.id !== Number(formData.main_category)));
      setFormData((prev) => ({ ...prev, main_category: '', subcategory: '' }));
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      setError(`No se pudo eliminar la categoría: ${err.message}`);
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
  return (
    <div className="form-container">
      <h2>Editar Producto (ID: {id})</h2>
      {/* Mostrar error si existe */}
      {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>Error: {error}</div>}

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
                        <img
                          src={mediaUrl(img.path)}
              style={{ marginTop: '0.5rem' }}
              onClick={handleDeleteCategory}
              disabled={!formData.main_category}
            >
              Eliminar categoría seleccionada
            </button>
          </div>
          {/* Subcategorías deshabilitadas */}
        </div>

        {/* Opciones de Stock y Cantidad (lado a lado) */}
        <div className="form-group-dual">
           <div className="form-group">
             <label className="form-label">Opciones de Stock</label>
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
          <input type="number" id="price" name="price" className="form-control" value={formData.price} onChange={handleChange} min="0" step="any" required />
        </div>

        {/* Estado (Activo/Inactivo) */}
        <div className="form-group">
             <label className="form-label">Estado</label>
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

        {/* Galería existente (solo lectura en esta versión) */}
        <div className="form-group">
          <label className="form-label">Galería Actual</label>
          <div className="image-upload-container">
            {gallery.length === 0 && <div style={{color: '#6c757d'}}>No hay imágenes adicionales.</div>}
            {gallery.map((img) => (
              <div key={img.id} className="image-upload-box">
                <img
                  src={mediaUrl(img.path)}
                  alt={formData.name}
                  className="image-upload-preview"
                  style={{ height: '150px' }}
                />
                <small>{img.is_cover ? 'Portada' : `Orden: ${img.sort_order}`}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Agregar nuevas imágenes a la galería */}
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
