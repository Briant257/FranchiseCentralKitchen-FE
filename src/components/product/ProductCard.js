import React from "react";
import "./ProductCard.css";

const ProductCard = ({ product, onShowDetail }) => {
  const handleCardClick = () => {
    onShowDetail(product);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-card-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
        />
        {!product.inStock && (
          <div className="product-card-out-of-stock">
            <span className="product-card-out-of-stock-text">HẾT HÀNG</span>
          </div>
        )}
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-price">
          {product.price.toLocaleString("vi-VN")}đ
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
