import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBodyArmorDropdownOpen, setIsBodyArmorDropdownOpen] = useState(false);
  const [isTacticalGearDropdownOpen, setIsTacticalGearDropdownOpen] = useState(false);
  const [isDealsDropdownOpen, setIsDealsDropdownOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleBodyArmorMouseEnter = () => {
    setIsBodyArmorDropdownOpen(true);
  };

  const handleBodyArmorMouseLeave = () => {
    setIsBodyArmorDropdownOpen(false);
  };
  const handleTacticalGearMouseEnter = () => {
    setIsTacticalGearDropdownOpen(true);
  };

  const handleTacticalGearMouseLeave = () => {
    setIsTacticalGearDropdownOpen(false);
  };
  const handleDealsMouseEnter = () => {
    setIsDealsDropdownOpen(true);
  };

  const handleDealsMouseLeave = () => {
    setIsDealsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        SchizoTactical
      </Link>

      <div className={`menu-icon ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <ul className={`nav-links ${isOpen ? "active" : ""}`}>
        <li
          onMouseEnter={handleDealsMouseEnter}
          onMouseLeave={handleDealsMouseLeave}
          className="dropdown-container"
        >
          <Link to="/deals" onClick={toggleMenu}>
            Deals
          </Link>
          <ul className={`dropdown ${isDealsDropdownOpen ? "active" : ""}`}>
            <li>
              <Link to="/deals/holsters" onClick={toggleMenu}>
                Holsters Deals
              </Link>
            </li>
            <li>
              <Link to="/deals/body-armor" onClick={toggleMenu}>
                Body Armor Deals
              </Link>
            </li>
            <li>
              <Link to="/deals/tactical-gear" onClick={toggleMenu}>
                Tactical Gear Deals
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link to="/holsters" onClick={toggleMenu}>
            Holsters
          </Link>
        </li>
        <li>
          <Link to="/rifle" onClick={toggleMenu}>
            Rifle
          </Link>
        </li>
        <li>
          <Link to="/pistol" onClick={toggleMenu}>
            Pistol
          </Link>
        </li>
        <li
          onMouseEnter={handleBodyArmorMouseEnter}
          onMouseLeave={handleBodyArmorMouseLeave}
          className="dropdown-container"
        >
          <Link to="/body-armor" onClick={toggleMenu}>
            Body Armor
          </Link>
          <ul className={`dropdown ${isBodyArmorDropdownOpen ? "active" : ""}`}>
            <li>
              <Link to="/body-armor/vests" onClick={toggleMenu}>
                Vests
              </Link>
            </li>
            <li>
              <Link to="/body-armor/plates" onClick={toggleMenu}>
                Plates
              </Link>
            </li>
            <li>
              <Link to="/helmets" onClick={toggleMenu}>
                Helmets
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link to="/night-vision" onClick={toggleMenu}>
            Night Vision
          </Link>
        </li>
        <li
          onMouseEnter={handleTacticalGearMouseEnter}
          onMouseLeave={handleTacticalGearMouseLeave}
          className="dropdown-container"
        >
          <Link to="/tactical-gear" onClick={toggleMenu}>
            Tactical Gear
          </Link>
          <ul className={`dropdown ${isTacticalGearDropdownOpen ? "active" : ""}`}>
            <li>
              <Link to="/plate-carriers" onClick={toggleMenu}>
                Plate Carriers
              </Link>
            </li>
            <li>
              <Link to="/pouches" onClick={toggleMenu}>
                Pouches
              </Link>
            </li>
            <li>
              <Link to="/belts" onClick={toggleMenu}>
                Belts
              </Link>
            </li>
          </ul>
        </li>
      </ul>
      <div className="nav-actions">
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
          <button></button>
        </div>
        <Link to="/login" className="login-link">Iniciar Sesión</Link>
        <Link to="/register" className="register-link">Registrarse</Link>
        <Link to="/cart" className="cart-icon">
          <svg
            version="1.1"
            id="_x32_"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 512 512"
            xmlSpace="preserve"
            fill="#000000"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <style type="text/css">
                {`.st0{fill:#ffffff;}`}
              </style>
              <g>
                <path
                  className="st0"
                  d="M486.998,140.232c-8.924-12.176-22.722-19.878-37.785-21.078l-311.616-24.68l-5.665-32.094
                   c-5.179-29.305-28.497-51.998-57.932-56.352l-5.662-0.845L34.65,0.185c-9.385-1.378-18.118,5.09-19.51,14.475
                    c-1.395,9.393,5.086,18.127,14.471,19.514v-0.008l39.357,5.834l0.009,0.026c14.788,2.164,26.526,13.586,29.131,28.324
                     l53.338,302.302c5.005,28.375,29.647,49.047,58.461,49.056h219.192c9.49,0,17.176-7.694,17.176-17.172
                      c0-9.486-7.686-17.18-17.176-17.18H209.906c-12.133,0.009-22.536-8.725-24.642-20.672l-7.461-42.299h244.342
                       c24.189,0,45.174-16.691,50.606-40.262l22.967-99.523C499.118,167.887,495.93,152.424,486.998,140.232z"
                />
                <path
                  className="st0"
                  d="M223.012,438.122c-20.402,0-36.935,16.554-36.935,36.948c0,20.394,16.533,36.931,36.935,36.931
                   c20.401,0,36.944-16.537,36.944-36.931C259.955,454.676,243.413,438.122,223.012,438.122z"
                />
                <path
                  className="st0"
                  d="M387.124,438.122c-20.406,0-36.935,16.554-36.935,36.948c0,20.394,16.529,36.931,36.935,36.931
                   c20.402,0,36.944-16.537,36.944-36.931C424.068,454.676,407.526,438.122,387.124,438.122z"
                />
              </g>
            </g>
          </svg>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
