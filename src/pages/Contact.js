import React, { useState } from 'react';
import './Contact.css';
import { SITE } from '../config/site';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendWhatsApp = (number) => {
    const text = encodeURIComponent(`Hola, soy ${name || 'cliente'}\n${message || ''}`);
    window.open(`https://wa.me/${number}?text=${text}`, '_blank');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return alert('Escribe un mensaje');
    if (!email.trim()) return alert('Ingresa tu correo');
    const okDomain = /@gmail\.com$|@hotmail\.com$|@outlook\.com$/i.test(email);
    if (!okDomain) return alert('Solo se permiten Gmail, Hotmail u Outlook');
    setSending(true);
    try {
      const resp = await fetch('http://localhost/wolftactical/backend/send_contact_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo enviar');
      alert('Mensaje enviado, te contactaremos pronto');
      setName(''); setEmail(''); setMessage('');
    } catch (e2) {
      alert(e2.message || 'Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-container">
      <h2>Contáctanos</h2>
      <p>¿Tienes dudas o buscas un producto? Escríbenos.</p>

      <form onSubmit={onSubmit} className="contact-form">
        <label>Nombre</label>
        <input className="form-control" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Tu nombre" />
        <label>Correo (Gmail/Hotmail/Outlook)</label>
        <input className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tucorreo@gmail.com" />
        <label>Mensaje</label>
        <textarea className="form-control" rows={6} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Cuéntanos qué necesitas" />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Enviando...' : 'Enviar mensaje'}</button>
        </div>
      </form>

      <div className="quick-contacts">
        <button className="btn btn-secondary" onClick={()=>sendWhatsApp(SITE.phones.martin)}>WhatsApp Martín</button>
        <button className="btn btn-secondary" onClick={()=>sendWhatsApp(SITE.phones.sebastian)}>WhatsApp Sebastián</button>
        <a className="btn" href={`mailto:${SITE.supportEmail}`}>Enviar Email</a>
      </div>
    </div>
  );
}

export default Contact;
