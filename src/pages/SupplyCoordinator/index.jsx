import React, { useState, useEffect } from "react";
import {
  Package,
  FileText,
  AlertTriangle,
  Clock,
} from "../../components/icons/Icons"; 
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import api from "../../services/api";

const SupplyCoordinatorPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  
  // ==========================================
  // 1. STATE QUẢN LÝ DỮ LIỆU THẬT TỪ API
  // ==========================================
  const [activeTab, setActiveTab] = useState("Điều phối đơn");
  const [loading, setLoading] = useState(false);

  // Data lưu trữ từ API
  const [readyOrders, setReadyOrders] = useState([]);
  const [activeShipments, setActiveShipments] = useState([]);
  const [historyShipments, setHistoryShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // State tương tác UI
  const [selectedOrders, setSelectedOrders] = useState([]); 
  const [selectedDrivers, setSelectedDrivers] = useState({}); 
  
  // State Modal Chi tiết
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState(null);

  // ==========================================
  // 2. FETCH DATA TỔNG HỢP
  // ==========================================
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, activeRes, historyRes, driversRes] = await Promise.all([
        api.getReadyOrders(), 
        api.getActiveShipments(),
        api.getHistoryShipments(),
        api.getDriverList()
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

  // ==========================================
  // 3. CÁC HÀM XỬ LÝ
  // ==========================================

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
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

  // ==========================================
  // 4. GIAO DIỆN CHÍNH
  // ==========================================

  if (loading && readyOrders.length === 0)
    return (
      <div className="ck-root ck-min-h-screen ck-bg-black ck-flex ck-items-center ck-justify-center">
        <p className="ck-text-red-500 ck-font-black ck-animate-pulse">
          ĐANG KẾT NỐI HỆ THỐNG LOGISTICS...
        </p>
      </div>
    );

  return (
    <div className="ck-supply-coordinator-root">
      <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6" style={{ position: "relative" }}>
        <div className="ck-grain" />

        {/* HEADER */}
        <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-50 ck-pb-4 ck-border-b ck-border-gray-800">
          <div className="ck-flex ck-items-center ck-gap-4">
            <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
              <Package className="ck-text-white" size={32} />
            </div>
            <div>
              <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight">Supply Coordinator</h1>
              <p className="ck-text-xs ck-text-red-400 ck-font-bold ck-uppercase ck-tracking-widest">
                Hệ thống điều phối 2026
              </p>
            </div>
          </div>

          <div className="ck-flex ck-items-center ck-gap-5">
            <div className="ck-text-right ck-hidden sm:ck-block">
              <p className="ck-text-sm ck-font-bold ck-text-white">{userData?.name || "Điều Phối Viên"}</p>
              <p className="ck-text-xs ck-text-red-400">Trưởng ca Logistics</p>
            </div>
            <HeaderSettingsMenu
              userData={userData}
              showProfile={true}
              onOpenProfile={() => setShowUpdateProfileModal(true)}
              onChangePassword={() => setShowChangePasswordModal(true)}
              onLogout={onLogout}
            />
          </div>
        </header>

        <ChangePasswordModal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
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

        <div className="ck-flex ck-gap-6 ck-relative ck-z-10" style={{ minHeight: "750px" }}>
          
          {/* SIDEBAR */}
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5" style={{ width: "20%", flexShrink: 0 }}>
            <ul className="ck-space-y-2 ck-flex-1" style={{ listStyleType: "none", padding: 0 }}>
              {[
                { name: "Điều phối đơn", icon: <FileText size={18} />, count: readyOrders.length },
                { name: "Chuyến đang chạy", icon: <Package size={18} />, count: activeShipments.length },
                { name: "Lịch sử chuyến", icon: <AlertTriangle size={18} /> },
              ].map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => setActiveTab(item.name)}
                    className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ck-flex ck-items-center ck-justify-between ${
                      activeTab === item.name
                        ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg"
                        : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
                    }`}
                    style={{ border: "none", background: activeTab === item.name ? "" : "transparent" }}
                  >
                    <div className="ck-flex ck-items-center ck-gap-3">
                      {item.icon} {item.name}
                    </div>
                    {item.count > 0 && (
                      <span className="ck-text-[10px] ck-bg-black/30 ck-px-2 ck-py-0.5 ck-rounded-full">{item.count}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT CONTENT */}
          <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6">
            
            {/* STATS CARDS */}
            <div className="ck-grid ck-grid-cols-4 ck-gap-4">
              {[
                { label: "Đơn chờ bốc xếp", value: readyOrders.length, color: "ck-text-red-400" },
                { label: "Xe đang chạy", value: activeShipments.length, color: "ck-text-orange-400" },
                { label: "Tài xế sẵn sàng", value: drivers.length, color: "ck-text-green-400" },
                { label: "Chuyến hoàn thành", value: historyShipments.length, color: "ck-text-blue-400" },
              ].map((stat, idx) => (
                <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center">
                  <h4 className="ck-text-xs ck-font-semibold ck-text-gray-400 ck-mb-2 uppercase tracking-tighter">{stat.label}</h4>
                  <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* TAB 1: ĐIỀU PHỐI ĐƠN */}
            {activeTab === "Điều phối đơn" && (
              <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-animate-fade-in">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <div>
                    <h3 className="ck-text-xl ck-font-bold ck-text-white">Đơn Chờ Bốc Xếp</h3>
                    <p className="ck-text-xs ck-text-gray-500 mt-1">Gom đơn hàng lên xe bằng tay để xuất kho</p>
                  </div>
                  <div className="ck-flex ck-gap-3">
                    <button
                      onClick={handleManualAllocate}
                      disabled={selectedOrders.length === 0}
                      className={`ck-btn ck-px-6 ck-py-2.5 ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2 ck-border-none ck-shadow-lg ${
                        selectedOrders.length > 0 ? "ck-bg-gradient-btn-admin ck-text-white hover:ck-opacity-90" : "ck-bg-gray-800 ck-text-gray-600"
                      }`}
                    >
                      <FileText size={18} /> Gom tay ({selectedOrders.length})
                    </button>
                  </div>
                </div>
                <div className="ck-p-4">
                  <table className="ck-w-full ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs ck-uppercase">
                      <tr>
                        <th className="ck-py-4 ck-px-6 ck-text-center">Chọn</th>
                        <th className="ck-py-4 ck-px-6 ck-text-center">Mã Đơn</th>
                        <th className="ck-py-4 ck-px-6 ck-text-center">Cửa hàng</th>
                        <th className="ck-py-4 ck-px-6 ck-text-center">Trạng thái</th>
                        {/* Đã xóa cột Tổng tiền ở đây */}
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {readyOrders.length === 0 ? (
                        <tr><td colSpan="4" className="ck-text-center ck-py-10 ck-text-gray-500">Không có đơn hàng nào đang chờ</td></tr>
                      ) : (
                        readyOrders.map((o) => (
                          <tr key={o.orderId || o.id || o.order_id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800/50 ck-transition-colors">
                            <td className="ck-py-4 ck-px-6 ck-text-center">
                              <input 
                                type="checkbox" 
                                className="ck-accent-red-500 ck-w-4 ck-h-4"
                                checked={selectedOrders.includes(o.orderId || o.id || o.order_id)}
                                onChange={() => toggleOrderSelection(o.orderId || o.id || o.order_id)}
                              />
                            </td>
                            <td className="ck-py-4 ck-px-6 ck-font-mono ck-text-red-400 ck-font-bold ck-text-center">{o.orderId || o.id || o.order_id}</td>
                            <td className="ck-py-4 ck-px-6 ck-font-bold ck-text-center">{o.storeName || o.store || o.store_id || "KFC Store"}</td>
                            <td className="ck-py-4 ck-px-6 ck-text-center">
                              <div className="ck-flex ck-items-center ck-justify-center ck-gap-2">
                                <Clock size={14} className="ck-text-blue-400" />
                                <span className="ck-font-medium">{o.status || "READY"}</span>
                              </div>
                            </td>
                            {/* Đã xóa data Tổng tiền ở đây */}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CHUYẾN ĐANG CHẠY */}
            {activeTab === "Chuyến đang chạy" && (
              <div className="ck-space-y-6 ck-animate-fade-in">
                <div className="ck-flex ck-justify-between ck-items-center">
                  <h3 className="ck-text-xl ck-font-bold">Quản lý lộ trình Logistics</h3>
                  <button onClick={fetchAllData} className="ck-bg-gray-800 ck-text-white ck-px-4 ck-py-2 ck-rounded-lg ck-border-none hover:ck-bg-gray-700">
                    ↻ Làm mới
                  </button>
                </div>
                <div className="ck-grid ck-grid-cols-2 ck-gap-6">
                  {activeShipments.length === 0 ? (
                    <p className="ck-text-gray-500 ck-col-span-2">Không có chuyến hàng nào đang chạy.</p>
                  ) : (
                    activeShipments.map((s) => (
                      <div key={s.shipmentId || s.id || s.shipment_id} className="ck-bg-gray-900 ck-border-l-4 ck-border-l-orange-500 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl">
                        <div className="ck-flex ck-justify-between ck-mb-4">
                          <span className="ck-text-orange-400 ck-font-mono font-bold">{s.shipmentId || s.id || s.shipment_id}</span>
                          <span className="ck-text-xs ck-bg-orange-500/20 ck-text-orange-400 ck-px-2 ck-py-1 ck-rounded-lg">
                            {s.status || "ACTIVE"}
                          </span>
                        </div>
                        <div className="ck-space-y-3 ck-text-sm ck-text-gray-400">
                          {!s.driverId && !s.driverName && !s.driver_name ? (
                            <div className="ck-flex ck-flex-col ck-gap-2">
                              <select 
                                className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-lg ck-p-2 ck-text-white ck-outline-none"
                                value={selectedDrivers[s.shipmentId || s.id || s.shipment_id] || ""}
                                onChange={(e) => setSelectedDrivers({...selectedDrivers, [s.shipmentId || s.id || s.shipment_id]: e.target.value})}
                              >
                                <option value="">-- Chọn tài xế để gán --</option>
                                {drivers.map(d => (
                                  <option key={d.accountId || d.id || d.user_id} value={d.accountId || d.id || d.user_id}>
                                    {d.fullName || d.name || d.full_name || d.username}
                                  </option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleAssignDriver(s.shipmentId || s.id || s.shipment_id)}
                                className="ck-w-full ck-py-2 ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-rounded-lg ck-font-bold ck-border-none"
                              >
                                Xác nhận gán tài xế
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="ck-flex ck-justify-between">
                                <span>Tài xế:</span> <span className="ck-text-white">{s.driverName || s.driver || s.driver_name || "Chưa rõ"}</span>
                              </p>
                              <p className="ck-flex ck-justify-between">
                                <span>Biển số:</span> <span className="ck-text-white">{s.plate || s.vehicle_plate || "Chưa có"}</span>
                              </p>
                            </>
                          )}
                          <p className="ck-flex ck-justify-between">
                            <span>Số lượng đơn:</span> <span className="ck-text-white">{s.orderCount || s.orders?.length || 0} đơn</span>
                          </p>
                        </div>
                        <div className="ck-flex ck-gap-2 ck-mt-6">
                          <button 
                            onClick={() => handleViewDetails(s.shipmentId || s.id || s.shipment_id)}
                            className="ck-flex-1 ck-py-2.5 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border-none"
                          >
                            Chi tiết món
                          </button>
                          
                          <button 
                            onClick={() => handleMarkDelivered(s.shipmentId || s.id || s.shipment_id)}
                            className="ck-flex-1 ck-py-2.5 ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-rounded-xl ck-font-bold ck-border-none"
                          >
                            Xe Tới Nơi
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LỊCH SỬ CHUYẾN HÀNG */}
            {activeTab === "Lịch sử chuyến" && (
              <div className="ck-space-y-6 ck-animate-fade-in">
                <h3 className="ck-text-xl ck-font-bold">Lịch sử điều phối</h3>
                <div className="ck-grid ck-grid-cols-2 ck-gap-6">
                  {historyShipments.length === 0 ? (
                    <p className="ck-text-gray-500 ck-col-span-2">Chưa có chuyến hàng nào hoàn thành.</p>
                  ) : (
                    historyShipments.map((s) => (
                      <div key={s.shipmentId || s.id || s.shipment_id} className="ck-bg-gray-900 ck-border-l-4 ck-border-l-green-500 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl ck-opacity-70">
                        <div className="ck-flex ck-justify-between ck-mb-4">
                          <span className="ck-text-green-400 ck-font-mono font-bold">{s.shipmentId || s.id || s.shipment_id}</span>
                          <span className="ck-text-xs ck-bg-green-500/20 ck-text-green-400 ck-px-2 ck-py-1 ck-rounded-lg">
                            {s.status || "DELIVERED"}
                          </span>
                        </div>
                        <div className="ck-space-y-2 ck-text-sm ck-text-gray-400">
                          <p className="ck-flex ck-justify-between">
                            <span>Tài xế:</span> <span className="ck-text-white">{s.driverName || s.driver || s.driver_name || "N/A"}</span>
                          </p>
                          <p className="ck-flex ck-justify-between">
                            <span>Thời gian xong:</span> <span className="ck-text-white">{s.deliveredAt || s.resolved_at || "Hoàn tất"}</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => handleViewDetails(s.shipmentId || s.id || s.shipment_id)}
                          className="ck-w-full ck-mt-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border-none"
                        >
                          Xem lại chi tiết
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT MÓN TRÊN XE */}
      {showDetailsModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-2xl ck-shadow-2xl ck-animate-fade-in">
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between ck-items-center">
             <h3 className="ck-text-xl ck-font-black ck-text-white">
                Chi tiết món trên xe
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button>
            </div>
            
            <div className="ck-p-6 ck-max-h-[60vh] ck-overflow-y-auto">
              {shipmentDetails ? (
                <div className="ck-space-y-3">
                  {Array.isArray(shipmentDetails) && shipmentDetails.length > 0 ? (
                    shipmentDetails.map((item, idx) => (
                      <div key={idx} className="ck-flex ck-justify-between ck-items-center ck-p-4 ck-bg-gray-800 hover:ck-bg-gray-750 ck-rounded-xl ck-border ck-border-gray-700 ck-transition-all">
                        <div className="ck-flex ck-items-center ck-gap-4">
                          <div className="ck-w-12 ck-h-12 ck-bg-gray-900 ck-rounded-lg ck-flex ck-items-center ck-justify-center ck-text-2xl ck-border ck-border-gray-600">
                            📦
                          </div>
                          <div>
                            <p className="ck-font-bold ck-text-white ck-text-base">
                              {item.product_name || item.productName || "Sản phẩm không tên"}
                            </p>
                            <p className="ck-text-xs ck-text-gray-400 ck-mt-1">Số lượng dự kiến giao</p>
                          </div>
                        </div>
                        <div className="ck-text-2xl ck-font-black ck-text-orange-400">
                          x{item.expected_quantity || item.expectedQuantity || item.quantity || 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="ck-text-center ck-text-gray-500 ck-py-8">Không có dữ liệu món ăn</p>
                  )}
                </div>
              ) : (
                <div className="ck-flex ck-justify-center ck-py-10">
                  <p className="ck-text-gray-500 ck-animate-pulse">Đang tải dữ liệu...</p>
                </div>
              )}
            </div>

            <div className="ck-p-6 ck-bg-gray-800/30 ck-rounded-b-3xl">
              <button onClick={() => setShowDetailsModal(false)} className="ck-w-full ck-py-3 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors">
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