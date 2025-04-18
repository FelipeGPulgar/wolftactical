import React from "react";
import "./HeroSection.css";
import holstersImage from "../Images/Holters.jpeg";
import bodyArmorImage from "../Images/BodyArmor.jpeg";
import nightVisionImage from "../Images/NightVision.jpeg";
import tacticalGearImage from "../Images/gear.jpeg";

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${holstersImage})` }}></div>
          <div className="hero-item-text">Holsters</div>
        </div>
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${bodyArmorImage})` }}></div>
          <div className="hero-item-text">Body Armor</div>
        </div>
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${nightVisionImage})` }}></div>
          <div className="hero-item-text">Night Vision</div>
        </div>
        <div className="hero-item">
          <div className="hero-item-background" style={{ backgroundImage: `url(${tacticalGearImage})` }}></div>
          <div className="hero-item-text">Tactical Gear</div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
