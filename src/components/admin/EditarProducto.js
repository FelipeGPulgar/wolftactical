// src/components/admin/EditarProducto.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AgregarProducto.css'; // Asegúrate que los estilos sean adecuados

function EditarProducto() {
  console.log("Renderizando EditarProducto..."); // Log inicial

  const { id } = useParams();
  // Log más descriptivo para el ID
  console.log(`ID obtenido de useParams: ${id} (Tipo: ${typeof id})`);

  const navigate = useNavigate();

  // --- Estados (sin cambios) ---
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    main_category: '',
    subcategory: '',
    stock_option: 'preorder',
    stock_quantity: '',
    price: '',
    main_image: null,
    is_active: 1,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Efecto para Cargar Datos Iniciales ---
  useEffect(() => {
    // Validación robusta del ID
    const parsedId = parseInt(id); // Parsear una sola vez
    if (!id || isNaN(parsedId) || parsedId <= 0) {
        // Log específico si el ID es inválido
        console.error(`[Error Carga Inicial] ID de producto no válido en URL: '${id}'. No se iniciará la carga.`);
        setError(`ID de producto inválido: ${id}`); // Mostrar error claro en UI
        setIsLoading(false);
        return; // No continuar
    }

    const fetchData = async () => {
      // Reiniciar estado antes de cada fetch
      setIsLoading(true);
      setError(null);
      console.log(`[Carga Inicial] Iniciando fetch para producto ID: ${parsedId}`);

      try {
        const response = await fetch(`http://localhost/schizotactical/backend/editar_producto.php?id=${parsedId}`, {
             credentials: 'include',
        });
        // Log del estado HTTP recibido
        console.log(`[Carga Inicial] Respuesta recibida, status: ${response.status}`);

        // Leer como texto para depuración robusta
        const responseText = await response.text();
        // Log del texto crudo (útil si no es JSON)
        console.log("[Carga Inicial] Texto de respuesta recibido:", responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')); // Limitar log largo

        let data;
        try {
            data = JSON.parse(responseText); // Intentar parsear
        } catch (jsonError) {
            // Error específico si el parseo JSON falla
            console.error("[Error Carga Inicial] Fallo al parsear JSON. Status:", response.status, "Error:", jsonError);
            // Lanzar un error que incluya el inicio de la respuesta inválida
            throw new Error(`Respuesta inesperada del servidor (Status ${response.status}, no es JSON válido): ${responseText.substring(0, 200)}...`);
        }

        // Log de los datos parseados
        console.log("[Carga Inicial] Datos JSON parseados:", data);

        // Verificar si la respuesta de red fue OK (status 2xx)
        if (!response.ok) {
           // Error específico si el status no es 2xx
           console.error(`[Error Carga Inicial] Respuesta HTTP no OK. Status: ${response.status}`);
           // Usar mensaje del backend si existe, sino mensaje genérico
           throw new Error(data?.message || `Error en la solicitud al servidor (HTTP ${response.status})`);
        }

        // Verificar si el backend indicó éxito y envió los datos del producto
        if (data.success && data.product) {
          const product = data.product;
          console.log("[Carga Inicial] Producto recibido:", product);

          // Actualizar el estado del formulario (sin cambios en la lógica)
          setFormData({
            name: product.name || '',
            model: product.model || '',
            main_category: product.category_id || '',
            subcategory: product.subcategory_id || '',
            stock_option: product.stock_option || 'preorder',
            stock_quantity: product.stock_quantity !== null ? String(product.stock_quantity) : '',
            price: product.price || '',
            main_image: null,
            is_active: (product.is_active === 1 || product.is_active === '1') ? 1 : 0,
          });
          console.log("[Carga Inicial] Estado formData actualizado.");

          // Establecer la URL de la imagen actual
          const imageUrl = product.main_image ? `http://localhost/schizotactical/backend/${product.main_image}` : '';
          setCurrentImageUrl(imageUrl);
          console.log("[Carga Inicial] URL de imagen actual establecida:", imageUrl || '(Ninguna)');

          // Cargar las listas de categorías y subcategorías
          setCategories(data.categories || []);
          setSubcategories(data.subcategories || []);
          console.log(`[Carga Inicial] Categorías cargadas: ${data.categories?.length || 0}, Subcategorías iniciales: ${data.subcategories?.length || 0}`);

        } else {
          // Error específico si success es false o falta product
          console.error("[Error Carga Inicial] Respuesta del backend no exitosa o faltan datos del producto. Mensaje:", data?.message);
          throw new Error(data?.message || 'Los datos recibidos del servidor no son válidos o el producto no existe.');
        }
      } catch (err) {
        // Captura cualquier error durante el fetch o procesamiento
        // Loguea el error completo en la consola para depuración
        console.error('[Error Carga Inicial] Error detallado:', err);
        // Establece el mensaje de error para mostrar en la UI
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        // Se ejecuta siempre, al finalizar el try o el catch
        setIsLoading(false);
        console.log("[Carga Inicial] Proceso de carga finalizado.");
      }
    };

    fetchData(); // Ejecutar la carga
  }, [id]); // Dependencia: el ID del producto

  // --- Efecto para Cargar Subcategorías dinámicamente (sin cambios, ya tiene buen logging) ---
  useEffect(() => {
    if (!isLoading && formData.main_category) {
      const fetchSubcategories = async () => {
        console.log(`[Subcategorías] Cargando para category_id: ${formData.main_category}`);
        setSubcategories([]);
        try {
          const response = await fetch(`http://localhost/schizotactical/backend/get_subcategories.php?category_id=${formData.main_category}`);
          if (!response.ok) {
             console.error(`[Error Subcategorías] Respuesta HTTP no OK. Status: ${response.status}`);
             throw new Error(`Error HTTP ${response.status}`);
          }
          const data = await response.json();
          console.log("[Subcategorías] Respuesta recibida:", data);
          if (Array.isArray(data)) {
             setSubcategories(data);
          } else if (data.success && Array.isArray(data.data)) {
             setSubcategories(data.data);
          } else {
             console.warn("[Subcategorías] Formato inesperado, estableciendo vacío.");
             setSubcategories([]);
          }
        } catch (err) {
          console.error('[Error Subcategorías] Error detallado:', err);
          setSubcategories([]);
        }
      };
      fetchSubcategories();
    } else if (!formData.main_category) {
        setSubcategories([]);
    }
  }, [formData.main_category, isLoading]);

  // --- Manejadores (handleChange, handleFileChange - sin cambios) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
      ...(name === 'main_category' ? { subcategory: '' } : {})
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, main_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, main_image: null }));
      setImagePreview(null);
    }
  };

  // --- Manejador de Envío del Formulario (Actualización - con logging mejorado) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("[Submit] Iniciando envío de formulario...");

    const formDataToSend = new FormData();
    formDataToSend.append('id', id);
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'main_image') {
        if (value instanceof File) {
          formDataToSend.append(key, value);
        }
      } else if (value !== null && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    // Log para ver qué se envía (descomentar si es necesario)
    // console.log("[Submit] FormData a enviar:");
    // for (let [key, value] of formDataToSend.entries()) { console.log(`  ${key}:`, value instanceof File ? value.name : value); }

    try {
      const response = await fetch('http://localhost/schizotactical/backend/editar_producto.php', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });
      console.log(`[Submit] Respuesta recibida, status: ${response.status}`);

      const responseText = await response.text();
      console.log("[Submit] Texto de respuesta recibido:", responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

      let data;
      try { data = JSON.parse(responseText); }
      catch (jsonError) {
          console.error("[Error Submit] Fallo al parsear JSON. Status:", response.status, "Error:", jsonError);
          throw new Error(`Respuesta inesperada del servidor al actualizar (Status ${response.status}, no es JSON): ${responseText.substring(0, 200)}...`);
      }

      console.log("[Submit] Datos JSON parseados:", data);

      if (!response.ok) {
        console.error(`[Error Submit] Respuesta HTTP no OK. Status: ${response.status}`);
        throw new Error(data?.message || `Error al actualizar (HTTP ${response.status})`);
      }
      if (data.success) {
        console.log("[Submit] Producto actualizado con éxito.");
        alert('Producto actualizado con éxito');
        navigate('/admin/productos');
      } else {
        console.error("[Error Submit] Respuesta del backend no exitosa. Mensaje:", data?.message);
        throw new Error(data?.message || 'Error desconocido al actualizar el producto.');
      }
    } catch (error) {
      console.error('[Error Submit] Error detallado:', error);
      setError(`Error al actualizar: ${error.message}`); // Mostrar error en UI
    } finally {
      setIsLoading(false);
      console.log("[Submit] Proceso de envío finalizado.");
    }
  };

  // --- Renderizado (sin cambios en la estructura JSX) ---
  if (isLoading && !error) {
    return <div className="form-container"><p>Cargando datos del producto...</p></div>;
  }

  return (
    <div className="form-container">
      <h2>Editar Producto (ID: {id})</h2>
      {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>Error: {error}</div>}
      <form onSubmit={handleSubmit}>
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
        {/* Categoría y Subcategoría */}
        <div className="form-group-dual">
          <div className="form-group">
            <label htmlFor="main_category" className="form-label">Categoría Principal</label>
            <select id="main_category" name="main_category" className="form-select" value={formData.main_category} onChange={handleChange} required>
              <option value="">Seleccione una categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="subcategory" className="form-label">Subcategoría</label>
            <select id="subcategory" name="subcategory" className="form-select" value={formData.subcategory} onChange={handleChange} disabled={!formData.main_category}>
              <option value="">
                {formData.main_category
                  ? (subcategories.length > 0 ? 'Seleccione subcategoría (opcional)' : 'Sin subcategorías')
                  : 'Seleccione categoría primero'}
              </option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Stock */}
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
        {/* Estado */}
        <div className="form-group">
             <label className="form-label">Estado</label>
             <div className="checkbox-group">
               <label className="checkbox-option">
                 <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} /> Activo (visible en la tienda)
               </label>
             </div>
        </div>
        {/* Imagen Principal */}
        <div className="form-group">
          <label htmlFor="main_image" className="form-label">Imagen Principal</label>
          {(imagePreview || currentImageUrl) && (
             <img
               src={imagePreview || currentImageUrl}
               alt={imagePreview ? "Vista previa nueva imagen" : "Imagen actual"}
               className="image-upload-preview"
               style={{ display: 'block', marginBottom: '1rem', maxWidth: '200px', height: 'auto' }}
             />
          )}
          <input type="file" id="main_image" name="main_image" className="form-control" onChange={handleFileChange} accept="image/*" />
          <small>Selecciona una nueva imagen solo si deseas reemplazar la actual.</small>
        </div>
        {/* Acciones */}
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
