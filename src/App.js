import React, { useState, useEffect } from "react";
import api from "./services/api";
import LoginPage from "./pages/Login";
import FranchiseStorePage from "./pages/FranchiseStore";
import AdminPage from "./pages/Admin";
import "./styles/ck-app.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.init();
    if (api.isAuthenticated()) {
      const stored = api.getStoredUser();
      if (stored) setCurrentUser(stored);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const userData = {
    ...currentUser,
    name: currentUser.name || currentUser.username,
    storeName:
      currentUser.storeName ||
      (currentUser.role === "kitchen" ? "Bếp trung tâm" : currentUser.username),
  };

  if (currentUser.role === "franchise" || currentUser.role === "kitchen") {
    return <FranchiseStorePage onLogout={handleLogout} userData={userData} />;
  }

  if (currentUser.role === "admin") {
    return <AdminPage onLogout={handleLogout} userData={userData} />;
  }

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-flex ck-items-center ck-justify-center">
      <div className="ck-grain" />
      <div className="ck-text-center">
        <h1 className="ck-text-4xl ck-font-black ck-text-white ck-mb-4">
          Chức năng đang phát triển
        </h1>
        <p className="ck-text-gray-400 ck-mb-8">
          Vai trò này chưa được hoàn thiện
        </p>
        <button
          type="button"
          className="ck-btn ck-px-6 ck-py-3 ck-bg-red-500 ck-text-white ck-rounded-xl ck-font-bold"
          style={{ border: "none" }}
          onClick={handleLogout}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default App;
