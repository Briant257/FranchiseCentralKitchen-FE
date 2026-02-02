import React from "react";
import "./Header.css";

const Header = ({
  cart,
  onUpdateQuantity,
  onRemove,
  onSubmitOrder,
  isCartOpen,
  onToggleCart,
  onOpenLogin,
  user,
  onLogout,
}) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-container">
          <div className="header-content">
            <nav className="header-nav">
              <div className="header-logo-wrapper">
                <img
                  src="https://st.chungta.vn/v389/chungta/images/graphics/fpt_logo_2025.png"
                  alt="FPT Logo"
                  className="header-logo"
                />
              </div>
              <a href="#" className="header-nav-link active">
                CRS
              </a>
            </nav>

            <div className="header-actions">
              <div className="header-cart-wrapper">
                <button className="header-cart-btn" onClick={onToggleCart}>
                  <span className="header-cart-icon">🛒</span>
                  <span className="header-cart-badge">{cart.length}</span>
                </button>

                {isCartOpen && (
                  <div className="header-cart-dropdown">
                    <div className="header-cart-dropdown-header">
                      <h3 className="header-cart-dropdown-title">
                        🛒 GIỎ HÀNG ({cart.length})
                      </h3>
                      <button
                        onClick={onToggleCart}
                        className="header-cart-dropdown-close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="header-cart-dropdown-body">
                      {cart.length === 0 ? (
                        <div className="header-cart-empty">
                          <div className="header-cart-empty-icon">🛒</div>
                          <p className="header-cart-empty-text">
                            Chưa có sản phẩm
                          </p>
                        </div>
                      ) : (
                        <div className="header-cart-items">
                          {cart.map((item, index) => (
                            <div key={index} className="header-cart-item">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="header-cart-item-image"
                              />
                              <div className="header-cart-item-content">
                                <p className="header-cart-item-name">
                                  {item.name}
                                </p>
                                <p className="header-cart-item-price">
                                  {item.price.toLocaleString("vi-VN")}đ
                                </p>
                                <div className="header-cart-item-actions">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      onUpdateQuantity(
                                        index,
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                    className="header-cart-item-quantity"
                                  />
                                  <button
                                    onClick={() => onRemove(index)}
                                    className="header-cart-item-remove"
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

                    {cart.length > 0 && (
                      <div className="header-cart-dropdown-footer">
                        <div className="header-cart-total">
                          <span className="header-cart-total-label">
                            TỔNG CỘNG:
                          </span>
                          <span className="header-cart-total-value">
                            {total.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        <button
                          onClick={onSubmitOrder}
                          className="header-cart-submit-btn"
                        >
                          ĐẶT HÀNG NGAY
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isCartOpen && (
                <div
                  className="header-cart-overlay"
                  onClick={onToggleCart}
                ></div>
              )}

              <button className="header-menu-btn">
                <div className="header-menu-line"></div>
                <div className="header-menu-line"></div>
                <div className="header-menu-line"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="header-bottom">
        <div className="header-container">
          <div className="header-bottom-content">
            <div className="header-bottom-left">
              <button className="header-bottom-btn">
                <span className="header-bottom-icon">🏪</span>
                <span>Đặt Ngay</span>
              </button>
              <button className="header-bottom-btn">
                <span className="header-bottom-icon">🏍️</span>
                <span>Giao Hàng</span>
              </button>
            </div>

            <button
              className="header-login-btn"
              onClick={user ? onLogout : onOpenLogin}
            >
              {user ? `👤 ${user.name} (Đăng xuất)` : "Đăng ký / Đăng nhập"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
