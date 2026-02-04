import React, { useState } from "react";
import { ChefHat, User, Lock } from "../../components/icons/Icons";
import api from "../../services/api";

/**
 * Trang đăng nhập Central Kitchen (Auth API: token lưu sau khi login)
 */
function LoginPage({ onLogin }) {
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [reg, setReg] = useState({
    username: "",
    password: "",
    fullName: "",
    employeeCode: "",
    role: "KITCHEN_STAFF",
  });

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setError("");
    setSuccess("");
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

  const handleRegister = async () => {
    if (!reg.username || !reg.password || !reg.fullName || !reg.employeeCode) {
      setError("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.register(reg);
      const msg =
        res.message ||
        (res.employeeCode
          ? `Đăng ký thành công! Mã nhân viên của bạn là: ${res.employeeCode}`
          : "Đăng ký thành công!");
      setSuccess(msg);
      setReg({
        username: "",
        password: "",
        fullName: "",
        employeeCode: "",
        role: "KITCHEN_STAFF",
      });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại!");
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
          {success && (
            <div className="ck-rounded-xl ck-p-3 ck-mb-4 ck-bg-green-500-20 ck-border ck-border-green-500-30">
              <p className="ck-text-green-400 ck-text-sm ck-font-semibold ck-text-center">
                {success}
              </p>
            </div>
          )}

          {!showRegister ? (
            <>
              <div className="ck-space-y-5">
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
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="Nhập tên đăng nhập"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Mật khẩu
                  </label>
                  <div className="ck-input-wrap">
                    <span className="ck-input-icon">
                      <Lock size={20} />
                    </span>
                    <input
                      type="password"
                      className="ck-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="ck-btn ck-btn-primary ck-w-full"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "⏳ Đang xác thực..." : "🚀 Đăng nhập"}
                </button>

                <button
                  type="button"
                  className="ck-btn ck-w-full ck-py-2 ck-text-gray-400 ck-text-sm"
                  style={{ background: "none", border: "none" }}
                  onClick={() => setShowRegister(true)}
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="ck-space-y-4">
                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    className="ck-input ck-w-full"
                    value={reg.username}
                    onChange={(e) =>
                      setReg((r) => ({ ...r, username: e.target.value }))
                    }
                    placeholder="bep_truong_02"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    className="ck-input ck-w-full"
                    value={reg.password}
                    onChange={(e) =>
                      setReg((r) => ({ ...r, password: e.target.value }))
                    }
                    placeholder="password123"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Họ tên *
                  </label>
                  <input
                    type="text"
                    className="ck-input ck-w-full"
                    value={reg.fullName}
                    onChange={(e) =>
                      setReg((r) => ({ ...r, fullName: e.target.value }))
                    }
                    placeholder="Nguyễn Văn Bếp Trưởng"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Mã nhân viên *
                  </label>
                  <input
                    type="text"
                    className="ck-input ck-w-full"
                    value={reg.employeeCode}
                    onChange={(e) =>
                      setReg((r) => ({ ...r, employeeCode: e.target.value }))
                    }
                    placeholder="NV001"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">
                    Vai trò
                  </label>
                  <select
                    className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                    value={reg.role}
                    onChange={(e) =>
                      setReg((r) => ({ ...r, role: e.target.value }))
                    }
                  >
                    <option value="KITCHEN_STAFF">Nhân viên bếp</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="ck-btn ck-btn-primary ck-w-full"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>

                <button
                  type="button"
                  className="ck-btn ck-w-full ck-py-2 ck-text-gray-400 ck-text-sm"
                  style={{ background: "none", border: "none" }}
                  onClick={() => {
                    setShowRegister(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
