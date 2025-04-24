import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate de tener estilos adecuados, puedes importar los de EditarProducto si son similares
// import './AgregarProducto.css'; // O crea uno específico

function AgregarProducto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    main_category: '',
    subcategory: '',
    stock_option: 'preorder', // Valor inicial por defecto
    stock_quantity: '',
    price: '',
    main_image: null, // Para el archivo de imagen principal
    image_1: null,    // Para el archivo de imagen adicional 1
    image_2: null     // Para el archivo de imagen adicional 2
    // Se eliminan new_category_name y new_subcategory_name ya que el backend no parece manejarlos
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null); // Vista previa solo para imagen principal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Para mostrar errores en la UI

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

  // --- Efecto para Cargar Subcategorías (cuando cambia la categoría principal) ---
  useEffect(() => {
    // Solo cargar si hay una categoría principal seleccionada (y no es la opción "nueva")
    if (formData.main_category) {
      const fetchSubcategories = async () => {
        // Limpiar subcategorías anteriores mientras se cargan las nuevas
        setSubcategories([]);
        try {
          const response = await fetch(`http://localhost/schizotactical/backend/get_subcategories.php?category_id=${formData.main_category}`);
           if (!response.ok) {
              throw new Error(`Error HTTP al cargar subcategorías: ${response.status}`);
           }
          const data = await response.json();
          // Validar que la respuesta sea un array
          if (Array.isArray(data)) {
             setSubcategories(data);
          } else {
             console.warn("Respuesta inesperada para subcategorías, se esperaba un array:", data);
             setSubcategories([]);
          }
        } catch (err) {
          console.error('Error al cargar subcategorías:', err);
          // No establecer error global, podría ser normal no tener subcategorías
          setSubcategories([]);
        }
      };
      fetchSubcategories();
    } else {
      // Limpiar subcategorías si no hay categoría principal seleccionada
      setSubcategories([]);
    }
  }, [formData.main_category]); // Dependencia: se re-ejecuta si cambia la categoría principal

  // --- Manejador de Cambios en Inputs y Selects ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Resetear subcategoría si cambia la categoría principal
      ...(name === 'main_category' ? { subcategory: '' } : {})
    }));
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
          <select id="main_category" name="main_category" className="form-select" value={formData.main_category} onChange={handleChange} required>
            <option value="">Seleccione una categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
            {/* Se elimina la opción "+ Crear Nueva Categoría" */}
          </select>
          {/* Se elimina el input para nueva categoría */}
        </div>

        {/* Subcategoría */}
        <div className="form-group">
          <label htmlFor="subcategory" className="form-label">Subcategoría (opcional)</label>
          <select
             id="subcategory"
             name="subcategory"
             className="form-select"
             value={formData.subcategory}
             onChange={handleChange}
             disabled={!formData.main_category} // Deshabilitado si no hay categoría principal
             // Se elimina 'required' ya que es opcional
          >
            <option value="">{formData.main_category ? (subcategories.length > 0 ? 'Seleccione subcategoría' : 'Sin subcategorías') : 'Seleccione categoría primero'}</option>
            {subcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>
           {/* Se elimina el input para nueva subcategoría */}
        </div>

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

        {/* Precio */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">Precio (CLP)</label>
          <input type="number" id="price" name="price" className="form-control" value={formData.price} onChange={handleChange} min="0" step="any" required />
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
