import React, { useState } from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOrder = () => {
    if (product.inStock && quantity > 0) {
      onAddToCart({ ...product, quantity });
      setQuantity(1);
      onClose();
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-header-title">Chi tiết sản phẩm</h2>
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-image-wrapper">
            <img
              src={product.image}
              alt={product.name}
              className="modal-image"
            />
          </div>

          <div className="modal-info">
            <div className="modal-badges">
              <span
                className={`modal-badge ${product.category === "Món ăn" ? "badge-red" : "badge-blue"}`}
              >
                {product.category}
              </span>
              <span
                className={`modal-badge ${product.inStock ? "badge-green" : "badge-red-light"}`}
              >
                {product.inStock ? "✅ Còn hàng" : "❌ Hết hàng"}
              </span>
            </div>

            <div className="modal-title-section">
              <h3 className="modal-product-title">{product.name}</h3>
              <p className="modal-product-price">
                {product.price.toLocaleString("vi-VN")}đ
                <span className="modal-product-unit">/ {product.unit}</span>
              </p>
            </div>

            <div className="modal-description">
              <h4 className="modal-description-title">
                <span className="modal-description-icon">📝</span>
                Mô tả sản phẩm
              </h4>
              <p className="modal-description-text">
                {product.description ||
                  `${product.name} là một trong những sản phẩm đặc biệt của chúng tôi, được chế biến từ nguyên liệu tươi ngon, đảm bảo chất lượng cao nhất.`}
              </p>
            </div>

            <div className="modal-details-grid">
              <div className="modal-detail-item">
                <p className="modal-detail-label">Mã sản phẩm</p>
                <p className="modal-detail-value">{product.id.toUpperCase()}</p>
              </div>
              <div className="modal-detail-item">
                <p className="modal-detail-label">Đơn vị</p>
                <p className="modal-detail-value">{product.unit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {product.inStock ? (
            <div className="modal-order-section">
              <div className="modal-quantity-wrapper">
                <label className="modal-quantity-label">Số lượng:</label>
                <div className="modal-quantity-controls">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    className="modal-quantity-btn"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="modal-quantity-value">{quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    className="modal-quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>
              <button onClick={handleOrder} className="modal-order-btn">
                ORDER
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="modal-footer-btn">
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
