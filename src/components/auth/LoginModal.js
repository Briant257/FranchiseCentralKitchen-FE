import React, { useState } from "react";
import "./LoginModal.css";

const LoginModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onGoogleLogin,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLoginMode) {
      if (!formData.email) {
        newErrors.email = "Vui lòng nhập email";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    } else {
      if (!formData.name) {
        newErrors.name = "Vui lòng nhập họ tên";
      }
      if (!formData.email) {
        newErrors.email = "Vui lòng nhập email";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
      if (!formData.phone) {
        newErrors.phone = "Vui lòng nhập số điện thoại";
      } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ";
      }
      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu không khớp";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLoginMode) {
      onLogin({
        email: formData.email,
        password: formData.password,
      });
    } else {
      onRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    }

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleGoogleLogin = () => {
    // Mô phỏng đăng nhập Google
    // Trong ứng dụng thật, bạn cần tích hợp Google OAuth 2.0
    // Sử dụng Google Identity Services hoặc thư viện như @react-oauth/google

    // Giả lập popup đăng nhập Google
    const googleEmail = prompt("Nhập email Gmail của bạn (mô phỏng):");
    if (googleEmail && googleEmail.includes("@gmail.com")) {
      onGoogleLogin({
        email: googleEmail,
        name: googleEmail.split("@")[0],
        provider: "google",
      });
    } else if (googleEmail) {
      alert("⚠️ Vui lòng nhập email Gmail hợp lệ!");
    }
  };

  return (
    <div className="login-modal-backdrop" onClick={handleBackdropClick}>
      <div className="login-modal-content">
        <div className="login-modal-header">
          <h2 className="login-modal-title">
            {isLoginMode ? "Đăng nhập" : "Đăng ký"}
          </h2>
          <button onClick={onClose} className="login-modal-close-btn">
            ✕
          </button>
        </div>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="login-form-group">
              <label className="login-form-label">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`login-form-input ${errors.name ? "error" : ""}`}
                placeholder="Nhập họ và tên"
              />
              {errors.name && (
                <span className="login-form-error">{errors.name}</span>
              )}
            </div>
          )}

          <div className="login-form-group">
            <label className="login-form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`login-form-input ${errors.email ? "error" : ""}`}
              placeholder="Nhập email"
            />
            {errors.email && (
              <span className="login-form-error">{errors.email}</span>
            )}
          </div>

          {!isLoginMode && (
            <div className="login-form-group">
              <label className="login-form-label">Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`login-form-input ${errors.phone ? "error" : ""}`}
                placeholder="Nhập số điện thoại"
              />
              {errors.phone && (
                <span className="login-form-error">{errors.phone}</span>
              )}
            </div>
          )}

          <div className="login-form-group">
            <label className="login-form-label">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`login-form-input ${errors.password ? "error" : ""}`}
              placeholder="Nhập mật khẩu"
            />
            {errors.password && (
              <span className="login-form-error">{errors.password}</span>
            )}
          </div>

          {!isLoginMode && (
            <div className="login-form-group">
              <label className="login-form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`login-form-input ${errors.confirmPassword ? "error" : ""}`}
                placeholder="Nhập lại mật khẩu"
              />
              {errors.confirmPassword && (
                <span className="login-form-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          )}

          <button type="submit" className="login-form-submit-btn">
            {isLoginMode ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <div className="login-modal-divider">
          <span className="login-divider-line"></span>
          <span className="login-divider-text">hoặc</span>
          <span className="login-divider-line"></span>
        </div>

        <div className="login-modal-social">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="login-google-btn"
          >
            <svg
              className="login-google-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </button>
        </div>

        <div className="login-modal-footer">
          <p className="login-modal-switch-text">
            {isLoginMode ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={switchMode}
              className="login-modal-switch-btn"
            >
              {isLoginMode ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
