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
import { ADMIN_TABS } from "../../constants";

const AdminPage = ({ onLogout, userData }) => {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [accountFilter, setAccountFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [accountsList, setAccountsList] = useState([]); // list theo filter
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "franchise",
    storeName: "",
    status: "active",
    employeeCode: "",
  });
  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    phone: "",
    type: "FLAGSHIP",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newProduct, setNewProduct] = useState({
    productId: "",
    productName: "",
    categoryId: "",
    sellingPrice: "",
    baseUnit: "TÔ",
    isActive: true,
    ingredients: [],
  });
  const [importForm, setImportForm] = useState({
    note: "",
    supplierId: "",
    items: [{ ingredientId: "", unit: "KG", quantity: "", importPrice: "" }],
  });

  const loadAccountsByFilter = async (filter) => {
    try {
      if (filter === "active") return await api.getActiveAccounts();
      if (filter === "inactive") return await api.getInactiveAccounts();
      return await api.getUsers();
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s, c, p, ing] = await Promise.all([
          api.getUsers(),
          api.getStores(),
          api.getCategories(),
          api.getProducts(),
          api.getIngredients(),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setStores(Array.isArray(s) ? s : []);
        setCategories(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
        setIngredients(Array.isArray(ing) ? ing : []);
      } catch (err) {
        console.error("Admin load:", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const list = await loadAccountsByFilter(accountFilter);
      setAccountsList(Array.isArray(list) ? list : []);
    };
    load();
  }, [accountFilter]);

  const loadAdminData = async () => {
    try {
      const [u, s, c, p, ing] = await Promise.all([
        api.getUsers(),
        api.getStores(),
        api.getCategories(),
        api.getProducts(),
        api.getIngredients(),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setStores(Array.isArray(s) ? s : []);
      setCategories(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
      setIngredients(Array.isArray(ing) ? ing : []);
      const list = await loadAccountsByFilter(accountFilter);
      setAccountsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Admin load:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      window.alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (!newUser.email || !newUser.email.trim()) {
      window.alert("Vui lòng nhập email!");
      return;
    }
    const emailTrim = newUser.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      window.alert("Email không đúng định dạng!");
      return;
    }
    if (newUser.role === "franchise" && !newUser.storeName) {
      window.alert("Vui lòng nhập tên cửa hàng!");
      return;
    }
    const roleToBackend = {
      admin: "ADMIN",
      kitchen: "KITCHEN_STAFF",
      franchise: "FRANCHISE",
      coordinator: "COORDINATOR",
      manager: "MANAGER",
    };
    try {
      const existingUsers = await api.getUsers();
      if (existingUsers.find((u) => u.username === newUser.username)) {
        window.alert("Tên đăng nhập đã tồn tại!");
        return;
      }
      const msg = await api.createUser({
        username: newUser.username.trim(),
        password: newUser.password,
        email: emailTrim,
        fullName: newUser.name.trim(),
        employeeCode: newUser.employeeCode?.trim() || undefined,
        role: roleToBackend[newUser.role] || "KITCHEN_STAFF",
        storeName: newUser.role === "franchise" ? newUser.storeName?.trim() : undefined,
      });
      await loadAdminData();
      setShowAddUser(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "franchise",
        storeName: "",
        status: "active",
        employeeCode: "",
      });
      window.alert(
        typeof msg === "string"
          ? msg
          : "✅ Đăng ký thành công! Mã nhân viên đã được tạo.",
      );
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không đăng ký được"));
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

  const handleAddStore = async () => {
    const { name, address, phone, type } = newStore;
    if (!name?.trim() || !address?.trim() || !phone?.trim()) {
      window.alert("Vui lòng điền đầy đủ tên, địa chỉ và điện thoại.");
      return;
    }
    try {
      await api.createStore({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        type: (type || "FLAGSHIP").toUpperCase(),
      });
      await loadAdminData();
      setShowAddStore(false);
      setNewStore({ name: "", address: "", phone: "", type: "FLAGSHIP" });
      window.alert("✅ Tạo cửa hàng thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không tạo được"));
    }
  };

  const handleSaveCategory = async () => {
    const name = (
      editingCategory ? editingCategory.name : newCategoryName
    ).trim();
    const description = (editingCategory ? editingCategory.description : newCategoryDescription)?.trim() || "";
    if (!name) {
      window.alert("Vui lòng nhập tên danh mục.");
      return;
    }
    try {
      if (editingCategory) {
        setEditingCategory(null);
        window.alert("Chức năng sửa danh mục đang cập nhật.");
        setShowAddCategory(false);
        return;
      }
      await api.createCategory({ name, description });
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowAddCategory(false);
      await loadAdminData();
      window.alert("✅ Thêm danh mục thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteCategory = async (cat) => {
    const prods = await api.getProducts();
    const inCat = prods.filter(
      (p) => String(p.categoryId) === String(cat.id) || p.category === cat.name,
    );
    if (inCat.length > 0) {
      window.alert(
        `Không thể xóa. Còn ${inCat.length} sản phẩm thuộc danh mục "${cat.name}".`,
      );
      return;
    }
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      await loadAdminData();
      window.alert("✅ Đã xóa danh mục!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const handleSaveProduct = async () => {
    const p = editingProduct || newProduct;
    const productId = (p.productId || p.id || "").trim();
    const productName = (p.productName || p.name || "").trim();
    const categoryId = p.categoryId ?? (categories.find((c) => c.name === p.category)?.id ?? p.category);
    const sellingPrice = Number(p.sellingPrice ?? p.price ?? 0);
    const baseUnit = (p.baseUnit || "TÔ").toUpperCase();
    const isActive = p.isActive !== false;
    const ingredients = Array.isArray(p.ingredients) ? p.ingredients : [];
    if (!productName || (editingProduct ? true : !productId)) {
      window.alert("Vui lòng nhập mã và tên sản phẩm.");
      return;
    }
    try {
      if (editingProduct) {
        setEditingProduct(null);
        window.alert("Chức năng sửa sản phẩm đang cập nhật.");
        setShowAddProduct(false);
        return;
      }
      await api.createProduct({
        productId: productId || undefined,
        productName,
        categoryId,
        sellingPrice,
        baseUnit,
        isActive,
        ingredients: ingredients.map((i) => ({
          ingredientId: i.ingredientId ?? i.id,
          amountNeeded: Number(i.amountNeeded ?? i.amount ?? 0),
        })),
      });
      setShowAddProduct(false);
      setNewProduct({
        productId: "",
        productName: "",
        categoryId: "",
        sellingPrice: "",
        baseUnit: "TÔ",
        isActive: true,
        ingredients: [],
      });
      await loadAdminData();
      window.alert("✅ Thêm sản phẩm thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name || product.productName}"?`)) return;
    try {
      await api.deleteProduct(product.id ?? product.productId);
      await loadAdminData();
      window.alert("✅ Đã xóa sản phẩm!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

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
              <p className="ck-text-gray-400">
                Dùng các tab bên dưới để quản lý tài khoản, cửa hàng, danh mục, sản phẩm và nhập kho.
              </p>
            </>
          )}

          {adminTab === "accounts" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Tài khoản
              </h2>
              <div className="ck-flex ck-gap-2 ck-mb-4">
                <button
                  type="button"
                  className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                    accountFilter === "all"
                      ? "ck-bg-gradient-btn-admin ck-text-white"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={accountFilter !== "all" ? { border: "1px solid var(--ck-border)" } : {}}
                  onClick={() => setAccountFilter("all")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                    accountFilter === "active"
                      ? "ck-bg-gradient-btn-admin ck-text-white"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={accountFilter !== "active" ? { border: "1px solid var(--ck-border)" } : {}}
                  onClick={() => setAccountFilter("active")}
                >
                  Đang hoạt động
                </button>
                <button
                  type="button"
                  className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                    accountFilter === "inactive"
                      ? "ck-bg-gradient-btn-admin ck-text-white"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={accountFilter !== "inactive" ? { border: "1px solid var(--ck-border)" } : {}}
                  onClick={() => setAccountFilter("inactive")}
                >
                  Bị khóa
                </button>
              </div>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Danh sách tài khoản
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
                        <th>Mã TK</th>
                        <th>Tên đăng nhập</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Mã NV</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountsList.map((user) => (
                        <tr key={user.id ?? user.accountId}>
                          <td className="ck-mono ck-text-gray-400 ck-text-xs">{user.accountId ?? user.id}</td>
                          <td className="ck-font-bold ck-text-white ck-mono">{user.username}</td>
                          <td className="ck-text-gray-400">{user.roleRaw ?? user.role}</td>
                          <td>
                            <span className={`ck-px-2 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${user.status === "active" ? "ck-bg-green-500-20 ck-text-green-400" : "ck-bg-gray-500-20 ck-text-gray-400"}`}>
                              {user.status === "active" ? "true" : "false"}
                            </span>
                          </td>
                          <td className="ck-mono ck-text-gray-400 ck-text-xs">{user.userId}</td>
                          <td className="ck-text-white">{user.name ?? user.fullName}</td>
                          <td className="ck-text-gray-400 ck-text-sm">{user.email ?? "-"}</td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              {user.role !== "admin" && (
                                <>
                                  <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white" style={{ border: "none" }} onClick={() => handleToggleStatus(user.id)} title={user.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}>
                                    {user.status === "active" ? <XCircle size={18} /> : <CheckCircle size={18} className="ck-text-green-400" />}
                                  </button>
                                  <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20" style={{ border: "none" }} onClick={() => handleDeleteUser(user.id)} title="Xóa">
                                    <Trash2 size={18} className="ck-text-red-400" />
                                  </button>
                                </>
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

          {adminTab === "stores" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Cửa hàng
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Danh sách cửa hàng và tạo cửa hàng mới.
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
                    Tạo cửa hàng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Mã CH</th>
                        <th>Tên</th>
                        <th>Địa chỉ</th>
                        <th>Điện thoại</th>
                        <th>Loại</th>
                        <th className="ck-text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((s) => (
                        <tr key={s.storeId ?? s.id}>
                          <td className="ck-mono ck-text-gray-400 ck-text-xs">{s.storeId ?? s.id}</td>
                          <td className="ck-font-semibold ck-text-white">{s.name}</td>
                          <td className="ck-text-gray-400">{s.address ?? "-"}</td>
                          <td className="ck-text-gray-400">{s.phone ?? "-"}</td>
                          <td className="ck-mono ck-text-gray-400">{s.type ?? "-"}</td>
                          <td className="ck-text-center">
                            <span className={`ck-px-2 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${s.isActive !== false ? "ck-bg-green-500-20 ck-text-green-400" : "ck-bg-gray-500-20 ck-text-gray-400"}`}>
                              {s.isActive !== false ? "true" : "false"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stores.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có cửa hàng. Bấm &quot;Tạo cửa hàng&quot; (name, address, phone, type).
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
                          productId: "",
                          productName: "",
                          categoryId: categories[0]?.id ?? "",
                          sellingPrice: "",
                          baseUnit: "TÔ",
                          isActive: true,
                          ingredients: [],
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
                                      productId: p.productId ?? p.id,
                                      productName: p.productName ?? p.name,
                                      categoryId: p.categoryId ?? p.category ?? "",
                                      sellingPrice: String(p.sellingPrice ?? p.price ?? ""),
                                      baseUnit: p.baseUnit || "TÔ",
                                      isActive: p.isActive !== false,
                                      ingredients: p.ingredients || [],
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

          {adminTab === "inventory" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Nhập kho
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Tạo phiếu nhập nguyên liệu.
              </p>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const note = importForm.note?.trim() || "";
                    const supplierId = importForm.supplierId?.trim() || undefined;
                    const items = importForm.items
                      .filter((i) => i.ingredientId && Number(i.quantity) > 0)
                      .map((i) => ({
                        ingredientId: i.ingredientId,
                        unit: (i.unit || "KG").toUpperCase(),
                        quantity: Number(i.quantity) || 0,
                        importPrice: Number(i.importPrice) || 0,
                      }));
                    if (items.length === 0) {
                      window.alert("Thêm ít nhất một dòng nguyên liệu với số lượng và đơn giá.");
                      return;
                    }
                    try {
                      await api.importInventory({ note, supplierId, items });
                      setImportForm({
                        note: "",
                        supplierId: "",
                        items: [{ ingredientId: "", unit: "KG", quantity: "", importPrice: "" }],
                      });
                      window.alert("✅ Tạo phiếu nhập kho thành công!");
                    } catch (err) {
                      window.alert("Lỗi: " + (err.message || "Không gửi được"));
                    }
                  }}
                  className="ck-space-y-4"
                >
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Ghi chú</label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={importForm.note}
                      onChange={(e) => setImportForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="Nhập hàng sáng thứ 2"
                    />
                  </div>
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mã nhà cung cấp</label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={importForm.supplierId}
                      onChange={(e) => setImportForm((f) => ({ ...f, supplierId: e.target.value }))}
                      placeholder="SUP-001"
                    />
                  </div>
                  <div>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-2">
                      <label className="ck-text-sm ck-font-semibold ck-text-gray-300">Chi tiết nhập (nguyên liệu, đơn vị, số lượng, đơn giá)</label>
                      <button
                        type="button"
                        className="ck-btn ck-px-3 ck-py-1 ck-rounded-lg ck-bg-gray-700 ck-text-white ck-text-sm"
                        onClick={() => setImportForm((f) => ({ ...f, items: [...f.items, { ingredientId: "", unit: "KG", quantity: "", importPrice: "" }] }))}
                      >
                        + Dòng
                      </button>
                    </div>
                    <div className="ck-space-y-2">
                      {importForm.items.map((row, idx) => (
                        <div key={idx} className="ck-flex ck-gap-2 ck-flex-wrap ck-items-center">
                          <select
                            className="ck-select ck-flex-1 ck-min-w-[120px]"
                            value={row.ingredientId}
                            onChange={(e) => setImportForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, ingredientId: e.target.value } : it),
                            }))}
                          >
                            <option value="">-- Chọn nguyên liệu --</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id ?? ing.ingredientId} value={ing.ingredientId ?? ing.id}>
                                {ing.ingredientName ?? ing.name ?? ing.ingredientId ?? ing.id}
                              </option>
                            ))}
                          </select>
                          <select
                            className="ck-select ck-w-20"
                            value={row.unit}
                            onChange={(e) => setImportForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it),
                            }))}
                          >
                            <option value="KG">KG</option>
                            <option value="G">G</option>
                            <option value="L">L</option>
                            <option value="ML">ML</option>
                          </select>
                          <input
                            type="number"
                            className="ck-input ck-w-24"
                            placeholder="SL"
                            value={row.quantity}
                            onChange={(e) => setImportForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it),
                            }))}
                          />
                          <input
                            type="number"
                            className="ck-input ck-w-28"
                            placeholder="Đơn giá"
                            value={row.importPrice}
                            onChange={(e) => setImportForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, importPrice: e.target.value } : it),
                            }))}
                          />
                          <button
                            type="button"
                            className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400"
                            onClick={() => setImportForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold">
                    Tạo phiếu nhập kho
                  </button>
                </form>
              </div>
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

            <form
              className="ck-space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddUser();
              }}
            >
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  autoComplete="username"
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
                  autoComplete="new-password"
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
                  Email *
                </label>
                <input
                  type="email"
                  className="ck-input ck-w-full"
                  autoComplete="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="user@example.com"
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
                  type="submit"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                >
                  Thêm người dùng
                </button>
              </div>
            </form>
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
            <form
              className="ck-space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddStore();
              }}
            >
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên cửa hàng *</label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="Central Kiosk Quận 1"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  placeholder="123 Lê Lợi, TP.HCM"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Điện thoại *</label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.phone}
                  onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Loại cửa hàng</label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newStore.type}
                  onChange={(e) => setNewStore({ ...newStore, type: e.target.value })}
                >
                  <option value="FLAGSHIP">FLAGSHIP</option>
                  <option value="KIOSK">KIOSK</option>
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
                  type="submit"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                >
                  Thêm cửa hàng
                </button>
              </div>
            </form>
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
            setNewCategoryDescription("");
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
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategoryName("");
                  setNewCategoryDescription("");
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên danh mục *</label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={editingCategory ? editingCategory.name : newCategoryName}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, name: e.target.value })
                      : setNewCategoryName(e.target.value)
                  }
                  placeholder="Món Nước"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mô tả</label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={editingCategory ? (editingCategory.description ?? "") : newCategoryDescription}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, description: e.target.value })
                      : setNewCategoryDescription(e.target.value)
                  }
                  placeholder="Các món có nước dùng như Phở, Bún"
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
                    setNewCategoryDescription("");
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
                {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4 ck-max-h-[70vh] ck-overflow-y-auto">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mã sản phẩm</label>
                <input type="text" className="ck-input ck-w-full" value={(editingProduct || newProduct).productId || (editingProduct || newProduct).id} onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })} placeholder="PHO-01" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên sản phẩm *</label>
                <input type="text" className="ck-input ck-w-full" value={(editingProduct || newProduct).productName || (editingProduct || newProduct).name} onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })} placeholder="Phở Bò" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Danh mục</label>
                <select className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={(editingProduct || newProduct).categoryId || (editingProduct || newProduct).category} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="ck-grid-2 ck-gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Giá bán (₫)</label>
                  <input type="number" min="0" className="ck-input ck-w-full" value={(editingProduct || newProduct).sellingPrice ?? (editingProduct || newProduct).price} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} placeholder="55000" />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Đơn vị</label>
                  <select className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={(editingProduct || newProduct).baseUnit || "TÔ"} onChange={(e) => setNewProduct({ ...newProduct, baseUnit: e.target.value })}>
                    <option value="TÔ">TÔ</option>
                    <option value="KG">KG</option>
                    <option value="HỘP">HỘP</option>
                  </select>
                </div>
              </div>
              <div className="ck-flex ck-items-center ck-gap-2">
                <input type="checkbox" id="prod-active" checked={(editingProduct || newProduct).isActive !== false} onChange={(e) => setNewProduct({ ...newProduct, isActive: e.target.checked })} className="ck-rounded" />
                <label htmlFor="prod-active" className="ck-text-sm ck-font-semibold ck-text-gray-300">Đang bán</label>
              </div>
              <div>
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-2">
                  <label className="ck-text-sm ck-font-semibold ck-text-gray-300">Công thức (nguyên liệu &amp; lượng)</label>
                  <button type="button" className="ck-btn ck-px-3 ck-py-1 ck-rounded-lg ck-bg-gray-700 ck-text-white ck-text-sm" onClick={() => setNewProduct((p) => ({ ...p, ingredients: [...(p.ingredients || []), { ingredientId: "", amountNeeded: 0 }] }))}>+ Dòng</button>
                </div>
                {(newProduct.ingredients || []).map((row, idx) => (
                  <div key={idx} className="ck-flex ck-gap-2 ck-mb-2 ck-items-center">
                    <select className="ck-select ck-flex-1 ck-min-w-0" value={row.ingredientId} onChange={(e) => setNewProduct((p) => ({ ...p, ingredients: p.ingredients.map((it, i) => i === idx ? { ...it, ingredientId: e.target.value } : it) }))}>
                      <option value="">-- Nguyên liệu --</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id ?? ing.ingredientId} value={ing.ingredientId ?? ing.id}>{ing.ingredientName ?? ing.name ?? ing.ingredientId ?? ing.id}</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" min="0" className="ck-input ck-w-24" placeholder="Lượng" value={row.amountNeeded} onChange={(e) => setNewProduct((p) => ({ ...p, ingredients: p.ingredients.map((it, i) => i === idx ? { ...it, amountNeeded: Number(e.target.value) || 0 } : it) }))} />
                    <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400" onClick={() => setNewProduct((p) => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }))}><Trash2 size={16} /></button>
                  </div>
                ))}
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
