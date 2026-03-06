import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Store,
  Shield,
  LogOut,
  Plus,
  XCircle,
  UserPlus,
  X,
  Eye,
  Trash2,
} from "../../components/icons/Icons";
import api from "../../services/api";
import StatCard from "../../components/common/StatCard";
import { ADMIN_TABS, ROLE_LABELS } from "../../constants";

const AdminPage = ({ onLogout, userData }) => {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories"); // 'categories' | 'products'
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "franchise",
    storeName: "",
    status: "active",
  });
  const [newStore, setNewStore] = useState({
    username: "",
    password: "",
    name: "",
    storeName: "",
    status: "active",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    min: "",
    emoji: "🥪",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c, p] = await Promise.all([
          api.getUsers(),
          api.getCategories(),
          api.getProducts(),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setCategories(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
      } catch (err) {
        console.error("Admin load:", err);
      }
    };
    load();
  }, []);

  const loadAdminData = async () => {
    try {
      const [u, c, p] = await Promise.all([
        api.getUsers(),
        api.getCategories(),
        api.getProducts(),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setCategories(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error("Admin load:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      window.alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newUser.role === "franchise" && !newUser.storeName) {
      window.alert("Vui lòng nhập tên cửa hàng!");
      return;
    }
    try {
      const existingUsers = await api.getUsers();
      if (existingUsers.find((u) => u.username === newUser.username)) {
        window.alert("Tên đăng nhập đã tồn tại!");
        return;
      }
      const user = {
        id: Date.now(),
        ...newUser,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      await api.saveUsers([...existingUsers, user]);
      await loadAdminData();
      setShowAddUser(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        role: "franchise",
        storeName: "",
        status: "active",
      });
      window.alert("✅ Thêm người dùng thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const existingUsers = await api.getUsers();
      const updatedUsers = existingUsers.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u,
      );
      await api.saveUsers(updatedUsers);
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không cập nhật được"));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      const existingUsers = await api.getUsers();
      await api.saveUsers(existingUsers.filter((u) => u.id !== userId));
      await loadAdminData();
      window.alert("✅ Đã xóa người dùng!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const existingUsers = await api.getUsers();
      const updatedUsers = existingUsers.map((u) => {
        if (u.id !== userId) return u;
        const updated = { ...u, role: newRole };
        if (newRole !== "franchise") updated.storeName = "";
        return updated;
      });
      await api.saveUsers(updatedUsers);
      await loadAdminData();
      window.alert("✅ Đã đổi vai trò!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không cập nhật được"));
    }
  };

  const handleAddStore = async () => {
    if (
      !newStore.username ||
      !newStore.password ||
      !newStore.name ||
      !newStore.storeName
    ) {
      window.alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    try {
      const existingUsers = await api.getUsers();
      if (existingUsers.find((u) => u.username === newStore.username)) {
        window.alert("Tên đăng nhập đã tồn tại!");
        return;
      }
      const user = {
        id: Date.now(),
        ...newStore,
        role: "franchise",
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      await api.saveUsers([...existingUsers, user]);
      await loadAdminData();
      setShowAddStore(false);
      setNewStore({
        username: "",
        password: "",
        name: "",
        storeName: "",
        status: "active",
      });
      window.alert("✅ Thêm cửa hàng thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleSaveCategory = async () => {
    const name = (
      editingCategory ? editingCategory.name : newCategoryName
    ).trim();
    if (!name) {
      window.alert("Vui lòng nhập tên danh mục!");
      return;
    }
    try {
      const list = await api.getCategories();
      if (editingCategory) {
        const updated = list.map((c) =>
          c.id === editingCategory.id ? { ...c, name } : c,
        );
        await api.saveCategories(updated);
        const prods = await api.getProducts();
        await api.saveProducts(
          prods.map((p) =>
            p.category === editingCategory.name ? { ...p, category: name } : p,
          ),
        );
        setEditingCategory(null);
        window.alert("✅ Đã cập nhật danh mục!");
      } else {
        if (list.some((c) => c.name === name)) {
          window.alert("Danh mục này đã tồn tại!");
          return;
        }
        await api.saveCategories([...list, { id: "cat" + Date.now(), name }]);
        setNewCategoryName("");
        setShowAddCategory(false);
        window.alert("✅ Thêm danh mục thành công!");
      }
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteCategory = async (cat) => {
    const prods = await api.getProducts();
    const inCat = prods.filter((p) => p.category === cat.name);
    if (inCat.length > 0) {
      window.alert(
        `Không thể xóa. Còn ${inCat.length} sản phẩm thuộc danh mục "${cat.name}". Hãy đổi danh mục sản phẩm trước.`,
      );
      return;
    }
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      const list = await api.getCategories();
      await api.saveCategories(list.filter((c) => c.id !== cat.id));
      await loadAdminData();
      window.alert("✅ Đã xóa danh mục!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const handleSaveProduct = async () => {
    const p = editingProduct || newProduct;
    const name = (p.name || "").trim();
    const category = (p.category || "").trim();
    const price = parseInt(p.price, 10);
    const stock = parseInt(p.stock, 10);
    const min = parseInt(p.min, 10);
    if (
      !name ||
      !category ||
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(stock) ||
      stock < 0 ||
      Number.isNaN(min) ||
      min < 0
    ) {
      window.alert(
        "Vui lòng điền đầy đủ thông tin hợp lệ (tên, danh mục, giá, tồn kho, min).",
      );
      return;
    }
    try {
      const list = await api.getProducts();
      if (editingProduct) {
        const updated = list.map((x) =>
          x.id === editingProduct.id
            ? {
                ...editingProduct,
                name,
                category,
                price,
                stock,
                min,
                emoji: p.emoji || "🥪",
              }
            : x,
        );
        await api.saveProducts(updated);
        setEditingProduct(null);
        window.alert("✅ Đã cập nhật sản phẩm!");
      } else {
        const maxNum = list.reduce((acc, x) => {
          const n = parseInt(String(x.id).replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? acc : Math.max(acc, n);
        }, 0);
        const id = "P" + String(maxNum + 1).padStart(3, "0");
        await api.saveProducts([
          ...list,
          { id, name, category, price, stock, min, emoji: p.emoji || "🥪" },
        ]);
        setShowAddProduct(false);
        setNewProduct({
          name: "",
          category: "",
          price: "",
          stock: "",
          min: "",
          emoji: "🥪",
        });
        window.alert("✅ Thêm sản phẩm thành công!");
      }
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    try {
      const list = await api.getProducts();
      await api.saveProducts(list.filter((p) => p.id !== product.id));
      await loadAdminData();
      window.alert("✅ Đã xóa sản phẩm!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const franchiseStores = users.filter((u) => u.role === "franchise");

  const adminStats = [
    {
      label: "Tổng người dùng",
      value: users.length.toString(),
      change: "",
      icon: Users,
      color: "ck-icon-box-blue",
    },
    {
      label: "Đang hoạt động",
      value: users.filter((u) => u.status === "active").length.toString(),
      change: "",
      icon: CheckCircle,
      color: "ck-icon-box-green",
    },
    {
      label: "Nhân viên CH",
      value: users.filter((u) => u.role === "franchise").length.toString(),
      change: "",
      icon: Store,
      color: "ck-icon-box-purple",
    },
    {
      label: "Quản trị viên",
      value: users.filter((u) => u.role === "admin").length.toString(),
      change: "",
      icon: Shield,
      color: "ck-icon-box-red",
    },
  ];

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg">
            <Shield className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">
              Quản trị hệ thống
            </h1>
            <p className="ck-text-xs ck-text-gray-400 ck-mono">
              {userData.name} - Admin
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ck-btn ck-flex ck-items-center ck-gap-2 ck-px-4 ck-py-2 ck-bg-red-500-20 ck-text-red-400 ck-rounded-xl ck-font-semibold"
          style={{ border: "none" }}
          onClick={onLogout}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </header>

      <main className="ck-p-8">
        <div
          className="ck-max-w-7xl"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="ck-flex ck-gap-2 ck-mb-8 ck-flex-wrap">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`ck-btn ck-px-5 ck-py-3 ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2 ${
                    adminTab === tab.id
                      ? "ck-bg-gradient-btn-admin ck-text-white"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={
                    adminTab !== tab.id
                      ? { border: "1px solid var(--ck-border)" }
                      : {}
                  }
                  onClick={() => setAdminTab(tab.id)}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {adminTab === "dashboard" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Dashboard Admin
              </h2>
              <div className="ck-grid-4 ck-gap-6 ck-mb-10">
                {adminStats.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Quản lý người dùng
                  </h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    onClick={() => setShowAddUser(true)}
                  >
                    <UserPlus size={18} />
                    Thêm người dùng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Tên đăng nhập</th>
                        <th>Họ tên</th>
                        <th>Vai trò</th>
                        <th>Địa điểm</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <p className="ck-font-bold ck-text-white ck-mono">
                              {user.username}
                            </p>
                            <p className="ck-text-xs ck-text-gray-500">
                              ID: {user.id}
                            </p>
                          </td>
                          <td>
                            <div className="ck-flex ck-items-center ck-gap-3">
                              <div className="ck-avatar">
                                {user.name.charAt(0)}
                              </div>
                              <span className="ck-font-semibold ck-text-white">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            {user.id === userData.id ? (
                              <span className="ck-text-gray-400">
                                {ROLE_LABELS[user.role]}
                              </span>
                            ) : (
                              <select
                                className="ck-select ck-px-3 ck-py-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-lg ck-text-sm"
                                value={user.role}
                                onChange={(e) =>
                                  handleChangeRole(user.id, e.target.value)
                                }
                              >
                                <option value="franchise">
                                  Nhân viên cửa hàng
                                </option>
                                <option value="kitchen">Nhân viên bếp</option>
                                <option value="coordinator">
                                  Điều phối viên
                                </option>
                                <option value="manager">Quản lý</option>
                              </select>
                            )}
                          </td>
                          <td className="ck-text-gray-400">
                            {user.storeName || "-"}
                          </td>
                          <td className="ck-text-center">
                            <button
                              type="button"
                              className={`ck-btn ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${
                                user.status === "active"
                                  ? "ck-bg-green-500-20 ck-text-green-400"
                                  : "ck-bg-gray-500-20 ck-text-gray-400"
                              }`}
                              style={{ border: "none" }}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.status === "active"
                                ? "✓ Hoạt động"
                                : "✗ Vô hiệu"}
                            </button>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg"
                                style={{ background: "none", border: "none" }}
                                onClick={() => handleToggleStatus(user.id)}
                                title={
                                  user.status === "active"
                                    ? "Vô hiệu hóa"
                                    : "Kích hoạt"
                                }
                              >
                                {user.status === "active" ? (
                                  <XCircle
                                    size={18}
                                    className="ck-text-yellow-400"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={18}
                                    className="ck-text-green-400"
                                  />
                                )}
                              </button>
                              {user.role !== "admin" && (
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                  style={{ border: "none" }}
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Xóa"
                                >
                                  <Trash2
                                    size={18}
                                    className="ck-text-red-400"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminTab === "franchise" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Quản lý danh mục cửa hàng franchise
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Danh sách cửa hàng franchise và tài khoản nhân viên cửa hàng.
              </p>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Danh sách cửa hàng
                  </h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    onClick={() => setShowAddStore(true)}
                  >
                    <Plus size={18} />
                    Thêm cửa hàng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên cửa hàng</th>
                        <th>Người phụ trách</th>
                        <th>Tên đăng nhập</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchiseStores.map((user, idx) => (
                        <tr key={user.id}>
                          <td className="ck-text-gray-400">{idx + 1}</td>
                          <td className="ck-font-semibold ck-text-white">
                            {user.storeName || "-"}
                          </td>
                          <td className="ck-text-gray-400">{user.name}</td>
                          <td className="ck-mono ck-text-gray-400">
                            {user.username}
                          </td>
                          <td className="ck-text-center">
                            <span
                              className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${
                                user.status === "active"
                                  ? "ck-bg-green-500-20 ck-text-green-400"
                                  : "ck-bg-gray-500-20 ck-text-gray-400"
                              }`}
                            >
                              {user.status === "active"
                                ? "Hoạt động"
                                : "Vô hiệu"}
                            </span>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                style={{ border: "none" }}
                                onClick={() => handleToggleStatus(user.id)}
                                title={
                                  user.status === "active"
                                    ? "Vô hiệu hóa"
                                    : "Kích hoạt"
                                }
                              >
                                {user.status === "active" ? (
                                  <XCircle size={18} />
                                ) : (
                                  <CheckCircle size={18} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                style={{ border: "none" }}
                                onClick={() => handleDeleteUser(user.id)}
                                title="Xóa"
                              >
                                <Trash2 size={18} className="ck-text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {franchiseStores.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có cửa hàng franchise. Bấm &quot;Thêm cửa hàng&quot; để
                    tạo.
                  </div>
                )}
              </div>
            </>
          )}

          {adminTab === "kitchen" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Quản lý danh mục bếp trung tâm
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Danh mục sản phẩm và sản phẩm do bếp trung tâm cung cấp.
              </p>
              <div className="ck-flex ck-gap-2 ck-mb-6">
                <button
                  type="button"
                  className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                    kitchenSubTab === "categories"
                      ? "ck-bg-orange-500-20 ck-text-orange-400"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={
                    kitchenSubTab !== "categories"
                      ? { border: "1px solid var(--ck-border)" }
                      : { border: "none" }
                  }
                  onClick={() => setKitchenSubTab("categories")}
                >
                  Danh mục sản phẩm
                </button>
                <button
                  type="button"
                  className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                    kitchenSubTab === "products"
                      ? "ck-bg-orange-500-20 ck-text-orange-400"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={
                    kitchenSubTab !== "products"
                      ? { border: "1px solid var(--ck-border)" }
                      : { border: "none" }
                  }
                  onClick={() => setKitchenSubTab("products")}
                >
                  Sản phẩm bếp trung tâm
                </button>
              </div>

              {kitchenSubTab === "categories" && (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                      Danh mục sản phẩm
                    </h3>
                    <button
                      type="button"
                      className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                      onClick={() => {
                        setShowAddCategory(true);
                        setEditingCategory(null);
                        setNewCategoryName("");
                      }}
                    >
                      <Plus size={18} />
                      Thêm danh mục
                    </button>
                  </div>
                  <div className="ck-table-wrap">
                    <table className="ck-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên danh mục</th>
                          <th>Số sản phẩm</th>
                          <th className="ck-text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, idx) => (
                          <tr key={cat.id}>
                            <td className="ck-text-gray-400">{idx + 1}</td>
                            <td className="ck-font-semibold ck-text-white">
                              {cat.name}
                            </td>
                            <td className="ck-text-gray-400">
                              {
                                products.filter((p) => p.category === cat.name)
                                  .length
                              }
                            </td>
                            <td className="ck-text-center">
                              <div className="ck-flex ck-gap-2 ck-justify-center">
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                  style={{ border: "none" }}
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setShowAddCategory(true);
                                    setNewCategoryName(cat.name);
                                  }}
                                  title="Sửa"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                  style={{ border: "none" }}
                                  onClick={() => handleDeleteCategory(cat)}
                                  title="Xóa"
                                >
                                  <Trash2
                                    size={18}
                                    className="ck-text-red-400"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {categories.length === 0 && (
                    <div className="ck-p-8 ck-text-center ck-text-gray-400">
                      Chưa có danh mục. Bấm &quot;Thêm danh mục&quot; để tạo.
                    </div>
                  )}
                </div>
              )}

              {kitchenSubTab === "products" && (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                      Sản phẩm bếp trung tâm
                    </h3>
                    <button
                      type="button"
                      className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                      onClick={() => {
                        setShowAddProduct(true);
                        setEditingProduct(null);
                        setNewProduct({
                          name: "",
                          category: categories[0]?.name || "",
                          price: "",
                          stock: "",
                          min: "",
                          emoji: "🥪",
                        });
                      }}
                    >
                      <Plus size={18} />
                      Thêm sản phẩm
                    </button>
                  </div>
                  <div className="ck-table-wrap">
                    <table className="ck-table">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Sản phẩm</th>
                          <th>Danh mục</th>
                          <th>Giá (₫)</th>
                          <th>Tồn kho</th>
                          <th>Min</th>
                          <th className="ck-text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td className="ck-mono ck-text-gray-400">{p.id}</td>
                            <td>
                              <span className="ck-font-semibold ck-text-white">
                                {p.emoji} {p.name}
                              </span>
                            </td>
                            <td className="ck-text-gray-400">{p.category}</td>
                            <td className="ck-mono ck-text-gray-400">
                              {Number(p.price).toLocaleString()}
                            </td>
                            <td className="ck-text-gray-400">{p.stock}</td>
                            <td className="ck-text-gray-400">{p.min}</td>
                            <td className="ck-text-center">
                              <div className="ck-flex ck-gap-2 ck-justify-center">
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                  style={{ border: "none" }}
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setShowAddProduct(true);
                                    setNewProduct({
                                      name: p.name,
                                      category: p.category,
                                      price: String(p.price),
                                      stock: String(p.stock),
                                      min: String(p.min),
                                      emoji: p.emoji || "🥪",
                                    });
                                  }}
                                  title="Sửa"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                  style={{ border: "none" }}
                                  onClick={() => handleDeleteProduct(p)}
                                  title="Xóa"
                                >
                                  <Trash2
                                    size={18}
                                    className="ck-text-red-400"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.length === 0 && (
                    <div className="ck-p-8 ck-text-center ck-text-gray-400">
                      Chưa có sản phẩm. Bấm &quot;Thêm sản phẩm&quot; để tạo.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showAddUser && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowAddUser(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Thêm người dùng mới
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowAddUser(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>

            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  className="ck-input ck-w-full"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Họ tên *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Vai trò *
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="franchise">Nhân viên cửa hàng</option>
                  <option value="kitchen">Nhân viên bếp</option>
                  <option value="coordinator">Điều phối viên</option>
                  <option value="manager">Quản lý</option>
                </select>
              </div>
              {newUser.role === "franchise" && (
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Tên cửa hàng *
                  </label>
                  <input
                    type="text"
                    className="ck-input ck-w-full"
                    value={newUser.storeName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, storeName: e.target.value })
                    }
                    placeholder="Cửa hàng Quận 1"
                  />
                </div>
              )}
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => setShowAddUser(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleAddUser}
                >
                  Thêm người dùng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStore && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowAddStore(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Thêm cửa hàng franchise
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowAddStore(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên cửa hàng *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.storeName}
                  onChange={(e) =>
                    setNewStore({ ...newStore, storeName: e.target.value })
                  }
                  placeholder="Cửa hàng Quận 1"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Người phụ trách (họ tên) *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.name}
                  onChange={(e) =>
                    setNewStore({ ...newStore, name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.username}
                  onChange={(e) =>
                    setNewStore({ ...newStore, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  className="ck-input ck-w-full"
                  value={newStore.password}
                  onChange={(e) =>
                    setNewStore({ ...newStore, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Trạng thái
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newStore.status}
                  onChange={(e) =>
                    setNewStore({ ...newStore, status: e.target.value })
                  }
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                </select>
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => setShowAddStore(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleAddStore}
                >
                  Thêm cửa hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddCategory || editingCategory) && (
        <div
          className="ck-modal-overlay"
          onClick={() => {
            setShowAddCategory(false);
            setEditingCategory(null);
            setNewCategoryName("");
          }}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục sản phẩm"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategoryName("");
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    editingCategory ? editingCategory.name : newCategoryName
                  }
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      : setNewCategoryName(e.target.value)
                  }
                  placeholder="Ví dụ: Bánh mì"
                />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                    setNewCategoryName("");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleSaveCategory}
                >
                  {editingCategory ? "Lưu thay đổi" : "Thêm danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddProduct || editingProduct) && (
        <div
          className="ck-modal-overlay"
          onClick={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                {editingProduct
                  ? "Sửa sản phẩm"
                  : "Thêm sản phẩm bếp trung tâm"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={(editingProduct ? editingProduct : newProduct).name}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Bánh mì sandwich"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Danh mục *
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={
                    (editingProduct ? editingProduct : newProduct).category
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          category: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="ck-grid-2 ck-gap-4"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Giá (₫) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ck-input ck-w-full"
                    value={(editingProduct ? editingProduct : newProduct).price}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            price: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            price: e.target.value,
                          })
                    }
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Tồn kho *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ck-input ck-w-full"
                    value={(editingProduct ? editingProduct : newProduct).stock}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            stock: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            stock: e.target.value,
                          })
                    }
                    placeholder="150"
                  />
                </div>
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mức tồn tối thiểu *
                </label>
                <input
                  type="number"
                  min="0"
                  className="ck-input ck-w-full"
                  value={(editingProduct ? editingProduct : newProduct).min}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          min: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, min: e.target.value })
                  }
                  placeholder="50"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Emoji (hiển thị)
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    (editingProduct
                      ? editingProduct.emoji
                      : newProduct.emoji) || ""
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          emoji: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, emoji: e.target.value })
                  }
                  placeholder="🥪"
                  maxLength={2}
                />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleSaveProduct}
                >
                  {editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
