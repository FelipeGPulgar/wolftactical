// src/pages/Admin.js
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ProductosAdmin from "../components/admin/ProductosAdmin";
import AgregarProducto from "../components/admin/AgregarProducto";
import EditarProducto from "../components/admin/EditarProducto";
import AdminLayout from "../components/admin/AdminLayout"; // Ruta actualizada

function Admin() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost/schizotactical/backend/notificaciones.php", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Error fetching notifications");

        const data = await response.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log("New notifications detected:", data.data);
          // Trigger notification refresh logic here
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }, 5000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

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