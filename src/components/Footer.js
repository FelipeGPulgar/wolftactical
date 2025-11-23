import React from "react";
import "./Footer.css";
import { SITE, formatPhoneE164 } from "../config/site";
import FooterInicio from "../Images/Footer-Inicio.png";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Sobre Nosotros</h3>
          <p>
            WolfTactical es tu destino principal para equipamiento táctico de alta calidad
            gear, holsters, body armor, and more. We are committed to providing
            top-notch products and exceptional customer service.
          </p>
        </div>

        <div className="footer-section">
          <h3>Contactanos</h3>
          <p>Email: {SITE.supportEmail}</p>
          <p>{formatPhoneE164(SITE.phones.sebastian)}</p>
        </div>
        <div className="footer-section">
          <h3>Siguenos En</h3>
          <div className="social-links">
            <a
              href={SITE.social.facebook} // Facebook
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a
              href={SITE.social.twitter} // Twitter
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a
              href={SITE.social.instagram} // Instagram
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-logo">
          <a href="/" aria-label="Inicio">
            <img src={FooterInicio} alt="Inicio" className="footer-inicio" />
          </a>
        </div>
        <p>&copy; {year} {SITE.name}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
