import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCLP } from '../utils/formatters';
import { backendUrl, mediaUrl } from '../config/api';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState('');
  const [originalMainImage, setOriginalMainImage] = useState(''); // Store original image
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  const [showAllThumbnails, setShowAllThumbnails] = useState(false);

  useEffect(() => {
    const pid = parseInt(id, 10);
    if (!pid || pid <= 0) {
      setError('Producto inválido');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(backendUrl(`get_products.php?id=${pid}`));
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.data) throw new Error(data.message || 'No se pudo cargar el producto');
        const p = data.data;
        setProduct(p);
        const imgs = Array.isArray(data.images) ? data.images : [];
        setImages(imgs);
        const cover = imgs.find(i => Number(i.is_cover) === 1) || null;
        const mainPath = (cover ? cover.path : (p.cover_image || p.main_image || (imgs[0] ? imgs[0].path : '')));
        const mainImageUrl = mainPath ? mediaUrl(mainPath) : '';
        setMainImage(mainImageUrl);
        setOriginalMainImage(mainImageUrl); // Store original
        const cols = Array.isArray(data.colors) ? data.colors : [];
        setColors(cols);
      } catch (e) {
        setError(e.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const isPreorder = product && product.stock_status === 'por_encargo';

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.findIndex(img => mediaUrl(img.path) === mainImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setMainImage(mediaUrl(images[prevIndex].path));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.findIndex(img => mediaUrl(img.path) === mainImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setMainImage(mediaUrl(images[nextIndex].path));
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.color_name || color.color_hex);
    // Si el color tiene imagen, cambiar la imagen principal
    if (color.image_path) {
      setMainImage(mediaUrl(color.image_path));
    }
  };

  const handleColorDeselect = () => {
    setSelectedColor('');
    // Restore original main image
    setMainImage(originalMainImage);
  };

  const addToCart = () => {
    if (!product) return;
    const needColor = colors.length > 0;
    if (!isPreorder) {
      if (quantity < 1) return alert('La cantidad debe ser al menos 1');
      if (needColor && !selectedColor) return alert('Selecciona un color');
    } else {
      if (needColor && !selectedColor) return alert('Selecciona un color');
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      color: selectedColor || null,
      quantity: isPreorder ? 1 : quantity,
      image: mainImage // Passing the full URL currently in mainImage state
    });
    alert('Producto agregado al carrito');
  };

  const openWhatsApp = () => {
    if (!product) return;
    const needColor = colors.length > 0;
    if (!isPreorder) {
      if (quantity < 1) return alert('La cantidad debe ser al menos 1');
      if (needColor && !selectedColor) return alert('Selecciona un color');
    } else {
      if (needColor && !selectedColor) return alert('Selecciona un color');
    }
    const storeNumber = '56959572663';
    const lines = [];
    lines.push(`Producto: ${product.name}`);
    if (!isPreorder) {
      lines.push(`Cantidad: ${quantity}`);
    } else {
      lines.push('Modo: Por encargo');
    }
    if (selectedColor) lines.push(`Color: ${selectedColor}`);
    const msg = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${storeNumber}?text=${msg}`;
    window.open(url, '_blank');
  };

  const sendEmail = async () => {
    if (!product) return;
    const needColor = colors.length > 0;
    if (!isPreorder) {
      if (quantity < 1) return alert('La cantidad debe ser al menos 1');
      if (needColor && !selectedColor) return alert('Selecciona un color');
    } else {
      if (needColor && !selectedColor) return alert('Selecciona un color');
    }
    const email = window.prompt('Ingresa tu correo (Gmail/Hotmail/Outlook):');
    if (!email) return;
    const okDomain = /@gmail\.com$|@hotmail\.com$|@outlook\.com$/i.test(email);
    if (!okDomain) return alert('Solo se permiten Gmail, Hotmail u Outlook');
    try {
      const resp = await fetch(backendUrl('send_order_email.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: email,
          product_name: product.name,
          quantity: isPreorder ? null : quantity,
          color: selectedColor || '',
          mode: isPreorder ? 'preorder' : 'instock'
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo enviar');
      alert('Correo enviado, te contactaremos pronto');
    } catch (e) {
      alert(e.message || 'Error enviando correo');
    }
  };

  if (loading) return <div className="form-container"><p>Cargando producto...</p></div>;
  if (error) return <div className="form-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!product) return null;

  const visibleThumbnails = showAllThumbnails ? images : images.slice(0, 5);
  const remainingCount = images.length - 5;

  return (
    <div className="product-detail-container">
      <button className="btn-back-glass" onClick={() => navigate(-1)}>← Volver</button>

      <div className="product-detail-wrapper">
        {/* Left Column: Images */}
        <div className="product-images-section">
          {mainImage && (
            <div className="main-image-container">
              {images.length > 1 && (
                <button className="nav-arrow prev" onClick={handlePrevImage}>‹</button>
              )}
              <img src={mainImage} alt={product.name} className="main-image" />
              {images.length > 1 && (
                <button className="nav-arrow next" onClick={handleNextImage}>›</button>
              )}
            </div>
          )}
          {images.length > 0 && (
            <div className="thumbnails-container">
              {visibleThumbnails.map(img => (
                <img
                  key={img.id}
                  src={mediaUrl(img.path)}
                  alt={product.name}
                  className={`thumbnail-image ${mainImage === mediaUrl(img.path) ? 'active' : ''}`}
                  onClick={() => setMainImage(mediaUrl(img.path))}
                />
              ))}
              {!showAllThumbnails && remainingCount > 0 && (
                <div className="thumbnail-more" onClick={() => setShowAllThumbnails(true)}>
                  +{remainingCount}
                </div>
              )}
              {showAllThumbnails && (
                <div className="thumbnail-more" onClick={() => setShowAllThumbnails(false)} title="Ver menos">
                  -
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Info & Actions */}
        <div className="product-info-section">
          <div>
            <h2 className="product-title">{product.name}</h2>
            {product.model && <p className="product-model">Modelo: {product.model}</p>}
            <p className="product-price">{formatCLP(product.price)}</p>
          </div>

          {product.description && (
            <div className="info-group">
              <label className="info-label">Descripción</label>
              <div className="info-content">{product.description}</div>
            </div>
          )}

          {product.includes_note && (
            <div className="info-group">
              <label className="info-label">Incluye</label>
              <div className="info-content">{product.includes_note}</div>
            </div>
          )}

          {product.video_url && (
            <div className="info-group">
              <label className="info-label">Video</label>
              <div className="video-container">
                {/youtube|youtu\.be/.test(product.video_url) ? (
                  <iframe
                    width="100%"
                    height="300"
                    src={product.video_url.includes('youtu.be')
                      ? product.video_url.replace('youtu.be/', 'youtube.com/embed/')
                      : product.video_url.replace('watch?v=', 'embed/').replace('&', '?')}
                    title="Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <a href={product.video_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Ver video</a>
                )}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="info-group">
              <label className="info-label">Color {selectedColor && <span style={{ fontSize: '0.8rem', color: '#888' }}>(Click para deseleccionar)</span>}</label>
              <div className="color-selector">
                {colors.map(c => (
                  <div
                    key={c.id}
                    className={`color-option ${selectedColor === (c.color_name || c.color_hex) ? 'selected' : ''}`}
                    onClick={() => handleColorSelect(c)}
                    title={c.color_name || c.color_hex}
                  >
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: c.color_hex }}
                    />
                    {c.image_path && <div className="color-has-image">📷</div>}
                  </div>
                ))}
              </div>
              {selectedColor && (
                <button
                  className="btn-deselect-color"
                  onClick={handleColorDeselect}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✕ Quitar selección (producto estándar)
                </button>
              )}
            </div>
          )}

          {!isPreorder && (
            <div className="info-group">
              <label className="info-label">Cantidad</label>
              <input type="number" className="form-control-glass" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))} />
            </div>
          )}

          <div className="action-buttons">
            <button className="btn-glass btn-secondary-glass" onClick={addToCart}>
              Agregar al carrito
            </button>
            <button className="btn-glass btn-primary-glass" onClick={openWhatsApp}>
              {isPreorder ? 'Encargar a la tienda' : 'Comprar por WhatsApp'}
            </button>
            <button className="btn-glass btn-secondary-glass" onClick={sendEmail}>
              Enviar por correo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
