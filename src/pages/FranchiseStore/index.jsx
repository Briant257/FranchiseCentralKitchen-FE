import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  ShoppingCart,
  CheckCircle,
  FileText,
  Store,
  Plus,
  Trash2,
} from "../../components/icons/Icons";
import "../../styles/store-manager.css";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";

const PAGE_META = {
  cart: {
    title: "Giỏ hàng",
    crumb: "Giỏ hàng",
    iconBg: "#fdf3e0",
    iconStroke: "#d4860a",
  },
  orders: {
    title: "Đơn hàng",
    crumb: "Đơn hàng",
    iconBg: "#eef3f7",
    iconStroke: "#3d5a70",
  },
  shipments: {
    title: "Nhận hàng",
    crumb: "Nhận hàng",
    iconBg: "#f5f3ff",
    iconStroke: "#8b5cf6",
  },
  settings: {
    title: "Cài đặt tiệm",
    crumb: "Cài đặt",
    iconBg: "#eef5f1",
    iconStroke: "#4a7c5f",
  },
};

const STATUS_MAP = {
  PENDING: { l: "Chờ xác nhận", c: "#d97706", b: "rgba(217,119,6,.1)" },
  CONFIRMED: { l: "Đã xác nhận", c: "#3d5a70", b: "rgba(61,90,112,.1)" },
  SHIPPING: { l: "Đang giao", c: "#7c3aed", b: "rgba(124,58,237,.1)" },
  DELIVERED: { l: "Đã giao", c: "#4a7c5f", b: "rgba(74,124,95,.1)" },
  completed: { l: "Hoàn thành", c: "#4a7c5f", b: "rgba(74,124,95,.1)" },
  pending: { l: "Chờ xử lý", c: "#d97706", b: "rgba(217,119,6,.1)" },
  processing: { l: "Đang xử lý", c: "#3d5a70", b: "rgba(61,90,112,.1)" },
  ARRIVED: { l: "Đã đến", c: "#4a7c5f", b: "rgba(74,124,95,.1)" },
  ON_WAY: { l: "Đang đến", c: "#7c3aed", b: "rgba(124,58,237,.1)" },
};

const FranchiseStorePage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activePage, setActivePage] = useState("cart");
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [storeProfile, setStoreProfile] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [storeProfileSaving, setStoreProfileSaving] = useState(false);
  const [panel, setPanel] = useState(null);
  const [checkoutOrderType, setCheckoutOrderType] = useState("STANDARD");
  const [checkoutNote, setCheckoutNote] = useState("");
  const [quickOrderItems, setQuickOrderItems] = useState([
    { productId: "", quantity: 1 },
  ]);
  const [quickOrderType, setQuickOrderType] = useState("STANDARD");
  const [quickOrderNote, setQuickOrderNote] = useState("");
  const [quickOrderDeliveryDate, setQuickOrderDeliveryDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [reportShipmentId, setReportShipmentId] = useState(null);
  const [reportItems, setReportItems] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailData, setOrderDetailData] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    msg: "",
    color: "#4a7c5f",
  });
  const [profileEditing, setProfileEditing] = useState(false);

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
      setShipments([]);
    } catch (err) {
      console.error("loadData:", err);
      setProducts([]);
      setOrders([]);
      setCart([]);
      setShipments([]);
    }
  }, [loadCart]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    if (activePage === "settings") {
      api.getStoreProfile().then((p) => {
        setStoreProfile({
          name: p.name ?? "",
          address: p.address ?? "",
          phone: p.phone ?? "",
        });
      });
    }
  }, [activePage]);

  const showToast = (msg, color = "#4a7c5f") => {
    setToast({ show: true, msg, color });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  };
  const openPanel = (name) => setPanel(name);
  const closePanel = () => setPanel(null);

  const addToCart = async (product) => {
    const productId = product.id ?? product.productId;
    try {
      await api.addToStoreCart({ productId, quantity: 1 });
      await loadCart(products);
      showToast("Đã thêm: " + (product.name || productId), "#4a7c5f");
    } catch (err) {
      showToast("Thêm món thất bại", "#c0392b");
    }
  };

  const updateQty = async (productId, delta) => {
    const item = cart.find((c) => (c.id ?? c.productId) === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      try {
        await api.removeFromStoreCart(productId);
        await loadCart(products);
        showToast("Đã xóa khỏi giỏ", "#c0392b");
      } catch (err) {
        showToast("Xóa thất bại", "#c0392b");
      }
    } else {
      try {
        await api.updateStoreCartItem({ productId, quantity: newQty });
        await loadCart(products);
      } catch (err) {
        showToast("Cập nhật thất bại", "#c0392b");
      }
    }
  };

  const doCheckout = async () => {
    if (cart.length === 0) {
      showToast("Giỏ hàng trống", "#c0392b");
      return;
    }
    try {
      await api.checkoutStoreCart({
        orderType: checkoutOrderType,
        note: checkoutNote.trim() || undefined,
      });
      setCheckoutNote("");
      await loadCart(products);
      await loadData();
      closePanel();
      setActivePage("orders");
      showToast("Đã chốt đơn thành công!", "#4a7c5f");
    } catch (err) {
      showToast("Chốt đơn thất bại: " + (err.message || "Lỗi"), "#c0392b");
    }
  };

  const doQuickOrder = async () => {
    const items = quickOrderItems
      .filter((r) => r.productId && (r.quantity || 0) > 0)
      .map((r) => ({
        productId: r.productId,
        quantity: Number(r.quantity) || 1,
        price:
          products.find((p) => (p.id ?? p.productId) === r.productId)?.price ??
          0,
      }));
    if (items.length === 0) {
      showToast("Chọn ít nhất một sản phẩm", "#c0392b");
      return;
    }
    try {
      await api.createStoreOrder(
        {
          deliveryDate: quickOrderDeliveryDate,
          items,
          note: quickOrderNote.trim() || undefined,
        },
        quickOrderType,
      );
      await loadData();
      closePanel();
      setQuickOrderItems([{ productId: "", quantity: 1 }]);
      setQuickOrderNote("");
      showToast("Đã tạo đơn hàng", "#4a7c5f");
    } catch (err) {
      showToast("Tạo đơn thất bại: " + (err.message || "Lỗi"), "#c0392b");
    }
  };

  const openOrderDetail = async (order) => {
    setOrderDetail(order);
    setOrderDetailData(null);
    try {
      const detail = await api.getStoreOrderDetail(order.id);
      setOrderDetailData(detail ?? order);
    } catch {
      setOrderDetailData(order);
    }
    openPanel("orderDetail");
  };

  const openReport = (shipmentId) => {
    setReportShipmentId(shipmentId);
    setReportItems(
      products.slice(0, 5).map((p) => ({
        productId: p.id ?? p.productId,
        productName: p.name,
        expectedQuantity: 10,
        receivedQuantity: 10,
        note: "",
      })),
    );
    openPanel("report");
  };

  const doReport = async () => {
    if (!reportShipmentId) return;
    const reportedItems = reportItems.map((r) => ({
      productId: r.productId,
      receivedQuantity: Number(r.receivedQuantity) ?? 0,
      note: (r.note || "").trim() || undefined,
    }));
    try {
      await api.reportShipmentShortage(reportShipmentId, { reportedItems });
      closePanel();
      showToast("Đã gửi báo cáo sự cố", "#c0392b");
    } catch (err) {
      showToast("Gửi báo cáo thất bại", "#c0392b");
    }
  };

  const saveProfile = async () => {
    setStoreProfileSaving(true);
    try {
      await api.updateStoreProfile(storeProfile);
      setProfileEditing(false);
      showToast("Đã lưu thông tin tiệm", "#4a7c5f");
    } catch (err) {
      showToast("Lưu thất bại", "#c0392b");
    } finally {
      setStoreProfileSaving(false);
    }
  };

  const fmt = (n) => (n ?? 0).toLocaleString("vi-VN") + "₫";
  const badge = (status) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
      <span className="badge" style={{ color: s.c, background: s.b }}>
        {s.l}
      </span>
    );
  };
  const cartCount = cart.reduce((s, i) => s + (i.quantity || 0), 0);
  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const meta = PAGE_META[activePage] || PAGE_META.cart;

  return (
    <div className="sm-page">
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

      <div className="layout">
        <aside className="sb">
          <div className="sb-header">
            <div className="sb-logo">
              <div className="sb-logo-icon">🍜</div>
              <span className="sb-logo-text">Cửa hàng</span>
            </div>
            <div className="sb-store-card">
              <div className="sb-store-name">
                {storeProfile.name || "Chưa Có Cửa Hàng"}
              </div>
              <div className="sb-store-role">
                {userData?.name ?? userData?.fullName ?? "—"}
              </div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="nav-group-label">Đặt hàng</div>
            <button
              type="button"
              className={`ni ${activePage === "cart" ? "on" : ""}`}
              onClick={() => setActivePage("cart")}
            >
              <ShoppingCart size={15} />
              Giỏ hàng
              {cartCount > 0 && <span className="ni-badge">{cartCount}</span>}
            </button>
            <button
              type="button"
              className={`ni ${activePage === "orders" ? "on" : ""}`}
              onClick={() => setActivePage("orders")}
            >
              <FileText size={15} />
              Đơn hàng
            </button>
            <div className="nav-group-label">Vận hành</div>
            <button
              type="button"
              className={`ni ${activePage === "shipments" ? "on" : ""}`}
              onClick={() => setActivePage("shipments")}
            >
              <Package size={15} />
              Nhận hàng
            </button>
            <button
              type="button"
              className={`ni ${activePage === "settings" ? "on" : ""}`}
              onClick={() => setActivePage("settings")}
            >
              <Store size={15} />
              Cài đặt tiệm
            </button>
          </nav>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="tb-page">
              <div className="tb-page-icon" style={{ background: meta.iconBg }}>
                {activePage === "cart" && (
                  <ShoppingCart size={16} style={{ color: meta.iconStroke }} />
                )}
                {activePage === "orders" && (
                  <FileText size={16} style={{ color: meta.iconStroke }} />
                )}
                {activePage === "shipments" && (
                  <Package size={16} style={{ color: meta.iconStroke }} />
                )}
                {activePage === "settings" && (
                  <Store size={16} style={{ color: meta.iconStroke }} />
                )}
              </div>
              <div className="tb-title">{meta.title}</div>
            </div>
            <div className="tb-actions">
              <HeaderSettingsMenu
                userData={userData}
                showProfile={true}
                onOpenProfile={() => setShowUpdateProfileModal(true)}
                onChangePassword={() => setShowChangePasswordModal(true)}
                onLogout={onLogout}
              />
            </div>
          </div>

          <div className="content">
            <div className="stats">
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--amber)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Trong giỏ</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--amber-bg)" }}
                  >
                    <ShoppingCart size={14} style={{ color: "var(--amber)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--amber)" }}>
                  {cartCount}
                </div>
              </div>
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--slate)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Đơn hàng</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--slate-bg)" }}
                  >
                    <FileText size={14} style={{ color: "var(--slate)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--slate)" }}>
                  {orders.length}
                </div>
              </div>
              <div className="sc">
                <div className="sc-stripe" style={{ background: "#8b5cf6" }} />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Đang giao</div>
                  </div>
                  <div className="sc-icon" style={{ background: "#f5f3ff" }}>
                    <Package size={14} style={{ color: "#8b5cf6" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "#8b5cf6" }}>
                  {
                    shipments.filter(
                      (s) => s.status === "ON_WAY" || s.status === "SHIPPING",
                    ).length
                  }
                </div>
              </div>
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--sage)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Đã nhận</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--sage-bg)" }}
                  >
                    <CheckCircle size={14} style={{ color: "var(--sage)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--sage)" }}>
                  {
                    shipments.filter(
                      (s) => s.status === "ARRIVED" || s.status === "DELIVERED",
                    ).length
                  }
                </div>
              </div>
            </div>

            <div
              className={`page ${activePage === "cart" ? "on" : ""}`}
              id="page-cart"
            >
              <div className="cart-layout">
                <div>
                  {(categories.filter((c) => c !== "all").length
                    ? categories.filter((c) => c !== "all")
                    : ["all"]
                  ).map((cat) => (
                    <div key={cat} className="prod-section">
                      <div className="prod-section-label">
                        {cat === "all" ? "Sản phẩm" : cat}
                      </div>
                      <div className="prod-grid">
                        {(cat === "all"
                          ? products
                          : products.filter((p) => p.category === cat)
                        ).map((product) => {
                          const item = cart.find(
                            (c) =>
                              (c.id ?? c.productId) ===
                              (product.id ?? product.productId),
                          );
                          const qty = item ? item.quantity : 0;
                          return (
                            <button
                              key={product.id}
                              type="button"
                              className={`ptile ${qty > 0 ? "in" : ""}`}
                              onClick={() => addToCart(product)}
                            >
                              {qty > 0 && (
                                <span className="pt-incart">×{qty}</span>
                              )}
                              <div className="pt-unit">
                                {product.category || "SP"}
                              </div>
                              <div className="pt-name">{product.name}</div>
                              <div className="pt-price">
                                {fmt(product.price)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-panel">
                  <div className="cp-header">
                    <div className="cp-title">
                      <ShoppingCart size={15} style={{ opacity: 0.7 }} /> Giỏ
                      hàng
                    </div>
                    <span className="cp-count">
                      {cartCount ? cartCount + " món" : "trống"}
                    </span>
                  </div>
                  {cart.length === 0 ? (
                    <div className="cp-empty">
                      <div className="cp-empty-icon">🛒</div>
                      <p>Giỏ hàng đang trống</p>
                      <p>Chọn món từ thực đơn bên trái</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        {cart.map((item) => (
                          <div key={item.id} className="ci">
                            <div className="ci-info">
                              <div className="ci-name">{item.name}</div>
                              <div className="ci-price">
                                {fmt((item.price ?? 0) * (item.quantity ?? 0))}
                              </div>
                            </div>
                            <div className="qty-ctrl">
                              <button
                                type="button"
                                className="qb"
                                onClick={() =>
                                  updateQty(item.id ?? item.productId, -1)
                                }
                              >
                                −
                              </button>
                              <span className="qv">{item.quantity}</span>
                              <button
                                type="button"
                                className="qb"
                                onClick={() =>
                                  updateQty(item.id ?? item.productId, 1)
                                }
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="ci-del"
                              onClick={() =>
                                updateQty(item.id ?? item.productId, -999)
                              }
                              aria-label="Xóa"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="cp-footer">
                        <div className="cp-total-row">
                          <span className="cp-total-lbl">Tổng cộng</span>
                          <span className="cp-total-val">
                            {fmt(
                              cart.reduce(
                                (s, i) =>
                                  s + (i.price ?? 0) * (i.quantity ?? 0),
                                0,
                              ),
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-amber"
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            fontSize: 13,
                          }}
                          onClick={() => openPanel("checkout")}
                        >
                          Chốt đơn hàng
                          <svg
                            width={13}
                            height={13}
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <polyline points="6 3 11 8 6 13" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`page ${activePage === "orders" ? "on" : ""}`}
              id="page-orders"
            >
              <div className="toolbar">
                <button
                  type="button"
                  className="btn btn-amber"
                  onClick={() => {
                    setQuickOrderItems([
                      { productId: products[0]?.id ?? "", quantity: 1 },
                    ]);
                    openPanel("quickOrder");
                  }}
                >
                  <Plus size={13} /> Tạo đơn nhanh
                </button>
              </div>
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">
                    <div
                      className="card-icon"
                      style={{ background: "var(--slate-bg)" }}
                    >
                      <FileText size={13} style={{ color: "var(--slate)" }} />
                    </div>
                    Đơn hàng của tiệm
                  </div>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Loại</th>
                        <th>Trạng thái</th>
                        <th>Số món</th>
                        <th>Tổng tiền</th>
                        <th>Thời gian</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{ textAlign: "center", padding: 24 }}
                          >
                            <div className="empty">
                              <FileText size={40} />
                              <p>Chưa có đơn hàng</p>
                              <button
                                type="button"
                                className="btn btn-amber"
                                style={{ marginTop: 12 }}
                                onClick={() => setActivePage("cart")}
                              >
                                <Plus size={13} /> Tạo đơn từ giỏ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <span
                                className="mono"
                                style={{ fontWeight: 600 }}
                              >
                                {o.id}
                              </span>
                            </td>
                            <td>
                              <span className="tag tag-s">STANDARD</span>
                            </td>
                            <td>{badge(o.status)}</td>
                            <td
                              className="mono"
                              style={{ color: "var(--ink2)" }}
                            >
                              {(o.items || []).length}
                            </td>
                            <td
                              className="mono"
                              style={{ color: "var(--amber)", fontWeight: 600 }}
                            >
                              {fmt(o.total)}
                            </td>
                            <td
                              style={{ fontSize: 11.5, color: "var(--ink3)" }}
                            >
                              {o.date ?? "—"}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-xs"
                                onClick={() => openOrderDetail(o)}
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className={`page ${activePage === "shipments" ? "on" : ""}`}
              id="page-shipments"
            >
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">
                    <div
                      className="card-icon"
                      style={{ background: "#f5f3ff" }}
                    >
                      <Package size={13} style={{ color: "#8b5cf6" }} />
                    </div>
                    Lô hàng đến
                  </div>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã lô</th>
                        <th>Mã đơn</th>
                        <th>Trạng thái</th>
                        <th>Thời gian đến</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", padding: 24 }}
                          >
                            <div className="empty">
                              <Package size={40} />
                              <p>Chưa có lô hàng</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        shipments.map((s) => (
                          <tr key={s.shipmentId ?? s.id}>
                            <td>
                              <span
                                className="mono"
                                style={{ fontWeight: 600 }}
                              >
                                {s.shipmentId ?? s.id}
                              </span>
                            </td>
                            <td>
                              <span className="mono">{s.orderId ?? "—"}</span>
                            </td>
                            <td>{badge(s.status)}</td>
                            <td
                              style={{ fontSize: 11.5, color: "var(--ink3)" }}
                            >
                              {s.arrivedAt
                                ? new Date(s.arrivedAt).toLocaleString("vi-VN")
                                : "—"}
                            </td>
                            <td>
                              {(s.status === "ARRIVED" ||
                                s.status === "DELIVERED") && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-rust"
                                  onClick={() =>
                                    openReport(s.shipmentId ?? s.id)
                                  }
                                >
                                  ⚠ Báo sự cố
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className={`page ${activePage === "settings" ? "on" : ""}`}
              id="page-settings"
            >
              <div style={{ maxWidth: 660 }}>
                <div className="card">
                  <div className="card-hd">
                    <div className="card-title">
                      <div
                        className="card-icon"
                        style={{ background: "var(--sage-bg)" }}
                      >
                        <Store size={13} style={{ color: "var(--sage)" }} />
                      </div>
                      Thông tin cửa hàng
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setProfileEditing(!profileEditing)}
                    >
                      {profileEditing ? "Hủy" : "Sửa thông tin"}
                    </button>
                  </div>
                  <div className="card-body">
                    {!profileEditing ? (
                      <div className="profile-grid">
                        <div className="pf-item">
                          <div className="pf-label">Tên cửa hàng</div>
                          <div className="pf-val">
                            {storeProfile.name || "—"}
                          </div>
                        </div>
                        <div className="pf-item">
                          <div className="pf-label">Số điện thoại</div>
                          <div className="pf-val mono">
                            {storeProfile.phone || "—"}
                          </div>
                        </div>
                        <div
                          className="pf-item"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <div className="pf-label">Địa chỉ</div>
                          <div className="pf-val">
                            {storeProfile.address || "—"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="fg">
                          <label>Tên cửa hàng</label>
                          <input
                            value={storeProfile.name}
                            onChange={(e) =>
                              setStoreProfile((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            placeholder="VD: CH Tên Mới"
                          />
                        </div>
                        <div className="fg">
                          <label>Địa chỉ</label>
                          <input
                            value={storeProfile.address}
                            onChange={(e) =>
                              setStoreProfile((p) => ({
                                ...p,
                                address: e.target.value,
                              }))
                            }
                            placeholder="VD: 123 Lộ Mới"
                          />
                        </div>
                        <div className="fg">
                          <label>Số điện thoại</label>
                          <input
                            value={storeProfile.phone}
                            onChange={(e) =>
                              setStoreProfile((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="0987654321"
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setProfileEditing(false)}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="btn btn-sage"
                            disabled={storeProfileSaving}
                            onClick={saveProfile}
                          >
                            {storeProfileSaving ? "Đang lưu…" : "Lưu thay đổi"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div
        className={`overlay ${panel ? "on" : ""}`}
        onClick={closePanel}
        role="presentation"
      />
      {panel === "checkout" && (
        <div className="spanel on">
          <div className="sp-head">
            <div>
              <div className="sp-title">Chốt đơn hàng</div>
            </div>
            <button type="button" className="sp-close" onClick={closePanel}>
              ✕
            </button>
          </div>
          <div className="sp-body">
            <div className="ck-sum">
              {cart.map((i) => (
                <div key={i.id} className="ck-row">
                  <span>
                    {i.name} ×{i.quantity}
                  </span>
                  <span>{fmt((i.price ?? 0) * (i.quantity ?? 0))}</span>
                </div>
              ))}
              <div className="ck-total">
                <span className="ck-total-lbl">Tổng tiền</span>
                <span className="ck-total-val">
                  {fmt(
                    cart.reduce(
                      (s, i) => s + (i.price ?? 0) * (i.quantity ?? 0),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
            <div className="sec-label" style={{ marginBottom: 10 }}>
              Loại đơn hàng
            </div>
            <div className="ot-grid">
              <div
                className={`ot-opt ${checkoutOrderType === "STANDARD" ? "sel" : ""}`}
                onClick={() => setCheckoutOrderType("STANDARD")}
              >
                <div className="ot-title">📦 Đơn thường</div>
                <div className="ot-desc">Giao trong ngày làm việc</div>
              </div>
              <div
                className={`ot-opt urgent ${checkoutOrderType === "URGENT" ? "sel" : ""}`}
                onClick={() => setCheckoutOrderType("URGENT")}
              >
                <div className="ot-title">⚡ Đơn khẩn</div>
                <div className="ot-desc">Ưu tiên giao sớm nhất</div>
              </div>
            </div>
            <div className="fg">
              <label>Ghi chú</label>
              <textarea
                value={checkoutNote}
                onChange={(e) => setCheckoutNote(e.target.value)}
                placeholder="VD: Giao cẩn thận tránh móp hộp"
              />
            </div>
          </div>
          <div className="sp-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closePanel}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-amber"
              onClick={doCheckout}
            >
              Xác nhận chốt đơn
            </button>
          </div>
        </div>
      )}
      {panel === "quickOrder" && (
        <div className="spanel on">
          <div className="sp-head">
            <div>
              <div className="sp-title">Tạo đơn nhanh</div>
            </div>
            <button type="button" className="sp-close" onClick={closePanel}>
              ✕
            </button>
          </div>
          <div className="sp-body">
            <div className="sec-label">
              Sản phẩm đặt{" "}
              <button
                type="button"
                className="btn btn-xs"
                onClick={() =>
                  setQuickOrderItems((prev) => [
                    ...prev,
                    { productId: "", quantity: 1 },
                  ])
                }
              >
                + Thêm dòng
              </button>
            </div>
            {quickOrderItems.map((row, idx) => (
              <div key={idx} className="qoi">
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>{idx === 0 ? "Sản phẩm" : ""}</label>
                  <select
                    value={row.productId}
                    onChange={(e) =>
                      setQuickOrderItems((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, productId: e.target.value } : r,
                        ),
                      )
                    }
                  >
                    <option value="">-- Chọn --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id ?? p.productId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label>{idx === 0 ? "Số lượng" : ""}</label>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      setQuickOrderItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                quantity: parseInt(e.target.value, 10) || 1,
                              }
                            : r,
                        ),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-rust"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() =>
                    setQuickOrderItems((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="fg">
              <label>Ngày giao hàng</label>
              <input
                type="date"
                value={quickOrderDeliveryDate}
                onChange={(e) => setQuickOrderDeliveryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="sep" />
            <div className="sec-label">Loại đơn hàng</div>
            <div className="ot-grid">
              <div
                className={`ot-opt ${quickOrderType === "STANDARD" ? "sel" : ""}`}
                onClick={() => setQuickOrderType("STANDARD")}
              >
                <div className="ot-title">📦 Đơn thường</div>
                <div className="ot-desc">Giao trong ngày làm việc</div>
              </div>
              <div
                className={`ot-opt urgent ${quickOrderType === "URGENT" ? "sel" : ""}`}
                onClick={() => setQuickOrderType("URGENT")}
              >
                <div className="ot-title">⚡ Đơn khẩn</div>
                <div className="ot-desc">Ưu tiên giao sớm nhất</div>
              </div>
            </div>
            <div className="fg">
              <label>Ghi chú đơn</label>
              <textarea
                value={quickOrderNote}
                onChange={(e) => setQuickOrderNote(e.target.value)}
                placeholder="Ghi chú tùy chọn..."
              />
            </div>
          </div>
          <div className="sp-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closePanel}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-amber"
              onClick={doQuickOrder}
            >
              Tạo đơn hàng
            </button>
          </div>
        </div>
      )}
      {panel === "report" && reportShipmentId && (
        <div className="spanel on">
          <div className="sp-head">
            <div>
              <div className="sp-title">Báo cáo sự cố</div>
            </div>
            <button type="button" className="sp-close" onClick={closePanel}>
              ✕
            </button>
          </div>
          <div className="sp-body">
            <div className="ibox danger">
              Ghi lại hàng <strong>thiếu hoặc hỏng</strong> — thông tin sẽ được
              gửi về kho
            </div>
            <div className="sec-label">Kiểm tra từng sản phẩm</div>
            {reportItems.map((r, idx) => (
              <div key={idx} className="rpt-item">
                <div className="rpt-name">{r.productName}</div>
                <div className="rpt-row">
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label>Số lượng nhận được</label>
                    <input
                      type="number"
                      min={0}
                      value={r.receivedQuantity}
                      onChange={(e) =>
                        setReportItems((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  receivedQuantity:
                                    parseInt(e.target.value, 10) || 0,
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="fg" style={{ marginTop: 8, marginBottom: 0 }}>
                  <label>Ghi chú</label>
                  <input
                    value={r.note}
                    onChange={(e) =>
                      setReportItems((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, note: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="VD: Rớt 5 hộp trên đường..."
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="sp-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closePanel}
            >
              Hủy
            </button>
            <button type="button" className="btn btn-rust" onClick={doReport}>
              Gửi báo cáo
            </button>
          </div>
        </div>
      )}
      {panel === "orderDetail" && (orderDetailData || orderDetail) && (
        <div className="spanel on">
          <div className="sp-head">
            <div>
              <div className="sp-title">Chi tiết đơn hàng</div>
            </div>
            <button type="button" className="sp-close" onClick={closePanel}>
              ✕
            </button>
          </div>
          <div className="sp-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: "var(--parchment)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 9,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink4)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Mã đơn
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                  {(orderDetailData || orderDetail).id}
                </div>
              </div>
              <div
                style={{
                  background: "var(--parchment)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 9,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink4)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Trạng thái
                </div>
                {badge((orderDetailData || orderDetail).status)}
              </div>
            </div>
            <div className="sec-label">Sản phẩm trong đơn</div>
            {((orderDetailData || orderDetail).items || []).map((item, idx) => (
              <div key={idx} className="od-item">
                <div>
                  <div className="od-item-name">{item.name}</div>
                  <div className="od-item-qty">×{item.quantity}</div>
                </div>
                <div className="od-item-price">
                  {fmt((item.price ?? 0) * (item.quantity ?? 0))}
                </div>
              </div>
            ))}
            <div className="sep" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 700, color: "var(--ink2)" }}
              >
                Tổng cộng
              </span>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--amber)",
                }}
              >
                {fmt((orderDetailData || orderDetail).total)}
              </span>
            </div>
          </div>
          <div className="sp-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closePanel}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className={`toast ${toast.show ? "on" : ""}`}>
        <span className="toast-dot" style={{ background: toast.color }} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
};

export default FranchiseStorePage;
