// src/pages/ProductListPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { backendUrl } from '../config/api';
import './ProductListPage.css';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [sort, setSort] = useState('newest'); // newest | price_asc | price_desc | name
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  // Soportar parámetros iniciales opcionales
  const categoryParam = searchParams.get('category_id') || searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      // 1. Inicia la carga y limpia errores/productos anteriores
      setIsLoading(true);
      setError(null);
      let apiUrl = backendUrl('get_products.php');
      const params = new URLSearchParams();
      if (selectedCategoryId) params.append('category_id', selectedCategoryId);
      if (sort) params.append('sort', sort);
      const qs = params.toString();
      if (qs) apiUrl += `?${qs}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          console.log("Datos recibidos, actualizando estado:", data.data); // Log justo antes de setProducts
          // 2. Actualiza el estado con los productos recibidos
          setProducts(data.data);
        } else {
          console.error('API no exitosa o formato incorrecto:', data.message || data);
          setError(data.message || 'No se pudieron cargar los productos.');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error en fetchProducts:', err);
        setError(err.message || 'Error al conectar con el servidor.');
        setProducts([]);
      } finally {
        // 3. Termina la carga (SIEMPRE, incluso si hay error)
        setIsLoading(false);
        console.log("Carga finalizada."); // Log para ver cuándo termina isLoading
      }
    };
    fetchProducts();
  }, [selectedCategoryId, sort]);

  // Cargar categorías y aplicar parámetros iniciales
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await fetch(backendUrl('get_categories.php'));
        const cats = await resp.json();
        if (Array.isArray(cats)) {
          setCategories(cats);
          // Si viene un category_id/category por query, configurarlo una vez
          if (categoryParam) {
            // Si es numérico, úsalo; si es nombre, intenta buscar su id
            if (!isNaN(Number(categoryParam))) {
              setSelectedCategoryId(String(categoryParam));
            } else {
              const match = cats.find(c => c.name === categoryParam);
              if (match) setSelectedCategoryId(String(match.id));
            }
          }
          if (sortParam) setSort(sortParam);
        }
      } catch (e) { /* opcional: manejar error silencioso */ }
    };
    fetchCategories();
    // Solo necesitamos correr esto cuando cambie el query param en la URL
  }, [categoryParam, sortParam]);

  const pageTitle = 'Productos';

  // Log para depurar el estado en cada renderizado
  console.log("Renderizando - isLoading:", isLoading, "error:", error, "products.length:", products.length);

  return (
    <div className="product-list-page-container">
      <h2>{pageTitle}</h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <select
          className="form-select"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Recién llegados</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="name">Nombre (A-Z)</option>
        </select>
      </div>

      {/* 1. Muestra 'Cargando...' solo si isLoading es true */}
      {isLoading && <p>Cargando productos...</p>}

      {/* 2. Muestra error si existe y no está cargando */}
      {!isLoading && error && <p className="error-message">{error}</p>}

      {/* 3. Muestra productos o mensaje 'No encontrado' solo si NO está cargando Y NO hay error */}
      {!isLoading && !error && (
        <div className="product-list">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // Este mensaje se muestra si !isLoading, !error, y products.length es 0
            <p>No se encontraron productos.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductListPage;
