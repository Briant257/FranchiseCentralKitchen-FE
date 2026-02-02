import React from "react";
import "./HeroBanner.css";

const HeroBanner = () => {
  return (
    <div className="hero-banner">
      <div className="hero-banner-image-wrapper">
        <img 
          src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1200&h=600&fit=crop" 
          alt="KFC Chicken Banner"
          className="hero-banner-image"
        />
        <div className="hero-banner-overlay"></div>
      </div>
    </div>
  );
};

export default HeroBanner;
