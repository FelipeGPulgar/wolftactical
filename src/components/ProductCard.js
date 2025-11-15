// src/components/ProductCard.js
import React from 'react';
import { Link } from 'react-router-dom'; // Importa Link para enlazar al detalle
import './ProductCard.css'; // Importa el archivo CSS
import { formatCLP } from '../utils/formatters';
import { mediaUrl } from '../config/api';

function ProductCard({ product }) {
  // Determinar campo de imagen de portada disponible: preferir cover_image, luego main_image
  const coverPath = product?.cover_image || product?.main_image || null;
  const imageUrl = coverPath ? mediaUrl(coverPath) : '/images/placeholder.png';


 // Ruta a una imagen por defecto en tu carpeta 'public/images'

  // 2. Función para formatear el precio (ejemplo para CLP)
  const formatPrice = (price) => formatCLP(price);

  // 3. Manejo de error para la imagen
  // Dentro de ProductCard.js
const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = '/images/placeholder.png';
  // console.warn(`Error al cargar imagen: ${imageUrl}`); // <-- Comenta esta línea temporalmente
};


  // Verifica que 'product' exista antes de intentar acceder a sus propiedades
  if (!product) {
    return null; // O renderiza un placeholder de tarjeta vacía
  }

  return (
    // Envolver toda la tarjeta en un Link al detalle del producto
    <Link to={`/producto/${product.id}`} className="product-card-link">
      <div className="product-card">
        <div className="product-card-image-container">
          <img
            src={imageUrl}
            alt={product.name || 'Imagen del producto'}
            className="product-card-image"
            onError={handleImageError} // Añadir manejo de error
          />
        </div>
        <div className="product-card-info">
          <h3 className="product-card-name">{product.name || 'Nombre no disponible'}</h3>
          {/* Muestra nombres de categoría/subcategoría si existen, si no, no muestra nada */}
          {/* <p className="product-card-category">{product.category_name || ''}</p> */}
          {/* <p className="product-card-subcategory">{product.subcategory_name || ''}</p> */}
          <p className="product-card-price">{formatPrice(product.price)}</p>
        </div>
        {/* Puedes añadir un botón "Ver detalle" o "Añadir al carrito" aquí si lo necesitas */}
        {/* <button className="btn-view-details">Ver Detalles</button> */}
      </div>
    </Link>
  );
}

export default ProductCard;
