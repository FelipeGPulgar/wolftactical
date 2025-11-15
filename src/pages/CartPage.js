import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCLP } from '../utils/formatters';
import './CartPage.css';
import { backendUrl } from '../config/api';

function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const formatPrice = (n) => formatCLP(n);

  const buildWhatsAppMessage = () => {
    const lines = [];
    lines.push('Hola, quisiera consultar/comprar estos productos:');
    items.forEach(it => {
      const unit = formatPrice(it.price);
      const subtotal = formatPrice((Number(it.price)||0) * (Number(it.quantity)||0));
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
          <div className="form-group">
            {items.map((it) => (
              <div key={`${it.id}-${it.color||'nocolor'}`} className="item-row" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', padding:'0.5rem 0'}}>
                <div style={{flex:'2 1 auto'}}>
                  <div style={{fontWeight:600}}>{it.name}</div>
                  {it.color && <div style={{color:'#6c757d'}}>Color: {it.color}</div>}
                  <div style={{color:'#6c757d'}}>Precio: {formatPrice(it.price)}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <button className="btn btn-secondary" onClick={() => updateQuantity(it.id, it.color, Math.max(1, (it.quantity||1) - 1))}>-</button>
                  <input type="number" className="form-control" min={1} value={it.quantity} onChange={(e)=>updateQuantity(it.id, it.color, e.target.value)} style={{width:'70px'}} />
                  <button className="btn btn-secondary" onClick={() => updateQuantity(it.id, it.color, (Number(it.quantity)||1) + 1)}>+</button>
                </div>
                <div style={{width:'120px', textAlign:'right', fontWeight:600}}>{formatPrice((Number(it.price)||0) * (Number(it.quantity)||0))}</div>
                <button className="btn" onClick={() => removeItem(it.id, it.color)}>Eliminar</button>
              </div>
            ))}
          </div>
          <div className="form-actions" style={{flexWrap:'wrap', gap:'0.5rem', justifyContent:'space-between'}}>
            <div style={{display:'flex', gap:'0.5rem'}}>
              <button className="btn" onClick={clear}>Vaciar carrito</button>
              <button className="btn btn-secondary" onClick={openWhatsAppCart}>Contactar por WhatsApp</button>
              <button className="btn btn-primary" disabled={sendingEmail} onClick={sendCartEmail}>{sendingEmail ? 'Enviando...' : 'Enviar por correo'}</button>
            </div>
            <div className="totals-block">
              <div>Productos: <strong>{totalItems}</strong></div>
              <div>Total: <strong>{formatPrice(totalPrice)}</strong></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
