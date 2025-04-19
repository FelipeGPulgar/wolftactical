// src/components/ProductCard.js
import React from "react";

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={`http://localhost/schizotactical/images/${product.main_image}`} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <p>{product.subcategory}</p>
      <p>${product.price}</p>
    </div>
  );
}

export default ProductCard;
