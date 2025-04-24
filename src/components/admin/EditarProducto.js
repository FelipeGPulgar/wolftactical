// src/components/admin/EditarProducto.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que este CSS exista y tenga los estilos adecuados
import './AgregarProducto.css';

function EditarProducto() {
  console.log("Renderizando EditarProducto..."); // Log inicial

  const { id } = useParams();
  console.log("ID de useParams:", id); // Log del ID

  const navigate = useNavigate();

  // --- Estados ---
  const [formData, setFormData] = useState({
    name: '', model: '', main_category: '', subcategory: '',
    stock_option: 'preorder', stock_quantity: '', price: '',
    main_image: null, is_active: 1,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Efecto para Cargar Datos Iniciales ---
  useEffect(() => {
    // Asegurarse de que tenemos un ID válido antes de hacer fetch
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) { // Validación más robusta del ID
        console.error("ID de producto no válido en los parámetros de la URL:", id);
        setError("ID de producto no válido.");
        setIsLoading(false);
        return; // No continuar si no hay ID válido
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`Iniciando fetch para producto ID: ${id}`);

      try {
        const response = await fetch(`http://localhost/schizotactical/backend/editar_producto.php?id=${id}`, {
             credentials: 'include', // Envía cookies
        });
        console.log("Respuesta recibida, status:", response.status); // Log del estado HTTP

        // Leer la respuesta como texto para poder analizarla incluso si no es JSON válido
        const responseText = await response.text();
        console.log("Texto de respuesta recibido:", responseText); // Log del texto crudo

        let data;
        try {
            // Intentar parsear el texto como JSON
            data = JSON.parse(responseText);
        } catch (jsonError) {
            // Si falla el parseo, es un error grave (probablemente error PHP no controlado)
            console.error("Error al parsear JSON:", jsonError, "Respuesta:", responseText);
            throw new Error(`Respuesta inesperada del servidor (no es JSON válido): ${responseText.substring(0, 200)}...`);
        }

        console.log("Datos JSON parseados:", data); // Log de los datos parseados

        // Verificar si la respuesta de red fue OK (status 2xx)
        if (!response.ok) {
          // Si el status no es OK, usar el mensaje del JSON si existe, o crear uno
          throw new Error(data.message || `Error HTTP: ${response.status}`);
        }

        // Verificar si el backend indicó éxito y envió los datos del producto
        if (data.success && data.product) {
          const product = data.product;
          console.log("Producto recibido:", product); // Log del objeto producto

          // Actualizar el estado del formulario
          setFormData({
            name: product.name || '',
            model: product.model || '',
            main_category: product.category_id || '', // Usar ID
            subcategory: product.subcategory_id || '', // Usar ID
            stock_option: product.stock_option || 'preorder',
            stock_quantity: product.stock_quantity !== null ? product.stock_quantity : '',
            price: product.price || '',
            main_image: null, // Input file se maneja por separado
            is_active: (product.is_active === 1 || product.is_active === '1') ? 1 : 0, // Asegurar 1 o 0
          });
          console.log("Estado formData actualizado"); // Confirmación

          // Actualizar otros estados
          setCurrentImageUrl(product.main_image ? `http://localhost/schizotactical/backend/${product.main_image}` : '');
          setCategories(data.categories || []);
          setSubcategories(data.subcategories || []);
        } else {
          // Si success es false o falta product
          throw new Error(data.message || 'Los datos recibidos del servidor no son válidos o el producto no existe.');
        }
      } catch (err) {
        // Captura cualquier error durante el fetch o procesamiento
        console.error('Error detallado al cargar datos:', err);
        setError(err.message); // Guarda el error para mostrarlo
      } finally {
        // Se ejecuta siempre
        setIsLoading(false);
        console.log("Carga finalizada (fetchData)"); // Log de finalización
      }
    };

    fetchData(); // Ejecuta la carga de datos
  }, [id]); // Dependencia: se re-ejecuta si el ID cambia

  // --- Efecto para Cargar Subcategorías (cuando cambia la categoría principal) ---
  useEffect(() => {
    // No ejecutar en la carga inicial (isLoading es true) o si no hay categoría seleccionada
    if (!isLoading && formData.main_category) {
      const fetchSubcategories = async () => {
        console.log(`Cargando subcategorías para category_id: ${formData.main_category}`);
        try {
          const response = await fetch(`http://localhost/schizotactical/backend/get_subcategories.php?category_id=${formData.main_category}`);
          if (!response.ok) {
             throw new Error(`Error HTTP al cargar subcategorías: ${response.status}`);
          }
          const data = await response.json();
          console.log("Subcategorías recibidas:", data);
          // Asume que get_subcategories.php devuelve un array o {success: true, data: [...]}
          if (Array.isArray(data)) {
             setSubcategories(data);
          } else if (data.success && Array.isArray(data.data)) {
             setSubcategories(data.data);
          } else {
             console.warn("Formato inesperado para subcategorías, estableciendo vacío.");
             setSubcategories([]);
          }
        } catch (err) {
          console.error('Error al cargar subcategorías dinámicamente:', err);
          setSubcategories([]); // Limpiar en caso de error
        }
      };
      fetchSubcategories();
    } else if (!formData.main_category) {
        // Limpiar subcategorías si se deselecciona la categoría principal
        setSubcategories([]);
    }
    // Depende del cambio en la categoría principal y del estado de carga inicial
  }, [formData.main_category, isLoading]);

  // --- Manejadores de Cambios (Inputs, Selects, Checkbox) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
      // Resetear subcategoría si cambia la categoría principal
      ...(name === 'main_category' ? { subcategory: '' } : {})
    }));
  };

  // --- Manejador de Cambio de Archivo (Imagen) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, main_image: file })); // Guarda el archivo en el estado
      // Muestra previsualización
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      // Opcional: Limpiar si se cancela la selección
      setFormData((prev) => ({ ...prev, main_image: null }));
      setImagePreview(null);
    }
  };

  // --- Manejador de Envío del Formulario (Actualización) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formDataToSend = new FormData();
    formDataToSend.append('id', id);
    // Añade los campos al FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'main_image' || (key === 'main_image' && value instanceof File)) {
         if (value !== null && value !== '') { formDataToSend.append(key, value); }
      }
    });

    console.log("Enviando datos para actualizar (POST)...");
    // Descomenta para ver qué se envía:
    // for (let [key, value] of formDataToSend.entries()) { console.log(`POST - ${key}:`, value instanceof File ? value.name : value); }

    try {
      const response = await fetch('http://localhost/schizotactical/backend/editar_producto.php', {
        method: 'POST', credentials: 'include', body: formDataToSend
      });
      // Leer como texto y luego parsear
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); }
      catch (jsonError) {
          console.error("Error al parsear JSON (POST):", responseText);
          throw new Error(`Error en servidor (POST): ${responseText.substring(0, 200)}...`);
      }
      // Verificar estado y éxito
      if (!response.ok) { throw new Error(data.message || `Error HTTP: ${response.status}`); }
      if (data.success) {
        alert('Producto actualizado con éxito');
        navigate('/admin/productos'); // Volver a la lista
      } else { throw new Error(data.message || 'Error al actualizar'); }
    } catch (error) {
      console.error('Error al enviar formulario (POST):', error);
      setError(error.message);
      alert('Error al actualizar: ' + error.message);
    } finally { setIsLoading(false); }
  };

  // --- Renderizado ---
  // Muestra 'Cargando...' solo durante la carga inicial y si no hay error
  if (isLoading && !formData.name && !error) {
    return <div className="form-container"><p>Cargando datos del producto...</p></div>;
  }

  // Renderiza el formulario (incluso si hubo error, para mostrar el mensaje)
  return (
    <div className="form-container">
      <h2>Editar Producto (ID: {id})</h2>
      {/* Muestra el mensaje de error si existe */}
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
              {categories.map(category => ( <option key={category.id} value={category.id}>{category.name}</option> ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="subcategory" className="form-label">Subcategoría</label>
            <select id="subcategory" name="subcategory" className="form-select" value={formData.subcategory} onChange={handleChange} disabled={!formData.main_category}>
              <option value="">{formData.main_category ? 'Seleccione subcategoría (opcional)' : 'Seleccione categoría primero'}</option>
              {subcategories.map(sub => ( <option key={sub.id} value={sub.id}>{sub.name}</option> ))}
            </select>
          </div>
        </div>
        {/* Stock */}
        <div className="form-group-dual">
           <div className="form-group">
             <label className="form-label">Opciones de Stock</label>
             <div className="radio-group">
               <label className="radio-option"> <input type="radio" name="stock_option" value="preorder" checked={formData.stock_option === 'preorder'} onChange={handleChange} /> Por encargo </label>
               <label className="radio-option"> <input type="radio" name="stock_option" value="instock" checked={formData.stock_option === 'instock'} onChange={handleChange} /> En stock </label>
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
               <label className="checkbox-option"> <input type="checkbox" name="is_active" checked={formData.is_active === 1 || formData.is_active === '1'} onChange={handleChange} /> Activo (visible en la tienda) </label>
             </div>
        </div>
        {/* Imagen */}
        <div className="form-group">
          <label htmlFor="main_image" className="form-label">Imagen Principal</label>
          {/* Muestra imagen actual o previsualización */}
          {(imagePreview || currentImageUrl) && (
             <img
               src={imagePreview || currentImageUrl}
               alt={imagePreview ? "Vista previa nueva imagen" : "Imagen actual"}
               className="image-upload-preview"
               style={{marginBottom: '1rem'}}
             />
          )}
          <input type="file" id="main_image" name="main_image" className="form-control" onChange={handleFileChange} accept="image/*" />
          <small>Selecciona una nueva imagen solo si deseas reemplazar la actual.</small>
        </div>
        {/* Acciones */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/productos')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}> {isLoading ? 'Actualizando...' : 'Actualizar Producto'} </button>
        </div>
      </form>
    </div>
  );
}

export default EditarProducto;
