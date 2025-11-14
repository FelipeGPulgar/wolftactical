import React, { useState, useEffect, useCallback } from "react";
import "./Carousel.css";

import carrusel3 from "../Images/Carrusel3.png";
import carrusel4 from "../Images/Carrusel4.jpeg";

function Carousel() {
  const images = [carrusel3, carrusel4];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePrevious = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Duración de la transición
    }
  }, [isTransitioning, images.length]);

  const handleNext = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Duración de la transición
    }
  }, [isTransitioning, images.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext(); // Cambia de imagen cada 3 segundos
    }, 3000);

    return () => clearInterval(interval); // Limpieza en desmontaje del componente
  }, [handleNext]);

  return (
    <div className="carousel">
      <div
        className="carousel-inner"
        style={{ transform: `translateX(-${currentIndex * 100}%)`, transition: 'transform 0.5s ease' }}
      >
        {images.map((image, index) => (
          <div className="carousel-item" key={index}>
            <div
              className="carousel-item-background"
              style={{ backgroundImage: `url(${image})` }}
            ></div>
          </div>
        ))}
      </div>
      <button className="carousel-button prev" onClick={handlePrevious}>
        &lt;
      </button>
      <button className="carousel-button next" onClick={handleNext}>
        &gt;
      </button>
    </div>
  );
}

export default Carousel;
