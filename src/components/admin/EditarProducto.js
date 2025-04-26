// src/components/admin/EditarProducto.js
// (Tu código React proporcionado es robusto y maneja bien la carga y el envío)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que este CSS exista y tenga los estilos necesarios
import './AgregarProducto.css'; // Reutilizando estilos

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
    subcategory: '',   // Almacenará el ID de la subcategoría
    stock_option: 'preorder',
    stock_quantity: '',
    price: '',
    main_image: null, // Para el archivo nuevo, si se selecciona
    is_active: 1,     // Default a activo
  });
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // URL de la imagen actual
  const [imagePreview, setImagePreview] = useState(null); // Vista previa de la nueva imagen
  const [categories, setCategories] = useState([]); // Lista de categorías principales
  const [subcategories, setSubcategories] = useState([]); // Lista de subcategorías (dinámica)
  const [isLoading, setIsLoading] = useState(true); // Estado de carga general
  const [error, setError] = useState(null); // Mensaje de error para UI

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
        const response = await fetch(`http://localhost/schizotactical/backend/editar_producto.php?id=${parsedId}`, {
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
            subcategory: product.subcategory_id || '', // ID de subcategoría
            stock_option: product.stock_option || 'preorder',
            // Asegurar que stock_quantity sea string para el input number
            stock_quantity: product.stock_quantity !== null ? String(product.stock_quantity) : '',
            price: product.price || '',
            main_image: null, // Resetear el campo de archivo
            // Convertir a 1 o 0 para el checkbox
            is_active: (product.is_active === 1 || product.is_active === '1') ? 1 : 0,
          });
          console.log("[Carga Inicial] Estado formData actualizado.");

          // Establecer URL de la imagen actual (si existe)
          const imageUrl = product.main_image ? `http://localhost/schizotactical/backend/${product.main_image}` : '';
          setCurrentImageUrl(imageUrl);
          console.log("[Carga Inicial] URL de imagen actual establecida:", imageUrl || '(Ninguna)');

          // Cargar listas de categorías y subcategorías iniciales
          setCategories(data.categories || []);
          // Las subcategorías recibidas son las de la categoría actual del producto
          setSubcategories(data.subcategories || []);
          console.log(`[Carga Inicial] Categorías cargadas: ${data.categories?.length || 0}, Subcategorías iniciales: ${data.subcategories?.length || 0}`);

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

  // --- Efecto para Cargar Subcategorías dinámicamente ---
  useEffect(() => {
    // Solo ejecutar si no estamos en la carga inicial y hay una categoría seleccionada
    if (!isLoading && formData.main_category) {
      const fetchSubcategories = async () => {
        console.log(`[Subcategorías] Cargando para category_id: ${formData.main_category}`);
        // Limpiar subcategorías actuales mientras se cargan las nuevas
        setSubcategories([]);
        try {
          // Llamada GET al endpoint de subcategorías
          const response = await fetch(`http://localhost/schizotactical/backend/get_subcategories.php?category_id=${formData.main_category}`, {
              credentials: 'include' // Importante si requiere sesión
          });
          if (!response.ok) {
             console.error(`[Error Subcategorías] Respuesta HTTP no OK. Status: ${response.status}`);
             throw new Error(`Error HTTP ${response.status}`);
          }
          const data = await response.json();
          console.log("[Subcategorías] Respuesta recibida:", data);
          // Manejar diferentes formatos de respuesta posibles
          if (Array.isArray(data)) {
             setSubcategories(data);
          } else if (data.success && Array.isArray(data.data)) {
             setSubcategories(data.data);
          } else {
             console.warn("[Subcategorías] Formato inesperado, estableciendo vacío.");
             setSubcategories([]); // Dejar vacío si no hay o el formato es incorrecto
          }
        } catch (err) {
          console.error('[Error Subcategorías] Error detallado:', err);
          setSubcategories([]); // Asegurar array vacío en caso de error
        }
      };
      fetchSubcategories();
    } else if (!formData.main_category) {
        // Si no hay categoría principal, limpiar las subcategorías
        setSubcategories([]);
    }
    // Dependencias: se ejecuta si cambia la categoría principal o finaliza la carga inicial
  }, [formData.main_category, isLoading]);

  // --- Manejador de Cambios en Inputs y Selects ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      // Manejar checkbox (is_active) y otros inputs
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
      // Si cambia la categoría principal, resetear la subcategoría seleccionada
      ...(name === 'main_category' ? { subcategory: '' } : {})
    }));
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

  // --- Manejador de Envío del Formulario (Actualización) ---
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

    // Log para depuración (opcional)
    // console.log("[Submit] FormData a enviar:");
    // for (let [key, value] of formDataToSend.entries()) { console.log(`  ${key}:`, value instanceof File ? value.name : value); }

    try {
      // Llamada POST al backend para actualizar
      const response = await fetch('http://localhost/schizotactical/backend/editar_producto.php', {
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
          console.error("[Error Submit] Fallo al parsear JSON. Status:", response.status, "Error:", jsonError);
          throw new Error(`Respuesta inesperada del servidor al actualizar (Status ${response.status}, no es JSON): ${responseText.substring(0, 200)}...`);
      }

      console.log("[Submit] Datos JSON parseados:", data);

      if (!response.ok) {
        console.error(`[Error Submit] Respuesta HTTP no OK. Status: ${response.status}`);
        throw new Error(data?.message || `Error al actualizar (HTTP ${response.status})`);
      }
      // Verificar el flag 'success' del backend
      if (data.success) {
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
          </div>
          <div className="form-group">
            <label htmlFor="subcategory" className="form-label">Subcategoría</label>
            <select
              id="subcategory"
              name="subcategory"
              className="form-select"
              value={formData.subcategory}
              onChange={handleChange}
              disabled={!formData.main_category} // Deshabilitar si no hay categoría principal
            >
              <option value="">
                {/* Texto dinámico en la opción por defecto */}
                {formData.main_category
                  ? (subcategories.length > 0 ? 'Seleccione subcategoría (opcional)' : 'Sin subcategorías')
                  : 'Seleccione categoría primero'}
              </option>
              {/* Mapear subcategorías disponibles */}
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
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
