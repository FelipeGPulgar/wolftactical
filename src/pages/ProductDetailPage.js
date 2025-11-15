import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCLP } from '../utils/formatters';
import { backendUrl, mediaUrl } from '../config/api';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState('');
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

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
        setMainImage(mainPath ? mediaUrl(mainPath) : '');
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
  if (error) return <div className="form-container"><p style={{color:'red'}}>Error: {error}</p></div>;
  if (!product) return null;

  return (
    <div className="form-container">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Volver</button>
      <div className="form-group-dual">
        <div>
          {mainImage && (
            <img src={mainImage} alt={product.name} className="image-upload-preview" style={{height:'320px',objectFit:'contain'}} />
          )}
          {images.length > 0 && (
            <div className="image-upload-container" style={{marginTop:'0.75rem'}}>
              {images.map(img => (
                <img
                  key={img.id}
                  src={mediaUrl(img.path)}
                  alt={product.name}
                  className="image-upload-preview"
                  style={{height:'100px',cursor:'pointer'}}
                  onClick={() => setMainImage(mediaUrl(img.path))}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h2>{product.name}</h2>
          {product.model && <p>Modelo: {product.model}</p>}
          <p style={{fontSize:'1.25rem',fontWeight:600}}>{formatCLP(product.price)}</p>
          {product.description && (
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <div>{product.description}</div>
            </div>
          )}
          {product.includes_note && (
            <div className="form-group">
              <label className="form-label">Incluye</label>
              <div>{product.includes_note}</div>
            </div>
          )}
          {product.video_url && (
            <div className="form-group">
              <label className="form-label">Video</label>
              <div>
                {/* Si es YouTube, intentar embeber; si no, dejar link */}
                {/youtube|youtu\.be/.test(product.video_url) ? (
                  <iframe
                    width="100%"
                    height="300"
                    src={product.video_url.replace('watch?v=','embed/')}
                    title="Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <a href={product.video_url} target="_blank" rel="noreferrer">Ver video</a>
                )}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="form-group">
              <label className="form-label">Color</label>
              <select className="form-select" value={selectedColor} onChange={(e)=>setSelectedColor(e.target.value)}>
                <option value="">Selecciona un color</option>
                {colors.map(c => (
                  <option key={c.id} value={c.name || c.hex}>{c.name || c.hex}</option>
                ))}
              </select>
            </div>
          )}

          {!isPreorder && (
            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-control" min={1} value={quantity} onChange={(e)=>setQuantity(Math.max(1, parseInt(e.target.value||'1',10)))} />
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={addToCart}>Agregar al carrito</button>
            <button className="btn btn-primary" onClick={openWhatsApp}>{isPreorder ? 'Encargar a la tienda' : 'Comprar por WhatsApp'}</button>
            <button className="btn" onClick={sendEmail}>Enviar por correo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
