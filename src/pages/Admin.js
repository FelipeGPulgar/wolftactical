// src/pages/Admin.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProductosAdmin from "../components/admin/ProductosAdmin";
import AgregarProducto from "../components/admin/AgregarProducto";
import EditarProducto from "../components/admin/EditarProducto";
import AdminLayout from "../components/admin/AdminLayout"; // Ruta actualizada

function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<ProductosAdmin />} />
        <Route path="productos" element={<ProductosAdmin />} />
        <Route path="agregar-producto" element={<AgregarProducto />} />
        <Route path="editar-producto/:id" element={<EditarProducto />} />
      </Routes>
    </AdminLayout>
  );
}

export default Admin;