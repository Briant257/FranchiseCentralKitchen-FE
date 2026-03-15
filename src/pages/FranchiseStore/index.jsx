import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Store,
  Bell,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  DollarSign,
  Send,
  X,
} from "../../components/icons/Icons";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import StatCard from "../../components/common/StatCard";
import OrderCard from "../../components/common/OrderCard";
import { FRANCHISE_MENU } from "../../constants";

const FranchiseStorePage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("create-order");
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeProfile, setStoreProfile] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [storeProfileSaving, setStoreProfileSaving] = useState(false);

  const loadCart = useCallback(async (productsList = []) => {
    try {
      const raw = await api.getStoreCart();
      const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
      const byId = (p) => p?.id ?? p?.productId;
      const merged = items.map((line) => {
        const productId = line.productId ?? line.id;
        const product = productsList.find(
          (p) => byId(p) === productId || String(byId(p)) === String(productId),
        );
        const quantity = Number(line.quantity) || 0;
        return {
          id: productId,
          productId,
          name: product?.name ?? line.productName ?? productId,
          price: Number(product?.price ?? line.unitPrice ?? line.price ?? 0),
          quantity,
          emoji: product?.emoji ?? "🍽️",
        };
      });
      setCart(merged.filter((i) => i.quantity > 0));
    } catch (err) {
      console.error("loadCart:", err);
      setCart([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [productsList, ordersList] = await Promise.all([
        api.getProducts(),
        api.getStoreOrders(),
      ]);
      const prods = Array.isArray(productsList) ? productsList : [];
      setProducts(prods);
      setOrders(Array.isArray(ordersList) ? ordersList : []);
      await loadCart(prods);
    } catch (err) {
      console.error("loadData:", err);
      setProducts([]);
      setOrders([]);
      setCart([]);
    }
  }, [loadCart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "settings") {
      api.getStoreProfile().then((p) => {
        setStoreProfile({
          name: p.name ?? "",
          address: p.address ?? "",
          phone: p.phone ?? "",
        });
      });
    }
  }, [activeTab]);

  const stats = [
    {
      label: "Đơn hàng tháng này",
      value: orders
        .filter((o) => (o.date || "").includes("01/2026"))
        .length.toString(),
      change: "",
      icon: ShoppingCart,
      color: "ck-icon-box-blue",
    },
    {
      label: "Đang chờ xử lý",
      value: orders.filter((o) => o.status === "pending").length.toString(),
      change: "",
      icon: Clock,
      color: "ck-icon-box-yellow",
    },
    {
      label: "Tồn kho",
      value: products.reduce((sum, p) => sum + (p.stock ?? 0), 0).toString(),
      change: "",
      icon: Package,
      color: "ck-icon-box-green",
    },
    {
      label: "Đã hoàn thành",
      value: orders.filter((o) => o.status === "completed").length.toString(),
      change: "",
      icon: CheckCircle,
      color: "ck-icon-box-purple",
    },
  ];

  const addToCart = async (product) => {
    const productId = product.id ?? product.productId;
    try {
      await api.addToStoreCart({ productId, quantity: 1 });
      await loadCart(products);
    } catch (err) {
      window.alert("Thêm món thất bại: " + (err.message || "Lỗi kết nối"));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await api.removeFromStoreCart(productId);
      } else {
        await api.updateStoreCartItem({ productId, quantity });
      }
      await loadCart(products);
    } catch (err) {
      window.alert(
        "Cập nhật giỏ hàng thất bại: " + (err.message || "Lỗi kết nối"),
      );
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.removeFromStoreCart(productId);
      await loadCart(products);
    } catch (err) {
      window.alert("Xóa món thất bại: " + (err.message || "Lỗi kết nối"));
    }
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      window.alert("Giỏ hàng trống!");
      return;
    }
    if (!deliveryDate) {
      window.alert("Vui lòng chọn ngày giao hàng!");
      return;
    }

    try {
      await api.checkoutStoreCart({
        orderType: "STANDARD",
        note: orderNote.trim() || undefined,
      });
      setDeliveryDate("");
      setOrderNote("");
      await loadCart(products);
      await loadData();
      setActiveTab("orders");
      window.alert("✅ Đơn hàng đã được chốt thành công!");
    } catch (err) {
      window.alert("Chốt đơn thất bại: " + (err.message || "Lỗi kết nối"));
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = (searchTerm || "").toLowerCase();
    const matchSearch =
      (p.name || "").toLowerCase().includes(term) ||
      String(p.id || "")
        .toLowerCase()
        .includes(term);
    const matchCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const minVal = (p) => Number(p.min) || 0;
  const lowStockProducts = products.filter(
    (p) => (p.stock ?? 0) < minVal(p) * 1.5,
  );
  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-logo-icon ck-rounded-xl ck-flex ck-items-center ck-justify-center">
            <Store className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">
              Franchise Store
            </h1>
            <p className="ck-text-xs ck-text-gray-400 ck-mono">
              Nhân viên cửa hàng
            </p>
          </div>
        </div>
        <div className="ck-flex ck-items-center ck-gap-3">
          <button
            type="button"
            className="ck-btn ck-relative ck-p-3 ck-bg-gray-800 ck-rounded-xl"
            style={{ border: "none" }}
          >
            <Bell size={22} className="ck-text-gray-300" />
            {lowStockProducts.length > 0 && (
              <span className="ck-bell-badge">{lowStockProducts.length}</span>
            )}
          </button>
          <HeaderSettingsMenu
            userData={userData}
            showProfile={true}
            onOpenProfile={() => setShowUpdateProfileModal(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onLogout={onLogout}
          />
        </div>
      </header>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <UpdateProfileModal
        open={showUpdateProfileModal}
        onClose={() => setShowUpdateProfileModal(false)}
        initialFullName={userData?.name ?? ""}
        initialEmail={userData?.email ?? ""}
        onSuccess={() => {
          onProfileUpdated?.();
          setShowUpdateProfileModal(false);
        }}
      />

      <div className="ck-flex">
        <aside className="ck-sidebar">
          <nav className="ck-sidebar-nav ck-space-y-2">
            {FRANCHISE_MENU.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ck-sidebar-item ck-sidebar-btn ${
                    activeTab === item.id ? "ck-active" : ""
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          className="ck-main ck-scrollbar ck-max-w-7xl"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          {activeTab === "create-order" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Tạo đơn hàng mới
              </h2>

              <div className="ck-grid-1-lg-3 ck-gap-6">
                <div
                  className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6"
                  style={{ gridColumn: "span 2" }}
                >
                  <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                      Danh sách sản phẩm
                    </h3>
                    <div className="ck-flex ck-gap-3">
                      <div className="ck-relative">
                        <Search
                          className="ck-absolute ck-left-4"
                          style={{ top: "50%", transform: "translateY(-50%)" }}
                          size={20}
                        />
                        <input
                          type="text"
                          className="ck-input ck-pl-12"
                          style={{ paddingLeft: "2.5rem" }}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Tìm sản phẩm..."
                        />
                      </div>
                      <select
                        className="ck-select ck-px-4 ck-py-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === "all" ? "Tất cả" : cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ck-grid-1-md-2 ck-gap-4 ck-max-h-600 ck-overflow-y-auto ck-scrollbar ck-pr-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="ck-border ck-border-gray-700 ck-rounded-xl ck-p-5 ck-bg-gray-900-50 ck-card-hover"
                      >
                        <div
                          className="ck-flex ck-justify-between ck-mb-4"
                          style={{ alignItems: "flex-start" }}
                        >
                          <div className="ck-flex ck-items-center ck-gap-3">
                            <span className="ck-text-5xl">{product.emoji}</span>
                            <div>
                              <h4 className="ck-font-bold ck-text-white ck-text-lg">
                                {product.name}
                              </h4>
                              <p className="ck-text-sm ck-text-gray-400">
                                {product.category}
                              </p>
                              <p className="ck-text-xs ck-text-gray-500 ck-mono">
                                {product.id}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ck-flex ck-items-center ck-justify-between">
                          <div>
                            <p className="ck-text-2xl ck-font-black ck-text-orange-400">
                              {product.price.toLocaleString()}₫
                            </p>
                            <p className="ck-text-xs ck-text-gray-500 ck-mono">
                              Còn {product.stock}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-primary ck-text-white ck-rounded-lg ck-font-bold ck-flex ck-items-center ck-gap-2"
                            onClick={() => addToCart(product)}
                          >
                            <Plus size={16} />
                            Thêm
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-h-fit ck-sticky-top-24">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6 ck-flex ck-items-center ck-gap-3">
                    <ShoppingCart size={28} className="ck-text-orange-400" />
                    Giỏ hàng ({cart.length})
                  </h3>

                  {cart.length === 0 ? (
                    <div className="ck-text-center ck-py-12">
                      <ShoppingCart
                        size={64}
                        className="ck-text-gray-700"
                        style={{ margin: "0 auto 1rem" }}
                      />
                      <p className="ck-text-gray-500">Giỏ hàng trống</p>
                    </div>
                  ) : (
                    <>
                      <div className="ck-space-y-3 ck-mb-6 ck-max-h-96 ck-overflow-y-auto ck-scrollbar">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-p-3"
                          >
                            <div
                              className="ck-flex ck-justify-between ck-mb-3"
                              style={{ alignItems: "flex-start" }}
                            >
                              <div className="ck-flex ck-gap-3">
                                <span className="ck-text-3xl">
                                  {item.emoji}
                                </span>
                                <div>
                                  <p className="ck-font-bold ck-text-white">
                                    {item.name}
                                  </p>
                                  <p className="ck-text-sm ck-text-gray-400 ck-mono">
                                    {item.price.toLocaleString()}₫
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="ck-btn ck-text-red-500 ck-p-1 ck-rounded"
                                onClick={() => removeFromCart(item.id)}
                                style={{ background: "none", border: "none" }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="ck-flex ck-items-center ck-justify-between">
                              <div className="ck-flex ck-items-center ck-gap-2 ck-bg-gray-800 ck-rounded-lg ck-border ck-border-gray-700">
                                <button
                                  type="button"
                                  className="ck-btn ck-px-3 ck-py-2"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#e5e7eb",
                                  }}
                                >
                                  -
                                </button>
                                <span className="ck-font-bold ck-text-white ck-px-3 ck-mono">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="ck-btn ck-px-3 ck-py-2"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#e5e7eb",
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <span className="ck-font-black ck-text-orange-400 ck-mono">
                                {(item.price * item.quantity).toLocaleString()}₫
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="ck-border-t ck-border-gray-700 ck-pt-4 ck-space-y-4">
                        <div className="ck-flex ck-justify-between ck-text-lg ck-font-bold">
                          <span className="ck-text-gray-400">Tổng cộng</span>
                          <span className="ck-text-orange-400 ck-text-2xl ck-mono">
                            {cart
                              .reduce(
                                (sum, item) => sum + item.price * item.quantity,
                                0,
                              )
                              .toLocaleString()}
                            ₫
                          </span>
                        </div>

                        <div>
                          <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                            Ngày giao hàng{" "}
                            <span className="ck-text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            className="ck-input ck-w-full ck-mono"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>

                        <div>
                          <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                            Ghi chú đặc biệt
                          </label>
                          <textarea
                            className="ck-input ck-w-full ck-textarea"
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="VD: Giao trước 6h sáng, để riêng..."
                            rows={3}
                          />
                        </div>

                        <button
                          type="button"
                          className="ck-btn ck-w-full ck-py-4 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-black ck-text-lg ck-flex ck-items-center ck-justify-center ck-gap-2"
                          onClick={handleCreateOrder}
                        >
                          <Send size={20} />
                          Gửi đơn đặt hàng
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <>
              <div className="ck-flex ck-items-center ck-justify-between ck-mb-8">
                <h2 className="ck-text-4xl ck-font-black ck-text-white">
                  Đơn hàng của tôi
                </h2>
                <div className="ck-flex ck-gap-3">
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-border ck-border-gray-700 ck-text-gray-300 ck-rounded-xl ck-flex ck-items-center ck-gap-2"
                    style={{ border: "1px solid" }}
                  >
                    <Filter size={20} />
                    Lọc
                  </button>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-border ck-border-gray-700 ck-text-gray-300 ck-rounded-xl ck-flex ck-items-center ck-gap-2"
                    style={{ border: "1px solid" }}
                  >
                    <Download size={20} />
                    Xuất Excel
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-12 ck-text-center">
                  <FileText
                    size={80}
                    className="ck-text-gray-700"
                    style={{ margin: "0 auto 1rem" }}
                  />
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-2">
                    Chưa có đơn hàng nào
                  </h3>
                  <p className="ck-text-gray-400 ck-mb-6">
                    Hãy tạo đơn hàng đầu tiên của bạn
                  </p>
                  <button
                    type="button"
                    className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    style={{ margin: "0 auto" }}
                    onClick={() => setActiveTab("create-order")}
                  >
                    <Plus size={20} />
                    Tạo đơn hàng
                  </button>
                </div>
              ) : (
                <div
                  className="ck-grid-1-md-2 ck-gap-6"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(320px, 1fr))",
                  }}
                >
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={setSelectedOrder}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "inventory" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Tồn kho cửa hàng
              </h2>

              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <div className="ck-flex ck-gap-3">
                    <div className="ck-relative">
                      <Search
                        className="ck-absolute ck-left-4"
                        style={{ top: "50%", transform: "translateY(-50%)" }}
                        size={20}
                      />
                      <input
                        type="text"
                        className="ck-input ck-w-64 ck-mono"
                        style={{ paddingLeft: "2.5rem" }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm sản phẩm..."
                      />
                    </div>
                    <select
                      className="ck-select ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "all" ? "Tất cả danh mục" : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-3 ck-bg-green-600 ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                  >
                    <Download size={18} />
                    Xuất báo cáo
                  </button>
                </div>

                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th className="ck-text-center">Tồn kho</th>
                        <th className="ck-text-center">Tối thiểu</th>
                        <th className="ck-text-center">Giá</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const minP = Number(product.min) || 0;
                        const percent =
                          minP > 0 ? ((product.stock ?? 0) / minP) * 100 : 100;
                        const status =
                          percent < 100
                            ? "low"
                            : percent < 150
                              ? "warn"
                              : "good";
                        return (
                          <tr key={product.id}>
                            <td>
                              <div className="ck-flex ck-items-center ck-gap-4">
                                <span className="ck-text-4xl">
                                  {product.emoji}
                                </span>
                                <div>
                                  <p className="ck-font-bold ck-text-white ck-text-lg">
                                    {product.name}
                                  </p>
                                  <p className="ck-text-sm ck-text-gray-500 ck-mono">
                                    {product.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="ck-text-gray-400">
                              {product.category}
                            </td>
                            <td className="ck-text-center">
                              <span className="ck-font-black ck-text-2xl ck-text-white ck-mono">
                                {product.stock}
                              </span>
                            </td>
                            <td className="ck-text-center ck-text-gray-400 ck-mono">
                              {product.min}
                            </td>
                            <td className="ck-text-center">
                              <span className="ck-font-bold ck-text-orange-400 ck-mono">
                                {(product.price ?? 0).toLocaleString()}₫
                              </span>
                            </td>
                            <td className="ck-text-center">
                              <span
                                className={`ck-badge ${
                                  status === "good"
                                    ? "ck-badge-green"
                                    : status === "warn"
                                      ? "ck-badge-yellow"
                                      : "ck-badge-red"
                                }`}
                              >
                                {status === "good"
                                  ? "✓ Đủ hàng"
                                  : status === "warn"
                                    ? "⚠ Sắp hết"
                                    : "✗ Thiếu"}
                              </span>
                            </td>
                            <td className="ck-text-center">
                              <button
                                type="button"
                                className="ck-btn ck-px-4 ck-py-2 ck-bg-orange-600 ck-text-white ck-rounded-lg ck-font-bold"
                                onClick={() => {
                                  addToCart(product);
                                  setActiveTab("create-order");
                                }}
                              >
                                Đặt hàng
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Báo cáo & Thống kê
              </h2>

              <div
                className="ck-grid-1-md-2 ck-gap-6 ck-mb-8"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                }}
              >
                <div className="ck-bg-blue-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6">
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div className="ck-w-12-h-12 ck-bg-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                      <ShoppingCart className="ck-text-white" size={24} />
                    </div>
                    <div>
                      <p className="ck-text-sm ck-text-blue-400">
                        Tổng đơn hàng
                      </p>
                      <p className="ck-text-3xl ck-font-black ck-text-white">
                        {orders.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="ck-bg-green-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6"
                  style={{ borderColor: "rgba(34,197,94,0.3)" }}
                >
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div className="ck-w-12-h-12 ck-bg-green-600 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                      <DollarSign className="ck-text-white" size={24} />
                    </div>
                    <div>
                      <p className="ck-text-sm ck-text-green-400">
                        Tổng giá trị
                      </p>
                      <p className="ck-text-3xl ck-font-black ck-text-white ck-mono">
                        {(
                          orders.reduce((sum, o) => sum + (o.total ?? 0), 0) /
                          1000000
                        ).toFixed(1)}
                        M
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="ck-bg-purple-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6"
                  style={{
                    background: "rgba(168,85,247,0.2)",
                    borderColor: "rgba(168,85,247,0.3)",
                  }}
                >
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div
                      className="ck-w-12-h-12 ck-bg-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center"
                      style={{ background: "#a855f7" }}
                    >
                      <TrendingUp className="ck-text-white" size={24} />
                    </div>
                    <div>
                      <p className="ck-text-sm ck-text-purple-400">
                        TB đơn hàng
                      </p>
                      <p className="ck-text-3xl ck-font-black ck-text-white ck-mono">
                        {orders.length > 0
                          ? (
                              orders.reduce(
                                (sum, o) => sum + (o.total ?? 0),
                                0,
                              ) /
                              orders.length /
                              1000
                            ).toFixed(0)
                          : 0}
                        K
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6">
                <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6">
                  Lịch sử đặt hàng gần đây
                </h3>
                <div className="ck-space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <div
                      key={order.id}
                      className="ck-flex ck-items-center ck-justify-between ck-p-4 ck-bg-gray-900-50 ck-border ck-border-gray-700 ck-rounded-xl"
                    >
                      <div>
                        <p className="ck-font-bold ck-text-white ck-mono">
                          {order.id}
                        </p>
                        <p className="ck-text-sm ck-text-gray-400">
                          {order.date ?? ""}
                        </p>
                      </div>
                      <div
                        className="ck-text-center"
                        style={{ textAlign: "right" }}
                      >
                        <p className="ck-font-black ck-text-orange-400 ck-mono">
                          {(order.total ?? 0).toLocaleString()}₫
                        </p>
                        <p className="ck-text-sm ck-text-gray-400">
                          {(order.items || []).length} sản phẩm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Cài đặt thông tin tiệm
              </h2>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-max-w-xl">
                <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6 ck-flex ck-items-center ck-gap-3">
                  <Store size={28} className="ck-text-orange-400" />
                  Profile tiệm
                </h3>
                <form
                  className="ck-space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (storeProfileSaving) return;
                    setStoreProfileSaving(true);
                    try {
                      await api.updateStoreProfile(storeProfile);
                      window.alert("✅ Đã lưu thông tin tiệm!");
                    } catch (err) {
                      window.alert(
                        "Lưu thất bại: " + (err.message || "Lỗi kết nối"),
                      );
                    } finally {
                      setStoreProfileSaving(false);
                    }
                  }}
                >
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                      Tên cửa hàng
                    </label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={storeProfile.name}
                      onChange={(e) =>
                        setStoreProfile((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="VD: CH Mới"
                    />
                  </div>
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={storeProfile.address}
                      onChange={(e) =>
                        setStoreProfile((p) => ({
                          ...p,
                          address: e.target.value,
                        }))
                      }
                      placeholder="VD: 123 Lộ"
                    />
                  </div>
                  <div>
                    <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                      Điện thoại
                    </label>
                    <input
                      type="text"
                      className="ck-input ck-w-full"
                      value={storeProfile.phone}
                      onChange={(e) =>
                        setStoreProfile((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="VD: 0987654321"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={storeProfileSaving}
                    className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                  >
                    {storeProfileSaving ? "Đang lưu…" : "Lưu thay đổi"}
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      {selectedOrder && (
        <div
          className="ck-modal-overlay"
          onClick={() => setSelectedOrder(null)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-2xl ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-3xl ck-font-black ck-text-white">
                Chi tiết đơn hàng
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>

            <div className="ck-grid-2 ck-gap-4 ck-mb-6">
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">
                  Mã đơn hàng
                </p>
                <p className="ck-font-bold ck-text-xl ck-text-white ck-mono">
                  {selectedOrder.id}
                </p>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">
                  Trạng thái
                </p>
                <span
                  className={`ck-badge ${
                    selectedOrder.status === "pending"
                      ? "ck-badge-yellow"
                      : selectedOrder.status === "processing"
                        ? "ck-badge-blue"
                        : selectedOrder.status === "completed"
                          ? "ck-badge-green"
                          : "ck-badge-red"
                  }`}
                >
                  {selectedOrder.status === "pending"
                    ? "Chờ xử lý"
                    : selectedOrder.status === "processing"
                      ? "Đang xử lý"
                      : selectedOrder.status === "completed"
                        ? "Hoàn thành"
                        : "Đã hủy"}
                </span>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Ngày đặt</p>
                <p className="ck-font-semibold ck-text-white">
                  {selectedOrder.date ?? ""}
                </p>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">
                  Ngày giao dự kiến
                </p>
                <p className="ck-font-semibold ck-text-white">
                  {selectedOrder.deliveryDate ?? "—"}
                </p>
              </div>
            </div>

            <div className="ck-border-t ck-border-gray-700 ck-pt-6 ck-mb-6">
              <h4 className="ck-font-bold ck-text-white ck-mb-4 ck-text-lg">
                Sản phẩm đặt hàng
              </h4>
              <div className="ck-space-y-3">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900-50 ck-p-4 ck-rounded-xl"
                  >
                    <div>
                      <p className="ck-font-semibold ck-text-white">
                        {item.name}
                      </p>
                      <p className="ck-text-sm ck-text-gray-400 ck-mono">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="ck-font-bold ck-text-orange-400 ck-mono">
                      {(item.price * item.quantity).toLocaleString()}₫
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.note && (
              <div className="ck-bg-blue-500-10 ck-border ck-border-blue-500-30 ck-rounded-xl ck-p-4 ck-mb-6">
                <p className="ck-text-sm ck-font-semibold ck-text-blue-400 ck-mb-2">
                  📝 Ghi chú:
                </p>
                <p className="ck-text-white">{selectedOrder.note}</p>
              </div>
            )}

            <div className="ck-border-t ck-border-gray-700 ck-pt-6 ck-flex ck-justify-between ck-items-center">
              <span className="ck-text-xl ck-font-bold ck-text-white">
                Tổng cộng
              </span>
              <span className="ck-text-3xl ck-font-black ck-text-orange-400 ck-mono">
                {(selectedOrder.total ?? 0).toLocaleString()}₫
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseStorePage;
