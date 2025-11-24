// src/components/Navbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useCart } from "../context/CartContext";
import { formatCLP } from "../utils/formatters";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems, totalPrice } = useCart();


  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Función para cerrar el menú (útil al hacer clic en un enlace)
  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <Link to="/" className="logo" onClick={closeMenu}>
          wolfftactical
        </Link>

        {/* Mobile Controls (Cart + Toggle) */}
        <div className="mobile-controls">
          <Link to="/cart" className="cart-icon mobile-only" onClick={closeMenu} aria-label="Carrito de compras">
            <svg
              version="1.1"
              id="_x32_"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 512 512"
              xmlSpace="preserve"
              fill="#ffffff"
            >
              <g>
                <path
                  d="M486.998,140.232c-8.924-12.176-22.722-19.878-37.785-21.078l-311.616-24.68l-5.665-32.094
                 c-5.179-29.305-28.497-51.998-57.932-56.352l-5.662-0.845L34.65,0.185c-9.385-1.378-18.118,5.09-19.51,14.475
                  c-1.395,9.393,5.086,18.127,14.471,19.514v-0.008l39.357,5.834l0.009,0.026c14.788,2.164,26.526,13.586,29.131,28.324
                   l53.338,302.302c5.005,28.375,29.647,49.047,58.461,49.056h219.192c9.49,0,17.176-7.694,17.176-17.172
                    c0-9.486-7.686-17.18-17.176-17.18H209.906c-12.133,0.009-22.536-8.725-24.642-20.672l-7.461-42.299h244.342
                     c24.189,0,45.174-16.691,50.606-40.262l22.967-99.523C499.118,167.887,495.93,152.424,486.998,140.232z"
                />
                <path
                  d="M223.012,438.122c-20.402,0-36.935,16.554-36.935,36.948c0,20.394,16.533,36.931,36.935,36.931
                 c20.401,0,36.944-16.537,36.944-36.931C259.955,454.676,243.413,438.122,223.012,438.122z"
                />
                <path
                  d="M387.124,438.122c-20.406,0-36.935,16.554-36.935,36.948c0,20.394,16.529,36.931,36.935,36.931
                 c20.402,0,36.944-16.537,36.944-36.931C424.068,454.676,407.526,438.122,387.124,438.122z"
                />
              </g>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className={`menu-icon ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>
      </div>

      <div className={`navbar-collapse ${isOpen ? "active" : ""}`}>
        <ul className="nav-links">
          <li>
            <Link to="/" onClick={closeMenu}>Inicio</Link>
          </li>
          <li>
            <Link to="/productos" onClick={closeMenu}>Productos</Link>
          </li>
          <li>
            <Link to="/contacto" onClick={closeMenu}>Contactos</Link>
          </li>
        </ul>

        <div className="nav-actions">
          <div className="search-bar">
            <input type="text" placeholder="Buscar..." />
            <button aria-label="Buscar">🔍</button>
          </div>

          <Link to="/login" className="login-link" onClick={closeMenu}>Iniciar Sesión</Link>

          {/* Desktop Cart Icon */}
          <Link to="/cart" className="cart-icon desktop-only" onClick={closeMenu} aria-label="Carrito de compras">
            <svg
              version="1.1"
              id="_x32_"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 512 512"
              xmlSpace="preserve"
              fill="#ffffff"
            >
              <g>
                <path
                  d="M486.998,140.232c-8.924-12.176-22.722-19.878-37.785-21.078l-311.616-24.68l-5.665-32.094
                 c-5.179-29.305-28.497-51.998-57.932-56.352l-5.662-0.845L34.65,0.185c-9.385-1.378-18.118,5.09-19.51,14.475
                  c-1.395,9.393,5.086,18.127,14.471,19.514v-0.008l39.357,5.834l0.009,0.026c14.788,2.164,26.526,13.586,29.131,28.324
                   l53.338,302.302c5.005,28.375,29.647,49.047,58.461,49.056h219.192c9.49,0,17.176-7.694,17.176-17.172
                    c0-9.486-7.686-17.18-17.176-17.18H209.906c-12.133,0.009-22.536-8.725-24.642-20.672l-7.461-42.299h244.342
                     c24.189,0,45.174-16.691,50.606-40.262l22.967-99.523C499.118,167.887,495.93,152.424,486.998,140.232z"
                />
                <path
                  d="M223.012,438.122c-20.402,0-36.935,16.554-36.935,36.948c0,20.394,16.533,36.931,36.935,36.931
                 c20.401,0,36.944-16.537,36.944-36.931C259.955,454.676,243.413,438.122,223.012,438.122z"
                />
                <path
                  d="M387.124,438.122c-20.406,0-36.935,16.554-36.935,36.948c0,20.394,16.529,36.931,36.935,36.931
                 c20.402,0,36.944-16.537,36.944-36.931C424.068,454.676,407.526,438.122,387.124,438.122z"
                />
              </g>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="cart-total" title="Total carrito">
            {totalItems > 0 ? formatCLP(totalPrice) : ''}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
