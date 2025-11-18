import React from "react";
import "./HeroSection.css";
import bodyArmorImage from "../Images/BodyArmor.jpeg";
import tacticalGearImage from "../Images/gear.jpeg";
import mirasOpticasImage from "../Images/MirasOpticas.jpg";

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${bodyArmorImage})` }}></div>
          <div className="hero-item-text">Body Armor</div>
        </div>
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${tacticalGearImage})` }}></div>
          <div className="hero-item-text">Tactical Gear</div>
        </div>
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${mirasOpticasImage})` }}></div>
          <div className="hero-item-text">Miras Ópticas</div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
