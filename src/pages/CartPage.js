import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCLP } from '../utils/formatters';
import './CartPage.css';
import { backendUrl, mediaUrl } from '../config/api';

function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const formatPrice = (n) => formatCLP(n);

  const buildWhatsAppMessage = () => {
    const lines = [];
    lines.push('Hola, quisiera consultar/comprar estos productos:');
    items.forEach(it => {
      const unit = formatPrice(it.price);
      const subtotal = formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 0));
      lines.push(`- ${it.name}`);
      lines.push(`  Cantidad: ${it.quantity}`);
      if (it.color) lines.push(`  Color: ${it.color}`);
      lines.push(`  Unitario: ${unit}`);
      lines.push(`  Subtotal: ${subtotal}`);
    });
    lines.push(`TOTAL: ${formatPrice(totalPrice)}`);
    return encodeURIComponent(lines.join('\n'));
  };

  const openWhatsAppCart = () => {
    if (!items.length) return;
    const storeNumber = '56959572663';
    const msg = buildWhatsAppMessage();
    const url = `https://wa.me/${storeNumber}?text=${msg}`;
    window.open(url, '_blank');
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const sendCartEmail = async () => {
    if (!items.length) return;
    const email = window.prompt('Ingresa tu correo (Gmail/Hotmail/Outlook):');
    if (!email) return;
    const okDomain = /@gmail\.com$|@hotmail\.com$|@outlook\.com$/i.test(email);
    if (!okDomain) return alert('Solo se permiten Gmail, Hotmail u Outlook');
    setSendingEmail(true);
    try {
      const resp = await fetch(backendUrl('send_cart_email.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: email,
          items: items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            color: it.color || '',
            price: it.price
          }))
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo enviar');
      alert('Correo enviado, te contactaremos pronto');
    } catch (e) {
      alert(e.message || 'Error enviando correo');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>Tu Carrito</h2>
      {items.length === 0 ? (
        <div>
          <p>Tu carrito está vacío.</p>
          <button className="btn btn-primary" onClick={() => navigate('/productos')}>Ir a productos</button>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {items.map((it) => (
              <div key={`${it.id}-${it.color || 'nocolor'}`} className="cart-item">
                {/* Product Image */}
                <div className="cart-item-image">
                  {it.image ? (
                    <img src={it.image.startsWith('http') ? it.image : mediaUrl(it.image)} alt={it.name} />
                  ) : (
                    <div className="no-image">Sin Imagen</div>
                  )}
                </div>

                <div className="cart-item-details">
                  <div className="cart-item-name">{it.name}</div>
                  {it.color && <div className="cart-item-meta">Color: {it.color}</div>}
                  <div className="cart-item-meta">Precio: {formatPrice(it.price)}</div>
                </div>

                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button className="btn btn-secondary" onClick={() => updateQuantity(it.id, it.color, Math.max(1, (it.quantity || 1) - 1))}>-</button>
                    <input type="number" className="form-control quantity-input" min={1} value={it.quantity} onChange={(e) => updateQuantity(it.id, it.color, e.target.value)} />
                    <button className="btn btn-secondary" onClick={() => updateQuantity(it.id, it.color, (Number(it.quantity) || 1) + 1)}>+</button>
                  </div>

                  <div className="cart-item-subtotal">
                    {formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 0))}
                  </div>
                </div>

                <button className="btn btn-danger remove-btn" onClick={() => removeItem(it.id, it.color)}>Eliminar</button>
              </div>
            ))}
          </div>

          <div className="cart-actions-container">
            <div className="cart-buttons">
              <button className="btn btn-outline" onClick={clear}>Vaciar carrito</button>
              <button className="btn btn-whatsapp" onClick={openWhatsAppCart}>Contactar por WhatsApp</button>
              <button className="btn btn-primary" disabled={sendingEmail} onClick={sendCartEmail}>
                {sendingEmail ? 'Enviando...' : 'Enviar por correo'}
              </button>
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Productos:</span>
                <strong>{totalItems}</strong>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
