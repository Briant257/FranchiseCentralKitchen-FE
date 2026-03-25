import React, { useState, useEffect } from "react";
import {
  Package,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "../../components/icons/Icons";
import "../../styles/store-manager.css";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import api from "../../services/api";

const TABS = {
  DISPATCH: "Điều phối đơn",
  ACTIVE: "Chuyến đang chạy",
  HISTORY: "Lịch sử chuyến",
};

const PAGE_META = {
  [TABS.DISPATCH]: {
    title: "Đơn chờ bốc xếp",
    crumb: "Điều phối đơn",
    iconBg: "#fef2f2",
    iconStroke: "#dc2626",
  },
  [TABS.ACTIVE]: {
    title: "Chuyến đang chạy",
    crumb: "Đang chạy",
    iconBg: "#fdf3e0",
    iconStroke: "#d4860a",
  },
  [TABS.HISTORY]: {
    title: "Lịch sử chuyến",
    crumb: "Lịch sử",
    iconBg: "#eef5f1",
    iconStroke: "#4a7c5f",
  },
};

const SupplyCoordinatorPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);

  const [activeTab, setActiveTab] = useState(TABS.DISPATCH);
  const [loading, setLoading] = useState(false);

  const [readyOrders, setReadyOrders] = useState([]);
  const [activeShipments, setActiveShipments] = useState([]);
  const [historyShipments, setHistoryShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, activeRes, historyRes, driversRes] = await Promise.all([
        api.getReadyOrders(),
        api.getActiveShipments(),
        api.getHistoryShipments(),
        api.getDriverList(),
      ]);

      setReadyOrders(ordersRes);
      setActiveShipments(activeRes);
      setHistoryShipments(historyRes);
      setDrivers(driversRes);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Coordinator:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const handleManualAllocate = async () => {
    if (selectedOrders.length === 0) return alert("Vui lòng chọn ít nhất 1 đơn hàng để gom!");
    try {
      await api.manualAllocateRoutes(selectedOrders);
      alert("Gom xe bằng tay thành công!");
      setSelectedOrders([]);
      fetchAllData();
    } catch (error) {
      alert(error.message || "Lỗi khi gom xe bằng tay");
    }
  };

  const handleAssignDriver = async (shipmentId) => {
    const driverId = selectedDrivers[shipmentId];
    if (!driverId) return alert("Vui lòng chọn tài xế trước khi gán!");
    try {
      await api.assignDriver(shipmentId, driverId);
      alert("Đã gán tài xế thành công!");
      fetchAllData();
    } catch (error) {
      alert(error.message || "Lỗi khi gán tài xế");
    }
  };

  const handleMarkDelivered = async (shipmentId) => {
    if (!window.confirm("Xác nhận xe đã tới nơi an toàn?")) return;
    try {
      await api.markShipmentDelivered(shipmentId);
      alert("Đã cập nhật trạng thái xe tới nơi!");
      fetchAllData();
    } catch (error) {
      alert(error.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleViewDetails = async (shipmentId) => {
    try {
      const details = await api.getShipmentDetails(shipmentId);
      setShipmentDetails(details);
      setShowDetailsModal(true);
    } catch (error) {
      alert(error.message || "Lỗi khi lấy chi tiết chuyến xe");
    }
  };

  const sid = (s) => s.shipmentId || s.id || s.shipment_id;
  const oid = (o) => o.orderId || o.id || o.order_id;

  // THÊM HÀM NÀY VÀO ĐÂY: Dò tìm tên thật của tài xế dựa trên ID/Username
  const getDriverDisplayName = (shipment) => {
    const rawValue = shipment.driverName || shipment.driver || shipment.driver_name || shipment.driverId || shipment.driver_id;
    if (!rawValue) return "Đã phân công";

    // Tìm trong mảng drivers đã tải xem có ai khớp không
    const matchedDriver = drivers.find(d => 
      d.accountId === rawValue || 
      d.id === rawValue || 
      d.user_id === rawValue ||
      d.username === rawValue
    );

    // Nếu tìm thấy, ưu tiên trả về tên đầy đủ. Nếu không, in ra rawValue (coord)
    if (matchedDriver) {
      return matchedDriver.fullName || matchedDriver.name || matchedDriver.full_name || matchedDriver.username;
    }
    return rawValue;
  };

  const meta = PAGE_META[activeTab] || PAGE_META[TABS.DISPATCH];

  let topbarIcon = <FileText size={16} style={{ color: meta.iconStroke }} />;
  if (activeTab === TABS.ACTIVE)
    topbarIcon = <Package size={16} style={{ color: meta.iconStroke }} />;
  else if (activeTab === TABS.HISTORY)
    topbarIcon = <CheckCircle size={16} style={{ color: meta.iconStroke }} />;

  if (loading && readyOrders.length === 0 && activeShipments.length === 0) {
    return (
      <div className="sm-page">
        <div
          className="layout"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "var(--ink3)", fontWeight: 600 }}>Đang tải dữ liệu điều phối…</p>
        </div>
      </div>
    );
  }

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
              <div className="sb-logo-icon">🚚</div>
              <span className="sb-logo-text">Điều phối</span>
            </div>
            <div className="sb-store-card">
              <div className="sb-store-label">Logistics</div>
              <div className="sb-store-name">Điều phối vận chuyển</div>
              <div className="sb-store-role">{userData?.name ?? userData?.fullName ?? "—"}</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="nav-group-label">Vận chuyển</div>
            <button
              type="button"
              className={`ni ${activeTab === TABS.DISPATCH ? "on" : ""}`}
              onClick={() => setActiveTab(TABS.DISPATCH)}
            >
              <FileText size={15} />
              Điều phối đơn
              {readyOrders.length > 0 && <span className="ni-badge">{readyOrders.length}</span>}
            </button>
            <button
              type="button"
              className={`ni ${activeTab === TABS.ACTIVE ? "on" : ""}`}
              onClick={() => setActiveTab(TABS.ACTIVE)}
            >
              <Package size={15} />
              Chuyến đang chạy
              {activeShipments.length > 0 && (
                <span className="ni-badge">{activeShipments.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`ni ${activeTab === TABS.HISTORY ? "on" : ""}`}
              onClick={() => setActiveTab(TABS.HISTORY)}
            >
              <AlertTriangle size={15} />
              Lịch sử chuyến
            </button>
          </nav>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="tb-page">
              <div className="tb-page-icon" style={{ background: meta.iconBg }}>
                {topbarIcon}
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
                <div className="sc-stripe" style={{ background: "var(--rust)" }} />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Đơn chờ bốc xếp</div>
                  </div>
                  <div className="sc-icon" style={{ background: "var(--rust-bg)" }}>
                    <FileText size={14} style={{ color: "var(--rust)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--rust)" }}>
                  {readyOrders.length}
                </div>
              </div>
              <div className="sc">
                <div className="sc-stripe" style={{ background: "var(--amber)" }} />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Xe đang chạy</div>
                  </div>
                  <div className="sc-icon" style={{ background: "var(--amber-bg)" }}>
                    <Package size={14} style={{ color: "var(--amber)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--amber)" }}>
                  {activeShipments.length}
                </div>
              </div>
              <div className="sc">
                <div className="sc-stripe" style={{ background: "var(--sage)" }} />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Tài xế</div>
                  </div>
                  <div className="sc-icon" style={{ background: "var(--sage-bg)" }}>
                    <CheckCircle size={14} style={{ color: "var(--sage)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--sage)" }}>
                  {drivers.length}
                </div>
              </div>
              <div className="sc">
                <div className="sc-stripe" style={{ background: "var(--slate)" }} />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Chuyến hoàn thành</div>
                  </div>
                  <div className="sc-icon" style={{ background: "var(--slate-bg)" }}>
                    <Clock size={14} style={{ color: "var(--slate)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--slate)" }}>
                  {historyShipments.length}
                </div>
              </div>
            </div>

            {/* Tab: Điều phối đơn */}
            {activeTab === TABS.DISPATCH && (
              <div className="kitchen-tab-body">
                <div className="card">
                  <div className="card-hd">
                    <div>
                      <div className="card-title">Đơn chờ bốc xếp</div>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink3)" }}>
                        Gom đơn lên xe bằng tay để xuất kho
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-amber btn-elevated"
                      onClick={handleManualAllocate}
                      disabled={selectedOrders.length === 0}
                      style={{ opacity: selectedOrders.length === 0 ? 0.55 : 1 }}
                    >
                      <FileText size={15} /> Gom tay ({selectedOrders.length})
                    </button>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "center", width: 56 }}>Chọn</th>
                          <th style={{ textAlign: "center" }}>Mã đơn</th>
                          <th style={{ textAlign: "center" }}>Giao đến cửa hàng</th>
                          <th style={{ textAlign: "center" }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readyOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4}>
                              <div className="empty" style={{ padding: "36px 16px" }}>
                                <p>Không có đơn hàng nào đang chờ</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          readyOrders.map((o) => {
                            const id = oid(o);
                            return (
                              <tr key={id}>
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(id)}
                                    onChange={() => toggleOrderSelection(id)}
                                    aria-label={`Chọn đơn ${id}`}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }} className="mono">
                                  {id}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <span className="tag tag-s">
                                    🏪{" "}
                                    {o.storeName ||
                                      o.store_name ||
                                      o.name ||
                                      o.store ||
                                      o.storeId ||
                                      "Chưa xác định"}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <span
                                    className="tag"
                                    style={{ background: "var(--slate-bg)", color: "var(--slate)" }}
                                  >
                                    {o.status || "READY"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Chuyến đang chạy */}
            {activeTab === TABS.ACTIVE && (
              <div className="kitchen-tab-body">
                {activeShipments.length === 0 ? (
                  <div className="card">
                    <div className="empty">
                      <Package size={40} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                      <p>Không có chuyến hàng nào đang chạy.</p>
                    </div>
                  </div>
                ) : (
                  <div className="kitchen-runs-grid">
                    {activeShipments.map((s) => {
                      const id = sid(s);
                      const hasDriver = Boolean(
                        s.driverId ||
                          s.driver_id ||
                          s.driverName ||
                          s.driver_name ||
                          s.driver ||
                          s.accountId,
                      );
                      return (
                        <div key={id} className="kitchen-run-card" style={{ minHeight: "auto" }}>
                          <div className="kitchen-run-head" style={{ marginBottom: 12 }}>
                            <div
                              className="card-icon"
                              style={{ background: "var(--amber-bg)", color: "var(--amber)" }}
                            >
                              <Package size={18} />
                            </div>
                          </div>
                          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                            {s.storeName ||
                              s.store_name ||
                              s.name ||
                              s.store ||
                              s.destinationStore ||
                              "—"}
                          </h3>
                          <div style={{ flex: 1, marginBottom: 12 }}>
                            {!hasDriver ? (
                              <div className="fg" style={{ marginBottom: 8 }}>
                                <label htmlFor={`drv-${id}`}>Chọn tài xế</label>
                                <select
                                  id={`drv-${id}`}
                                  value={selectedDrivers[id] || ""}
                                  onChange={(e) =>
                                    setSelectedDrivers({ ...selectedDrivers, [id]: e.target.value })
                                  }
                                >
                                  <option value="">— Chọn tài xế —</option>
                                  {drivers.map((d) => (
                                    <option
                                      key={d.accountId || d.id || d.user_id}
                                      value={d.accountId || d.id || d.user_id}
                                    >
                                      {d.fullName || d.name || d.full_name || d.username}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: 0 }}>
                                Tài xế:{" "}
                                <strong style={{ color: "var(--sage)" }}>
  {getDriverDisplayName(s)}
</strong>
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                            {!hasDriver && (
                              <button
                                type="button"
                                className="btn btn-amber btn-sm"
                                style={{ width: "100%" }}
                                onClick={() => handleAssignDriver(id)}
                              >
                                Gán tài xế
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: "100%" }}
                              onClick={() => handleViewDetails(id)}
                            >
                              Chi tiết món
                            </button>
                            <button
                              type="button"
                              className="btn btn-sage btn-sm"
                              style={{ width: "100%" }}
                              onClick={() => handleMarkDelivered(id)}
                            >
                              Xe tới nơi
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Lịch sử */}
            {activeTab === TABS.HISTORY && (
              <div className="kitchen-tab-body">
                {historyShipments.length === 0 ? (
                  <div className="card">
                    <div className="empty">
                      <CheckCircle size={40} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                      <p>Chưa có chuyến hàng nào hoàn thành.</p>
                    </div>
                  </div>
                ) : (
                  <div className="kitchen-runs-grid">
                    {historyShipments.map((s) => {
                      const id = sid(s);
                      const rawTime =
                        s.delivered_at || s.deliveredAt || s.resolved_at || s.resolvedAt;
                      let formattedTime = "Hoàn tất";
                      if (rawTime) {
                        const d = new Date(rawTime);
                        if (!Number.isNaN(d.getTime())) {
                          formattedTime = d.toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        }
                      }
                      return (
                        <div
                          key={id}
                          className="kitchen-run-card"
                          style={{ minHeight: "auto", opacity: 0.95 }}
                        >
                          <div className="kitchen-run-head" style={{ marginBottom: 12 }}>
                            <div
                              className="card-icon"
                              style={{ background: "var(--sage-bg)", color: "var(--sage)" }}
                            >
                              <CheckCircle size={18} />
                            </div>
                          </div>
                          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                            {s.storeName ||
                              s.store_name ||
                              s.name ||
                              s.store ||
                              s.destinationStore ||
                              "—"}
                          </h3>
                          <p style={{ fontSize: 12.5, color: "var(--ink3)", margin: "0 0 4px" }}>
                            Tài xế:{" "}
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
  {getDriverDisplayName(s)}
</span>
                          </p>
                          <p style={{ fontSize: 12.5, color: "var(--ink4)", margin: "0 0 12px" }}>
                            Hoàn tất: {formattedTime}
                          </p>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: "100%", marginTop: "auto" }}
                            onClick={() => handleViewDetails(id)}
                          >
                            Chi tiết →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Chi tiết món trên xe */}
      {showDetailsModal && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="supply-detail-title">
          <div className="sm-modal-box sm-modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-hd">
              <h2 id="supply-detail-title" className="sm-modal-title">
                Chi tiết món trên xe
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="sm-modal-bd" style={{ maxHeight: "min(60vh, 420px)" }}>
              {shipmentDetails ? (
                Array.isArray(shipmentDetails) && shipmentDetails.length > 0 ? (
                  shipmentDetails.map((item, idx) => (
                    <div key={idx} className="sm-bom-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 22 }}>📦</span>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                            {item.product_name || item.productName || "Sản phẩm"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink4)" }}>Số lượng dự kiến giao</div>
                        </div>
                      </div>
                      <span className="mono" style={{ fontWeight: 800, color: "var(--amber)", fontSize: 16 }}>
                        ×{item.expected_quantity || item.expectedQuantity || item.quantity || 0}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: "center", color: "var(--ink4)", margin: 0 }}>Không có dữ liệu món ăn</p>
                )
              ) : (
                <p style={{ textAlign: "center", color: "var(--ink3)", margin: 0 }}>Đang tải…</p>
              )}
            </div>
            <div className="sm-modal-ft">
              <button
                type="button"
                className="btn btn-amber"
                style={{ flex: 1 }}
                onClick={() => setShowDetailsModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCoordinatorPage;
