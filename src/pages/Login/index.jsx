import React, { useState } from "react";
import { ChefHat, User, Lock, Eye, EyeOff } from "../../components/icons/Icons";
import api from "../../services/api";

/**
 * Trang đăng nhập Central Kitchen (Auth API: token lưu sau khi login)
 */
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ck-root ck-login-page">
      <div className="ck-grain" />
      <div
        className="ck-absolute ck-inset-0 ck-bg-grid-pattern"
        style={{ pointerEvents: "none" }}
      />

      <div className="ck-login-card">
        <div className="ck-login-box ck-animate-slide-in">
          <div className="ck-text-center ck-mb-8">
            <div
              className="ck-flex ck-items-center ck-justify-center ck-w-14-h-14 ck-logo-icon ck-rounded-2xl ck-mb-4 ck-shadow-lg"
              style={{ marginLeft: "auto", marginRight: "auto" }}
            >
              <ChefHat className="ck-text-white" size={40} />
            </div>
            <h2 className="ck-text-3xl ck-font-black ck-text-white ck-mb-2">
              Central Kitchen
            </h2>
            <p className="ck-text-gray-400 ck-mono">
              Hệ thống quản lý bếp trung tâm
            </p>
          </div>

          {error && (
            <div className="ck-error-box ck-rounded-xl ck-shake">
              <p className="ck-text-red-400 ck-text-sm ck-font-semibold ck-text-center">
                {error}
              </p>
            </div>
          )}

          <form
            className="ck-space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div>
              <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                Tên đăng nhập
              </label>
              <div className="ck-input-wrap">
                <span className="ck-input-icon">
                  <User size={20} />
                </span>
                <input
                  type="text"
                  className="ck-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                Mật khẩu
              </label>
              <div className="ck-input-wrap" style={{ position: "relative" }}>
                <span className="ck-input-icon">
                  <Lock size={20} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="ck-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ck-password-toggle"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#f97316";
                    e.currentTarget.style.background = "rgba(249, 115, 22, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.background = "none";
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ck-btn ck-btn-primary ck-w-full"
              disabled={loading}
            >
              {loading ? "⏳ Đang xác thực..." : "🚀 Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
