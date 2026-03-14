import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Store,
  Shield,
  Plus,
  UserPlus,
  X,
  XCircle,
  Eye,
  Trash2,
} from "../../components/icons/Icons";
import api from "../../services/api";
import StatCard from "../../components/common/StatCard";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import { ADMIN_TABS, SYSTEM_ROLES } from "../../constants";

const AdminPage = ({ onLogout, userData }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [adminTab, setAdminTab] = useState("accounts");
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [emptyStoreIds, setEmptyStoreIds] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [accountFilter, setAccountFilter] = useState("all"); // 'all' | 'active' | 'inactive' | 'store'
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
    status: "active",
    employeeCode: "",
  });
  const [editingStore, setEditingStore] = useState(null);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showSwapStoresModal, setShowSwapStoresModal] = useState(false);
  const [swapAccount1, setSwapAccount1] = useState("");
  const [swapAccount2, setSwapAccount2] = useState("");
  const [editAccountUser, setEditAccountUser] = useState(null);
  const [editAccountForm, setEditAccountForm] = useState({
    roleName: "",
    storeId: "",
    email: "",
  });
  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [assignManagerId, setAssignManagerId] = useState("");
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
  const [formulaProductId, setFormulaProductId] = useState("");
  const [formulaIngredients, setFormulaIngredients] = useState([]);
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaError, setFormulaError] = useState("");

  const loadAccountsByFilter = async (filter) => {
    try {
      if (filter === "active") return await api.getActiveAccounts();
      if (filter === "inactive") return await api.getInactiveAccounts();
      const list = await api.getUsers();
      if (filter === "store") {
        return list.filter(
          (u) => u.role === "franchise" || u.roleRaw === "STORE_MANAGER",
        );
      }
      return list;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s, c, p, ing, emptyStores] = await Promise.all([
          api.getUsers(),
          api.getStoresAll(),
          api.getCategories(),
          api.getProducts(),
          api.getIngredients(),
          api.getEmptyStores(),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setStores(Array.isArray(s) ? s : []);
        setCategories(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
        setIngredients(Array.isArray(ing) ? ing : []);
        const ids = new Set(
          (Array.isArray(emptyStores) ? emptyStores : []).map((es) =>
            String(es.storeId ?? es.id ?? ""),
          ),
        );
        setEmptyStoreIds(ids);
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
      const [u, s, c, p, ing, emptyStores] = await Promise.all([
        api.getUsers(),
        api.getStoresAll(),
        api.getCategories(),
        api.getProducts(),
        api.getIngredients(),
        api.getEmptyStores(),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setStores(Array.isArray(s) ? s : []);
      setCategories(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
      setIngredients(Array.isArray(ing) ? ing : []);
      const ids = new Set(
        (Array.isArray(emptyStores) ? emptyStores : []).map((es) =>
          String(es.storeId ?? es.id ?? ""),
        ),
      );
      setEmptyStoreIds(ids);
      const list = await loadAccountsByFilter(accountFilter);
      setAccountsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Admin load:", err);
    }
  };

  const storeManagers = (users.length > 0 ? users : accountsList).filter(
    (u) => u.roleRaw === "STORE_MANAGER",
  );

  const storeManagersWithoutStore = (editingStoreId) => {
    const sid = String(editingStoreId ?? "");
    return storeManagers.filter((u) => {
      if (u.status !== "active") return false;
      const hasStore =
        (u.managedStores && String(u.managedStores).trim()) ||
        u.storeId ||
        (u.storeIds && u.storeIds.length > 0);
      if (!hasStore) return true;
      const accStoreIds = [u.storeId, ...(u.storeIds || [])]
        .filter(Boolean)
        .map(String);
      return sid && accStoreIds.includes(sid);
    });
  };

  const getManagerForStore = (store) => {
    const sid = String(store.storeId ?? store.id ?? "");
    if (emptyStoreIds.has(sid)) return "Chưa có";
    const accounts = users.length > 0 ? users : accountsList;
    const storeName = (store.name ?? "").trim();
    const manager = accounts.find((acc) => {
      if (acc.roleRaw !== "STORE_MANAGER") return false;
      const accStoreIds = [acc.storeId, ...(acc.storeIds || [])]
        .filter(Boolean)
        .map(String);
      if (accStoreIds.includes(sid)) return true;
      if (!storeName) return false;
      const accNames = [acc.managedStores, acc.storeName]
        .filter(Boolean)
        .flatMap((x) =>
          String(x)
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
        );
      return accNames.some((n) => n === storeName);
    });
    return manager ? (manager.name ?? manager.fullName ?? "—") : "Chưa có";
  };

  const getManagerAccountForStore = (store) => {
    const sid = String(store.storeId ?? store.id ?? "");
    if (emptyStoreIds.has(sid)) return null;
    const accounts = users.length > 0 ? users : accountsList;
    const storeName = (store.name ?? "").trim();
    return accounts.find((acc) => {
      if (acc.roleRaw !== "STORE_MANAGER") return false;
      const accStoreIds = [acc.storeId, ...(acc.storeIds || [])]
        .filter(Boolean)
        .map(String);
      if (accStoreIds.includes(sid)) return true;
      if (!storeName) return false;
      const accNames = [acc.managedStores, acc.storeName]
        .filter(Boolean)
        .flatMap((x) =>
          String(x)
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
        );
      return accNames.some((n) => n === storeName);
    });
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
    const roleToBackend = {
      admin: "ADMIN",
      manager: "MANAGER",
      coordinator: "COORDINATOR",
      kitchen: "KITCHEN_MANAGER",
      franchise: "STORE_MANAGER",
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
        role: roleToBackend[newUser.role] || "KITCHEN_MANAGER",
      });
      await loadAdminData();
      setShowAddUser(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "franchise",
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

  const handleToggleStatus = async (user) => {
    const accountId = user.accountId ?? user.id ?? user.userId;
    if (!accountId) {
      window.alert("Không xác định được mã tài khoản. Vui lòng tải lại trang.");
      return;
    }
    const newActive = user.status !== "active";
    try {
      await api.updateAccountStatus(accountId, newActive);
      await loadAdminData();
      window.alert(
        newActive ? "✅ Đã mở khóa tài khoản!" : "✅ Đã khóa tài khoản!",
      );
    } catch (err) {
      window.alert(
        "Lỗi khóa/mở khóa: " +
          (err?.message ||
            "Không cập nhật được. Kiểm tra quyền Admin hoặc API."),
      );
    }
  };

  const handleOpenEditAccount = (user) => {
    const roleRaw = user.roleRaw ?? user.role ?? "";
    const roleName = [
      "ADMIN",
      "MANAGER",
      "COORDINATOR",
      "KITCHEN_MANAGER",
      "STORE_MANAGER",
    ].includes(String(roleRaw).toUpperCase())
      ? String(roleRaw).toUpperCase()
      : "MANAGER";
    let resolvedStoreId = user.storeId ?? user.storeIds?.[0] ?? "";
    if (roleName === "STORE_MANAGER" && stores.length > 0) {
      const sid = user.storeId ?? user.storeIds?.[0];
      const matchByStoreId = sid
        ? stores.find((s) => String(s.storeId ?? s.id) === String(sid))
        : null;
      const matchByName =
        !matchByStoreId &&
        user.managedStores &&
        stores.find((s) => {
          const names = String(user.managedStores)
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
          return names.some((n) => s.name && String(s.name).trim() === n);
        });
      resolvedStoreId = matchByStoreId
        ? String(matchByStoreId.storeId ?? matchByStoreId.id ?? "")
        : matchByName
          ? String(matchByName.storeId ?? matchByName.id ?? "")
          : sid
            ? String(sid)
            : "";
    }
    setEditAccountUser(user);
    setEditAccountForm({
      roleName,
      storeId: resolvedStoreId,
      email: user.email ?? "",
    });
    setShowEditAccountModal(true);
  };

  const handleEditAccountSubmit = async () => {
    if (!editAccountUser) return;
    const accountId =
      editAccountUser.accountId ?? editAccountUser.id ?? editAccountUser.userId;
    const { roleName, storeId, email } = editAccountForm;
    if (!roleName?.trim()) {
      window.alert("Vui lòng chọn chức vụ.");
      return;
    }
    if (roleName === "STORE_MANAGER" && !storeId?.trim()) {
      window.alert(
        "Khi thăng chức lên Cửa hàng trưởng, bắt buộc phải chọn một Cửa hàng để bổ nhiệm.",
      );
      return;
    }
    const emailTrim = email?.trim();
    if (!emailTrim) {
      window.alert("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      window.alert("Email không đúng định dạng.");
      return;
    }
    try {
      await api.updateAccountRole(accountId, roleName.trim());
      if (roleName === "STORE_MANAGER" && storeId?.trim()) {
        await api.updateAccountStore(accountId, storeId.trim());
      }
      await api.updateAccount(accountId, { email: emailTrim });
      window.alert("✅ Đã cập nhật thông tin!");
      setShowEditAccountModal(false);
      setEditAccountUser(null);
      setEditAccountForm({ roleName: "", storeId: "", email: "" });
      await loadAdminData();
    } catch (err) {
      window.alert(
        "Lỗi cập nhật: " +
          (err?.message ||
            "Không cập nhật được. Kiểm tra quyền Admin hoặc API."),
      );
    }
  };

  const storeManagersWithStore = (
    users.length > 0 ? users : accountsList
  ).filter(
    (u) =>
      u.status === "active" &&
      u.roleRaw === "STORE_MANAGER" &&
      (u.managedStores || u.storeId || u.storeIds?.[0]),
  );

  const handleSwapStores = async () => {
    if (!swapAccount1?.trim() || !swapAccount2?.trim()) {
      window.alert("Vui lòng chọn đủ 2 Quản lý cửa hàng.");
      return;
    }
    if (swapAccount1 === swapAccount2) {
      window.alert("Hai tài khoản phải khác nhau.");
      return;
    }
    try {
      await api.swapStores(swapAccount1.trim(), swapAccount2.trim());
      window.alert("✅ Đã hoán đổi cửa hàng thành công!");
      setShowSwapStoresModal(false);
      setSwapAccount1("");
      setSwapAccount2("");
      await loadAdminData();
    } catch (err) {
      window.alert(
        "Lỗi hoán đổi: " +
          (err?.message ||
            "Không thực hiện được. Kiểm tra quyền Admin hoặc API."),
      );
    }
  };

  const handleSaveStore = async () => {
    const { name, address, phone } = newStore;
    if (!name?.trim() || !address?.trim() || !phone?.trim()) {
      window.alert("Vui lòng điền đầy đủ tên, địa chỉ và điện thoại.");
      return;
    }
    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      type: "FRANCHISE",
    };
    try {
      if (editingStore) {
        const id = editingStore.storeId ?? editingStore.id;
        await api.updateStore(id, payload);
        if (assignManagerId?.trim()) {
          await api.assignStoreManager(id, assignManagerId.trim());
        }
        window.alert("✅ Cập nhật cửa hàng thành công!");
      } else {
        await api.createStore(payload);
        window.alert("✅ Tạo cửa hàng thành công!");
      }
      await loadAdminData();
      setShowAddStore(false);
      setEditingStore(null);
      setAssignManagerId("");
      setNewStore({ name: "", address: "", phone: "" });
    } catch (err) {
      window.alert(
        "Lỗi: " +
          (err.message ||
            (editingStore ? "Không cập nhật được" : "Không tạo được")),
      );
    }
  };

  const handleToggleStoreActive = async (store) => {
    const storeId = store.storeId ?? store.id;
    const newActive = store.isActive === false ? true : false;
    try {
      await api.updateStoreActive(storeId, newActive);
      setStores((prev) =>
        prev.map((s) =>
          String(s.storeId ?? s.id) === String(storeId)
            ? { ...s, isActive: newActive }
            : s,
        ),
      );
      window.alert(newActive ? "✅ Đã mở cửa hàng!" : "✅ Đã đóng cửa hàng!");
      await loadAdminData();
    } catch (err) {
      window.alert(
        "Lỗi: " + (err?.message || "Không cập nhật được trạng thái cửa hàng."),
      );
    }
  };

  const handleSaveCategory = async () => {
    const name = (
      editingCategory ? editingCategory.name : newCategoryName
    ).trim();
    const description =
      (editingCategory
        ? editingCategory.description
        : newCategoryDescription
      )?.trim() || "";
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
    const categoryId =
      p.categoryId ??
      categories.find((c) => c.name === p.category)?.id ??
      p.category;
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
    if (
      !window.confirm(`Xóa sản phẩm "${product.name || product.productName}"?`)
    )
      return;
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
      filterKey: "all",
    },
    {
      label: "Đang hoạt động",
      value: users.filter((u) => u.status === "active").length.toString(),
      change: "",
      icon: CheckCircle,
      color: "ck-icon-box-green",
      filterKey: "active",
    },
    {
      label: "Nhân viên CH",
      value: users
        .filter((u) => u.role === "franchise" || u.roleRaw === "STORE_MANAGER")
        .length.toString(),
      change: "",
      icon: Store,
      color: "ck-icon-box-purple",
      filterKey: "store",
    },
    {
      label: "Ngưng Hoạt Động",
      value: users.filter((u) => u.status !== "active").length.toString(),
      change: "",
      icon: XCircle,
      color: "ck-icon-box-red",
      filterKey: "inactive",
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
        <div className="ck-flex ck-items-center ck-gap-2">
          <HeaderSettingsMenu
            userData={userData}
            showProfile={false}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onLogout={onLogout}
          />
        </div>
      </header>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {showEditAccountModal && editAccountUser && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowEditAccountModal(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Chỉnh sửa tài khoản
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowEditAccountModal(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <p className="ck-text-gray-400 ck-mb-4 ck-text-sm">
              {editAccountUser.name ?? editAccountUser.fullName} (
              {editAccountUser.roleRaw ?? editAccountUser.role})
            </p>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Chức vụ
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={editAccountForm.roleName}
                  onChange={(e) =>
                    setEditAccountForm((f) => ({
                      ...f,
                      roleName: e.target.value,
                      storeId:
                        e.target.value === "STORE_MANAGER" ? f.storeId : "",
                    }))
                  }
                >
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {editAccountForm.roleName === "STORE_MANAGER" && (
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Cửa hàng <span className="ck-text-red-400">*</span>
                  </label>
                  <select
                    className={`ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-rounded-xl ${
                      !editAccountForm.storeId
                        ? "ck-border-gray-600 ck-text-gray-500"
                        : "ck-border-gray-700 ck-text-white"
                    }`}
                    value={String(editAccountForm.storeId ?? "")}
                    onChange={(e) =>
                      setEditAccountForm((f) => ({
                        ...f,
                        storeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Chưa có</option>
                    {stores
                      .filter((s) => {
                        if (s.isActive === false) return false;
                        const storeIds = [s.storeId, s.id]
                          .filter(Boolean)
                          .map(String);
                        if (storeIds.length === 0) return true;
                        const currentUserId = String(
                          editAccountUser?.accountId ??
                            editAccountUser?.id ??
                            editAccountUser?.userId ??
                            "",
                        );
                        const allAccounts =
                          users.length > 0 ? users : accountsList;
                        const isAssignedToOther = allAccounts.some((acc) => {
                          if (acc.roleRaw !== "STORE_MANAGER") return false;
                          if (
                            String(acc.accountId ?? acc.id ?? acc.userId) ===
                            currentUserId
                          )
                            return false;
                          const accStoreIds = [
                            acc.storeId,
                            ...(acc.storeIds || []),
                          ]
                            .filter(Boolean)
                            .map(String);
                          const matchById = storeIds.some((sid) =>
                            accStoreIds.some((aid) => aid === sid),
                          );
                          if (matchById) return true;
                          const storeName = (s.name ?? "").trim();
                          if (!storeName) return false;
                          const accNames = [acc.managedStores, acc.storeName]
                            .filter(Boolean)
                            .flatMap((x) =>
                              String(x)
                                .split(",")
                                .map((n) => n.trim())
                                .filter(Boolean),
                            );
                          return accNames.some((n) => n === storeName);
                        });
                        return !isAssignedToOther;
                      })
                      .map((s) => (
                        <option
                          key={s.storeId ?? s.id}
                          value={String(s.storeId ?? s.id ?? "")}
                        >
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Email <span className="ck-text-red-400">*</span>
                </label>
                <input
                  type="email"
                  className="ck-input ck-w-full"
                  placeholder="email@example.com"
                  value={editAccountForm.email}
                  onChange={(e) =>
                    setEditAccountForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="ck-flex ck-gap-3 ck-pt-4">
              <button
                type="button"
                className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                style={{ border: "none" }}
                onClick={() => setShowEditAccountModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                style={{ border: "none" }}
                onClick={handleEditAccountSubmit}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showSwapStoresModal && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowSwapStoresModal(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Hoán đổi cửa hàng giữa 2 Quản lý
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowSwapStoresModal(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <p className="ck-text-gray-400 ck-mb-4 ck-text-sm">
              Chọn 2 Quản lý cửa hàng (STORE_MANAGER) đang có cửa hàng để hoán
              đổi cửa hàng phụ trách.
            </p>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Quản lý 1
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={swapAccount1}
                  onChange={(e) => setSwapAccount1(e.target.value)}
                >
                  <option value="">— Chọn —</option>
                  {storeManagersWithStore.map((u) => {
                    const id = u.accountId ?? u.id ?? u.userId;
                    let storeInfo = u.managedStores;
                    if (!storeInfo && (u.storeId || u.storeIds?.[0])) {
                      const sid = u.storeId ?? u.storeIds?.[0];
                      const st = stores.find(
                        (s) => String(s.storeId ?? s.id) === String(sid),
                      );
                      storeInfo = st?.name ?? sid;
                    }
                    return (
                      <option key={id} value={id}>
                        {u.name ?? u.fullName} ({storeInfo ?? "—"})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Quản lý 2
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={swapAccount2}
                  onChange={(e) => setSwapAccount2(e.target.value)}
                >
                  <option value="">— Chọn —</option>
                  {storeManagersWithStore.map((u) => {
                    const id = u.accountId ?? u.id ?? u.userId;
                    let storeInfo = u.managedStores;
                    if (!storeInfo && (u.storeId || u.storeIds?.[0])) {
                      const sid = u.storeId ?? u.storeIds?.[0];
                      const st = stores.find(
                        (s) => String(s.storeId ?? s.id) === String(sid),
                      );
                      storeInfo = st?.name ?? sid;
                    }
                    return (
                      <option key={id} value={id}>
                        {u.name ?? u.fullName} ({storeInfo ?? "—"})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="ck-flex ck-gap-3 ck-pt-4">
              <button
                type="button"
                className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                style={{ border: "none" }}
                onClick={() => setShowSwapStoresModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                style={{ border: "none" }}
                onClick={handleSwapStores}
              >
                Hoán đổi
              </button>
            </div>
          </div>
        </div>
      )}

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

          {adminTab === "accounts" && (
            <>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-mb-6">
                <div className="ck-p-6 ck-border-b ck-border-gray-700">
                  <h2 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-4">
                    Tài khoản
                  </h2>
                  <div className="ck-grid-4 ck-gap-4">
                    {adminStats.map((stat, i) => {
                      const { filterKey, ...statProps } = stat;
                      return (
                        <StatCard
                          key={i}
                          {...statProps}
                          onClick={
                            filterKey
                              ? () => setAccountFilter(filterKey)
                              : undefined
                          }
                          active={
                            filterKey ? accountFilter === filterKey : false
                          }
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="ck-p-4 ck-border-b ck-border-gray-700 ck-flex ck-gap-2 ck-flex-wrap">
                  <button
                    type="button"
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                      accountFilter === "all"
                        ? "ck-bg-gradient-btn-admin ck-text-white"
                        : "ck-bg-gray-800 ck-text-gray-400"
                    }`}
                    style={
                      accountFilter !== "all"
                        ? { border: "1px solid var(--ck-border)" }
                        : {}
                    }
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
                    style={
                      accountFilter !== "active"
                        ? { border: "1px solid var(--ck-border)" }
                        : {}
                    }
                    onClick={() => setAccountFilter("active")}
                  >
                    Đang hoạt động
                  </button>
                  <button
                    type="button"
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                      accountFilter === "store"
                        ? "ck-bg-gradient-btn-admin ck-text-white"
                        : "ck-bg-gray-800 ck-text-gray-400"
                    }`}
                    style={
                      accountFilter !== "store"
                        ? { border: "1px solid var(--ck-border)" }
                        : {}
                    }
                    onClick={() => setAccountFilter("store")}
                  >
                    Nhân viên CH
                  </button>
                  <button
                    type="button"
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                      accountFilter === "inactive"
                        ? "ck-bg-gradient-btn-admin ck-text-white"
                        : "ck-bg-gray-800 ck-text-gray-400"
                    }`}
                    style={
                      accountFilter !== "inactive"
                        ? { border: "1px solid var(--ck-border)" }
                        : {}
                    }
                    onClick={() => setAccountFilter("inactive")}
                  >
                    Bị khóa
                  </button>
                </div>
                <div className="ck-p-4 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Danh sách tài khoản
                  </h3>
                  <div className="ck-flex ck-gap-2">
                    <button
                      type="button"
                      className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                      onClick={() => {
                        setSwapAccount1("");
                        setSwapAccount2("");
                        setShowSwapStoresModal(true);
                      }}
                    >
                      Chuyển đổi
                    </button>
                    <button
                      type="button"
                      className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                      onClick={() => setShowAddUser(true)}
                    >
                      <UserPlus size={18} />
                      Thêm người dùng
                    </button>
                  </div>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Vai trò</th>
                        <th>Mã NV</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Cửa hàng phụ trách</th>
                        <th className="ck-text-center">Trạng Thái</th>
                        <th className="ck-text-center">Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...accountsList]
                        .sort((a, b) => {
                          const aActive = a.status === "active";
                          const bActive = b.status === "active";
                          if (aActive && !bActive) return -1;
                          if (!aActive && bActive) return 1;
                          return 0;
                        })
                        .map((user) => (
                          <tr key={user.id ?? user.accountId}>
                            <td className="ck-text-gray-400">
                              {user.roleRaw ?? user.role}
                            </td>
                            <td className="ck-mono ck-text-gray-400 ck-text-xs">
                              {user.userId}
                            </td>
                            <td className="ck-text-white">
                              {user.name ?? user.fullName}
                            </td>
                            <td className="ck-text-gray-400 ck-text-sm">
                              {user.email ?? "-"}
                            </td>
                            {(() => {
                              const storeName =
                                user.roleRaw === "STORE_MANAGER"
                                  ? (() => {
                                      const ms = user.managedStores;
                                      if (ms && String(ms).trim())
                                        return String(ms).trim();
                                      const sid =
                                        user.storeId ?? user.storeIds?.[0];
                                      if (sid) {
                                        const st = stores.find(
                                          (x) =>
                                            String(x.storeId ?? x.id) ===
                                            String(sid),
                                        );
                                        return st?.name ?? "Chưa có";
                                      }
                                      return "Chưa có";
                                    })()
                                  : "_";
                              return (
                                <td className="ck-text-sm ck-text-gray-400">
                                  {storeName === "Chưa có" ? (
                                    <span className="ck-text-empty-state">
                                      {storeName}
                                    </span>
                                  ) : (
                                    storeName
                                  )}
                                </td>
                              );
                            })()}
                            <td className="ck-text-center">
                              {user.role !== "admin" ? (
                                <button
                                  type="button"
                                  className={`ck-btn ck-px-3 ck-py-1.5 ck-rounded-lg ck-text-sm ck-font-semibold ${
                                    user.status === "active"
                                      ? "ck-bg-green-500-20 ck-text-green-400"
                                      : "ck-bg-gray-500-20 ck-text-gray-400"
                                  }`}
                                  style={{ border: "none" }}
                                  onClick={() => handleToggleStatus(user)}
                                  title={
                                    user.status === "active"
                                      ? "Bấm để khóa tài khoản"
                                      : "Bấm để mở khóa"
                                  }
                                >
                                  {user.status === "active"
                                    ? "Hoạt động"
                                    : "Đã khóa"}
                                </button>
                              ) : (
                                <span className="ck-text-gray-500">—</span>
                              )}
                            </td>
                            <td className="ck-text-center">
                              <button
                                type="button"
                                className="ck-btn ck-px-3 ck-py-1.5 ck-rounded-lg ck-text-sm ck-bg-blue-500-20 ck-text-blue-400"
                                style={{ border: "none" }}
                                onClick={() => handleOpenEditAccount(user)}
                                title="Chỉnh sửa"
                              >
                                Chỉnh sửa
                              </button>
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
                    onClick={() => {
                      setEditingStore(null);
                      setNewStore({ name: "", address: "", phone: "" });
                      setAssignManagerId("");
                      setShowAddStore(true);
                    }}
                  >
                    <Plus size={18} />
                    Tạo cửa hàng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Địa chỉ</th>
                        <th>Điện thoại</th>
                        <th>Người phụ trách</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((s) => (
                        <tr key={s.storeId ?? s.id}>
                          <td className="ck-font-semibold ck-text-white">
                            {s.name}
                          </td>
                          <td className="ck-text-gray-400">
                            {s.address ?? "-"}
                          </td>
                          <td className="ck-text-gray-400">{s.phone ?? "-"}</td>
                          {(() => {
                            const mgr = getManagerForStore(s);
                            return (
                              <td className="ck-text-gray-300">
                                {mgr === "Chưa có" ? (
                                  <span className="ck-text-empty-state">
                                    {mgr}
                                  </span>
                                ) : (
                                  mgr
                                )}
                              </td>
                            );
                          })()}
                          <td className="ck-text-center">
                            <button
                              type="button"
                              className={`ck-btn ck-px-3 ck-py-1.5 ck-rounded-lg ck-text-sm ck-font-semibold ${
                                s.isActive !== false
                                  ? "ck-bg-green-500-20 ck-text-green-400"
                                  : "ck-bg-gray-500-20 ck-text-gray-400"
                              }`}
                              style={{ border: "none" }}
                              onClick={() => handleToggleStoreActive(s)}
                              title={
                                s.isActive !== false
                                  ? "Bấm để đóng cửa hàng"
                                  : "Bấm để mở cửa hàng"
                              }
                            >
                              {s.isActive !== false ? "Đang mở" : "Đã đóng"}
                            </button>
                          </td>
                          <td className="ck-text-center">
                            <button
                              type="button"
                              className="ck-btn ck-px-3 ck-py-1.5 ck-text-sm ck-bg-gray-700 ck-text-gray-300 ck-rounded-lg ck-font-semibold"
                              style={{ border: "none" }}
                              onClick={() => {
                                setEditingStore(s);
                                setNewStore({
                                  name: s.name ?? "",
                                  address: s.address ?? "",
                                  phone: s.phone ?? "",
                                });
                                const mgr = getManagerAccountForStore(s);
                                setAssignManagerId(
                                  mgr?.accountId ??
                                    mgr?.id ??
                                    mgr?.userId ??
                                    "",
                                );
                                setShowAddStore(true);
                              }}
                            >
                              Chỉnh sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stores.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có cửa hàng. Bấm &quot;Tạo cửa hàng&quot; để thêm.
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
                                      categoryId:
                                        p.categoryId ?? p.category ?? "",
                                      sellingPrice: String(
                                        p.sellingPrice ?? p.price ?? "",
                                      ),
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

          {adminTab === "formulas" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Quản lý công thức
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Xem, lưu hoặc xóa công thức nguyên liệu cho từng sản phẩm.
              </p>
              <div className="ck-flex ck-gap-6 ck-flex-col lg:ck-flex-row">
                <div className="ck-flex-1 ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700">
                    <h3 className="ck-text-xl ck-font-bold ck-text-white">
                      Chọn sản phẩm
                    </h3>
                  </div>
                  <div className="ck-p-4 ck-max-h-80 ck-overflow-y-auto">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`ck-w-full ck-text-left ck-p-3 ck-rounded-xl ck-mb-2 ck-transition ${
                          formulaProductId === (p.productId ?? p.id)
                            ? "ck-bg-orange-500-20 ck-text-orange-400 ck-border ck-border-orange-500-40"
                            : "ck-bg-gray-800 ck-text-gray-300 hover:ck-bg-gray-700"
                        }`}
                        onClick={async () => {
                          const pid = p.productId ?? p.id;
                          setFormulaProductId(pid);
                          setFormulaError("");
                          setFormulaLoading(true);
                          try {
                            const res = await api.getFormula(pid);
                            const ing =
                              res?.ingredients ??
                              res?.items ??
                              Array.isArray(res)
                                ? res
                                : [];
                            const mapped = ing.map((i) => ({
                              ingredientId:
                                i.ingredientId ?? i.ingredient_id ?? "",
                              amountNeeded: Number(
                                i.amountNeeded ?? i.amount_needed ?? 0,
                              ),
                            }));
                            setFormulaIngredients(
                              mapped.length > 0
                                ? mapped
                                : [{ ingredientId: "", amountNeeded: 0 }],
                            );
                          } catch {
                            setFormulaIngredients([
                              { ingredientId: "", amountNeeded: 0 },
                            ]);
                          } finally {
                            setFormulaLoading(false);
                          }
                        }}
                      >
                        <span className="ck-font-semibold">
                          {p.emoji} {p.name}
                        </span>
                        <span className="ck-mono ck-text-gray-400 ck-ml-2">
                          {p.productId ?? p.id}
                        </span>
                      </button>
                    ))}
                    {products.length === 0 && (
                      <div className="ck-text-gray-400 ck-py-4">
                        Chưa có sản phẩm. Thêm sản phẩm ở tab Danh mục &amp;
                        Sản phẩm.
                      </div>
                    )}
                  </div>
                </div>
                <div className="ck-flex-1 ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                    <h3 className="ck-text-xl ck-font-bold ck-text-white">
                      Công thức
                      {formulaProductId && (
                        <span className="ck-mono ck-text-gray-400 ck-ml-2 ck-font-normal">
                          {formulaProductId}
                        </span>
                      )}
                    </h3>
                    {formulaProductId && (
                      <div className="ck-flex ck-gap-2">
                        <button
                          type="button"
                          className="ck-btn ck-px-3 ck-py-1.5 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400 ck-font-semibold"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Bạn có chắc muốn xóa công thức này?",
                              )
                            )
                              return;
                            try {
                              await api.deleteFormula(formulaProductId);
                              setFormulaIngredients([]);
                              setFormulaProductId("");
                              setFormulaError("");
                              window.alert("Đã xóa công thức.");
                            } catch (err) {
                              setFormulaError(
                                err?.message || "Không thể xóa công thức.",
                              );
                            }
                          }}
                        >
                          <Trash2 size={16} className="ck-inline ck-mr-1" />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ck-p-6">
                    {!formulaProductId ? (
                      <div className="ck-text-gray-400 ck-py-8 ck-text-center">
                        Chọn một sản phẩm bên trái để xem hoặc chỉnh sửa công
                        thức.
                      </div>
                    ) : formulaLoading ? (
                      <div className="ck-text-gray-400 ck-py-8 ck-text-center">
                        Đang tải…
                      </div>
                    ) : (
                      <>
                        {formulaError && (
                          <div className="ck-p-3 ck-mb-4 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400">
                            {formulaError}
                          </div>
                        )}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const valid = formulaIngredients.filter(
                              (i) =>
                                i.ingredientId?.trim() &&
                                Number(i.amountNeeded) > 0,
                            );
                            if (valid.length === 0) {
                              setFormulaError(
                                "Thêm ít nhất một nguyên liệu với số lượng > 0.",
                              );
                              return;
                            }
                            setFormulaError("");
                            try {
                              await api.upsertFormula({
                                productId: formulaProductId,
                                ingredients: valid.map((i) => ({
                                  ingredientId: i.ingredientId.trim(),
                                  amountNeeded: Number(i.amountNeeded),
                                })),
                              });
                              window.alert("Đã lưu công thức.");
                              setFormulaIngredients(valid);
                            } catch (err) {
                              setFormulaError(
                                err?.message || "Không thể lưu công thức.",
                              );
                            }
                          }}
                        >
                          <div className="ck-space-y-3 ck-mb-4">
                            {formulaIngredients.map((item, idx) => (
                              <div
                                key={idx}
                                className="ck-flex ck-gap-2 ck-items-center"
                              >
                                <select
                                  className="ck-input ck-flex-1"
                                  value={item.ingredientId}
                                  onChange={(ev) => {
                                    const next = [...formulaIngredients];
                                    next[idx] = {
                                      ...next[idx],
                                      ingredientId: ev.target.value,
                                    };
                                    setFormulaIngredients(next);
                                  }}
                                >
                                  <option value="">
                                    -- Chọn nguyên liệu --
                                  </option>
                                  {ingredients.map((ing) => (
                                    <option
                                      key={ing.id}
                                      value={ing.ingredientId ?? ing.id}
                                    >
                                      {ing.name ?? ing.ingredientName ?? ing.id}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="ck-input ck-w-24"
                                  placeholder="SL"
                                  value={
                                    item.amountNeeded > 0
                                      ? item.amountNeeded
                                      : ""
                                  }
                                  onChange={(ev) => {
                                    const next = [...formulaIngredients];
                                    next[idx] = {
                                      ...next[idx],
                                      amountNeeded: parseFloat(
                                        ev.target.value,
                                      ) || 0,
                                    };
                                    setFormulaIngredients(next);
                                  }}
                                />
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400"
                                  onClick={() => {
                                    setFormulaIngredients(
                                      formulaIngredients.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    );
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="ck-flex ck-gap-2">
                            <button
                              type="button"
                              className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-700 ck-text-white ck-rounded-xl"
                              onClick={() =>
                                setFormulaIngredients([
                                  ...formulaIngredients,
                                  { ingredientId: "", amountNeeded: 0 },
                                ])
                              }
                            >
                              <Plus size={18} className="ck-inline ck-mr-1" />
                              Thêm nguyên liệu
                            </button>
                            <button
                              type="submit"
                              className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                            >
                              Lưu công thức
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
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
                    const supplierId =
                      importForm.supplierId?.trim() || undefined;
                    const items = importForm.items
                      .filter((i) => i.ingredientId && Number(i.quantity) > 0)
                      .map((i) => ({
                        ingredientId: i.ingredientId,
                        unit: (i.unit || "KG").toUpperCase(),
                        quantity: Number(i.quantity) || 0,
                        importPrice: Number(i.importPrice) || 0,
                      }));
                    if (items.length === 0) {
                      window.alert(
                        "Thêm ít nhất một dòng nguyên liệu với số lượng và đơn giá.",
                      );
                      return;
                    }
                    try {
                      await api.importInventory({ note, supplierId, items });
                      setImportForm({
                        note: "",
                        supplierId: "",
                        items: [
                          {
                            ingredientId: "",
                            unit: "KG",
                            quantity: "",
                            importPrice: "",
                          },
                        ],
                      });
                      window.alert("✅ Tạo phiếu nhập kho thành công!");
                    } catch (err) {
                      window.alert("Lỗi: " + (err.message || "Không gửi được"));
                    }
                  }}
                  className="ck-space-y-4"
                >
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={importForm.note}
                      onChange={(e) =>
                        setImportForm((f) => ({ ...f, note: e.target.value }))
                      }
                      placeholder="Nhập hàng sáng thứ 2"
                    />
                  </div>
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                      Mã nhà cung cấp
                    </label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={importForm.supplierId}
                      onChange={(e) =>
                        setImportForm((f) => ({
                          ...f,
                          supplierId: e.target.value,
                        }))
                      }
                      placeholder="SUP-001"
                    />
                  </div>
                  <div>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-2">
                      <label className="ck-text-sm ck-font-semibold ck-text-gray-300">
                        Chi tiết nhập (nguyên liệu, đơn vị, số lượng, đơn giá)
                      </label>
                      <button
                        type="button"
                        className="ck-btn ck-px-3 ck-py-1 ck-rounded-lg ck-bg-gray-700 ck-text-white ck-text-sm"
                        onClick={() =>
                          setImportForm((f) => ({
                            ...f,
                            items: [
                              ...f.items,
                              {
                                ingredientId: "",
                                unit: "KG",
                                quantity: "",
                                importPrice: "",
                              },
                            ],
                          }))
                        }
                      >
                        + Dòng
                      </button>
                    </div>
                    <div className="ck-space-y-2">
                      {importForm.items.map((row, idx) => (
                        <div
                          key={idx}
                          className="ck-flex ck-gap-2 ck-flex-wrap ck-items-center"
                        >
                          <select
                            className="ck-select ck-flex-1 ck-min-w-[120px]"
                            value={row.ingredientId}
                            onChange={(e) =>
                              setImportForm((f) => ({
                                ...f,
                                items: f.items.map((it, i) =>
                                  i === idx
                                    ? { ...it, ingredientId: e.target.value }
                                    : it,
                                ),
                              }))
                            }
                          >
                            <option value="">-- Chọn nguyên liệu --</option>
                            {ingredients.map((ing) => (
                              <option
                                key={ing.id ?? ing.ingredientId}
                                value={ing.ingredientId ?? ing.id}
                              >
                                {ing.ingredientName ??
                                  ing.name ??
                                  ing.ingredientId ??
                                  ing.id}
                              </option>
                            ))}
                          </select>
                          <select
                            className="ck-select ck-w-20"
                            value={row.unit}
                            onChange={(e) =>
                              setImportForm((f) => ({
                                ...f,
                                items: f.items.map((it, i) =>
                                  i === idx
                                    ? { ...it, unit: e.target.value }
                                    : it,
                                ),
                              }))
                            }
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
                            onChange={(e) =>
                              setImportForm((f) => ({
                                ...f,
                                items: f.items.map((it, i) =>
                                  i === idx
                                    ? { ...it, quantity: e.target.value }
                                    : it,
                                ),
                              }))
                            }
                          />
                          <input
                            type="number"
                            className="ck-input ck-w-28"
                            placeholder="Đơn giá"
                            value={row.importPrice}
                            onChange={(e) =>
                              setImportForm((f) => ({
                                ...f,
                                items: f.items.map((it, i) =>
                                  i === idx
                                    ? { ...it, importPrice: e.target.value }
                                    : it,
                                ),
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400"
                            onClick={() =>
                              setImportForm((f) => ({
                                ...f,
                                items: f.items.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  >
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
                Tạo tài khoản mới (Admin)
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
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  autoComplete="username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="vd: q1_store"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="ck-input ck-w-full"
                  autoComplete="new-password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="vd: 123 (ít nhất 6 ký tự)"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Họ tên
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="vd: Quản lý Quận 1"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="ck-input ck-w-full"
                  autoComplete="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="vd: quanlyq1@centralkitchen.com"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Vai trò
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="franchise">Quản lý cửa hàng</option>
                  <option value="kitchen">Nhân viên bếp</option>
                  <option value="coordinator">Điều phối viên</option>
                  <option value="manager">Quản lý</option>
                </select>
              </div>
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
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStore && (
        <div
          className="ck-modal-overlay"
          onClick={() => {
            setShowAddStore(false);
            setEditingStore(null);
            setAssignManagerId("");
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
                {editingStore ? "Chỉnh sửa cửa hàng" : "Tạo cửa hàng mới"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddStore(false);
                  setEditingStore(null);
                  setAssignManagerId("");
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <form
              className="ck-space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveStore();
              }}
            >
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.name}
                  onChange={(e) =>
                    setNewStore({ ...newStore, name: e.target.value })
                  }
                  placeholder="vd: Cửa hàng Quận 1 - Chi nhánh A"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.address}
                  onChange={(e) =>
                    setNewStore({ ...newStore, address: e.target.value })
                  }
                  placeholder="vd: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Điện thoại
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.phone}
                  onChange={(e) =>
                    setNewStore({ ...newStore, phone: e.target.value })
                  }
                  placeholder="vd: 0901234567"
                />
              </div>
              {editingStore && (
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Nhân viên
                  </label>
                  <select
                    className={`ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-rounded-xl ${
                      !assignManagerId
                        ? "ck-border-gray-600 ck-text-gray-500"
                        : "ck-border-gray-700 ck-text-white"
                    }`}
                    value={assignManagerId}
                    onChange={(e) => setAssignManagerId(e.target.value)}
                  >
                    <option value="">Chọn nhân viên</option>
                    {storeManagersWithoutStore(
                      editingStore?.storeId ?? editingStore?.id,
                    ).map((u) => {
                      const id = u.accountId ?? u.id ?? u.userId;
                      return (
                        <option key={id} value={id}>
                          {u.name ?? u.fullName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => {
                    setShowAddStore(false);
                    setEditingStore(null);
                    setAssignManagerId("");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                >
                  {editingStore ? "Chỉnh sửa cửa hàng" : "Thêm cửa hàng"}
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
                  placeholder="Món Nước"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mô tả
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    editingCategory
                      ? (editingCategory.description ?? "")
                      : newCategoryDescription
                  }
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({
                          ...editingCategory,
                          description: e.target.value,
                        })
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
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4 ck-max-h-[70vh] ck-overflow-y-auto">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mã sản phẩm
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    (editingProduct || newProduct).productId ||
                    (editingProduct || newProduct).id
                  }
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, productId: e.target.value })
                  }
                  placeholder="PHO-01"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    (editingProduct || newProduct).productName ||
                    (editingProduct || newProduct).name
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      productName: e.target.value,
                    })
                  }
                  placeholder="Phở Bò"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Danh mục
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={
                    (editingProduct || newProduct).categoryId ||
                    (editingProduct || newProduct).category
                  }
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, categoryId: e.target.value })
                  }
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
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
                    Giá bán (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ck-input ck-w-full"
                    value={
                      (editingProduct || newProduct).sellingPrice ??
                      (editingProduct || newProduct).price
                    }
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        sellingPrice: e.target.value,
                      })
                    }
                    placeholder="55000"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Đơn vị
                  </label>
                  <select
                    className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                    value={(editingProduct || newProduct).baseUnit || "TÔ"}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, baseUnit: e.target.value })
                    }
                  >
                    <option value="TÔ">TÔ</option>
                    <option value="KG">KG</option>
                    <option value="HỘP">HỘP</option>
                  </select>
                </div>
              </div>
              <div className="ck-flex ck-items-center ck-gap-2">
                <input
                  type="checkbox"
                  id="prod-active"
                  checked={(editingProduct || newProduct).isActive !== false}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, isActive: e.target.checked })
                  }
                  className="ck-rounded"
                />
                <label
                  htmlFor="prod-active"
                  className="ck-text-sm ck-font-semibold ck-text-gray-300"
                >
                  Đang bán
                </label>
              </div>
              <div>
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-2">
                  <label className="ck-text-sm ck-font-semibold ck-text-gray-300">
                    Công thức (nguyên liệu &amp; lượng)
                  </label>
                  <button
                    type="button"
                    className="ck-btn ck-px-3 ck-py-1 ck-rounded-lg ck-bg-gray-700 ck-text-white ck-text-sm"
                    onClick={() =>
                      setNewProduct((p) => ({
                        ...p,
                        ingredients: [
                          ...(p.ingredients || []),
                          { ingredientId: "", amountNeeded: 0 },
                        ],
                      }))
                    }
                  >
                    + Dòng
                  </button>
                </div>
                {(newProduct.ingredients || []).map((row, idx) => (
                  <div
                    key={idx}
                    className="ck-flex ck-gap-2 ck-mb-2 ck-items-center"
                  >
                    <select
                      className="ck-select ck-flex-1 ck-min-w-0"
                      value={row.ingredientId}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          ingredients: p.ingredients.map((it, i) =>
                            i === idx
                              ? { ...it, ingredientId: e.target.value }
                              : it,
                          ),
                        }))
                      }
                    >
                      <option value="">-- Nguyên liệu --</option>
                      {ingredients.map((ing) => (
                        <option
                          key={ing.id ?? ing.ingredientId}
                          value={ing.ingredientId ?? ing.id}
                        >
                          {ing.ingredientName ??
                            ing.name ??
                            ing.ingredientId ??
                            ing.id}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="ck-input ck-w-24"
                      placeholder="Lượng"
                      value={row.amountNeeded}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          ingredients: p.ingredients.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  amountNeeded: Number(e.target.value) || 0,
                                }
                              : it,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20 ck-text-red-400"
                      onClick={() =>
                        setNewProduct((p) => ({
                          ...p,
                          ingredients: p.ingredients.filter(
                            (_, i) => i !== idx,
                          ),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
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
