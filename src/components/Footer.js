import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Sobre Nosotros</h3>
          <p>
            SchizoTactical is your premier destination for high-quality tactical
            gear, holsters, body armor, and more. We are committed to providing
            top-notch products and exceptional customer service.
          </p>
        </div>
        <div className="footer-section">
          <h3>Enlaces Rapidos</h3>
          <ul>
            <li>
              <Link to="/deals">Deals</Link>
            </li>
            <li>
              <Link to="/holsters">Holsters</Link>
            </li>
            <li>
              <Link to="/rifle">Rifle</Link>
            </li>
            <li>
              <Link to="/pistol">Pistol</Link>
            </li>
            <li>
              <Link to="/body-armor">Body Armor</Link>
            </li>
            <li>
              <Link to="/night-vision">Night Vision</Link>
            </li>
            <li>
              <Link to="/tactical-gear">Tactical Gear</Link>
            </li>
            <li>
              <Link to="/plate-carriers">Plate Carriers</Link>
            </li>
            <li>
              <Link to="/pouches">Pouches</Link>
            </li>
            <li>
              <Link to="/belts">Belts</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contactanos</h3>
          <p>Email: info@schizotactical.com</p>
          <p>Martin: +569-85984524</p>
          <p>Sebastian: +569-59572663</p>
        </div>
        <div className="footer-section">
          <h3>Siguenos En</h3>
          <div className="social-links">
            <a
              href="https://www.facebook.com/your-page" // Replace with your actual Facebook link
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a
              href="https://www.twitter.com/your-page" // Replace with your actual Twitter link
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a
              href="https://www.instagram.com/your-page" // Replace with your actual Instagram link
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 SchizoTactical. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
