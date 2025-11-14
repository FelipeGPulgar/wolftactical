// src/App.js
import React from "react";
// Se eliminó 'BrowserRouter as Router' ya que no se usa aquí
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/admin/AdminNavbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import Contact from "./pages/Contact";
import "./styles.css";

// Componente para proteger rutas administrativas (sin cambios)
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/productos" element={<ProductListPage />} />
          <Route path="/producto/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contacto" element={<Contact />} />
          {/* Otras rutas públicas (ejemplos comentados) */}
          {/* <Route path="/producto/:id" element={<ProductDetailPage />} /> */}
          {/* <Route path="/carrito" element={<CartPage />} /> */}
          {/* <Route path="/registro" element={<RegisterPage />} /> */}

          {/* Ruta comodín: Redirige a la página principal si no se encuentra la ruta */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
