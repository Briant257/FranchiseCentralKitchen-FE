import React from "react";
import "./CartSidebar.css";

const CartSidebar = ({ items, onUpdateQuantity, onRemove, onSubmitOrder, isOpen, onToggle }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <button
        onClick={onToggle}
        className="cart-sidebar-toggle-btn"
      >
        🛒 <span className="cart-sidebar-toggle-count">({items.length})</span>
      </button>

      <div className={`cart-sidebar ${isOpen ? "open" : ""}`}>
        <div className="cart-sidebar-container">
          <div className="cart-sidebar-header">
            <h2 className="cart-sidebar-title">
              🛒 GIỎ HÀNG ({items.length})
            </h2>
            <button onClick={onToggle} className="cart-sidebar-close-btn">✕</button>
          </div>

          <div className="cart-sidebar-body">
            {items.length === 0 ? (
              <div className="cart-sidebar-empty">
                <div className="cart-sidebar-empty-icon">🛒</div>
                <p className="cart-sidebar-empty-text">Chưa có sản phẩm</p>
              </div>
            ) : (
              <div className="cart-sidebar-items">
                {items.map((item, index) => (
                  <div key={index} className="cart-sidebar-item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-sidebar-item-image"
                    />
                    <div className="cart-sidebar-item-content">
                      <p className="cart-sidebar-item-name">
                        {item.name}
                      </p>
                      <p className="cart-sidebar-item-price">
                        {item.price.toLocaleString("vi-VN")}đ
                      </p>
                      <div className="cart-sidebar-item-actions">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          className="cart-sidebar-item-quantity"
                        />
                        <button
                          onClick={() => onRemove(index)}
                          className="cart-sidebar-item-remove"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="cart-sidebar-footer">
              <div className="cart-sidebar-total">
                <span className="cart-sidebar-total-label">TỔNG CỘNG:</span>
                <span className="cart-sidebar-total-value">{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <button
                onClick={onSubmitOrder}
                className="cart-sidebar-submit-btn"
              >
                ĐẶT HÀNG NGAY
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          className="cart-sidebar-overlay"
          onClick={onToggle}
        ></div>
      )}
    </>
  );
};

export default CartSidebar;
