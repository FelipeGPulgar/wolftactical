// src/pages/Home.js
// Ya no necesitas useState ni useEffect si no cargas productos aquí
import React from "react";
import HeroSection from "../components/HeroSection";
import Brands from "../components/Brands";
import Subscribe from "../components/Subscribe";
import Carousel from "../components/Carousel";
import VideoSection from "../components/VideoSection";
// Ya no necesitas importar ProductCard si no lo usas aquí
// import ProductCard from "../components/ProductCard";

function Home() {
  // --- Eliminado el estado 'products' y el useEffect ---
  // const [products, setProducts] = useState([]);
  // useEffect(() => { ... fetch ... }, []);

  return (
    <div>
      <Carousel />
      <Subscribe />
      <HeroSection />
      <VideoSection /> {/* Componente de video */}

      {/* --- Eliminada la sección de Productos Destacados --- */}
      {/*
      <h2>Productos Destacados</h2>
      <div className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>Cargando productos o no se encontraron productos.</p>
        )}
      </div>
      */}

      <Brands />
    </div>
  );
}

export default Home;
