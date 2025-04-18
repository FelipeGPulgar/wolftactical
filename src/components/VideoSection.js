import React from "react";
import "./VideoSection.css"; // Importar el archivo de estilos

function VideoSection() {
  return (
    <div className="video-section">
      <video className="video-player" autoPlay loop>
        <source src="/video/Intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoSection;