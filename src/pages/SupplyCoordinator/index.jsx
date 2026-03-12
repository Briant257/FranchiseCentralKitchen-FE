import React, { useState, useEffect, useCallback } from "react";
import { LogOut, Package, AlertTriangle, Activity, Plus, FileText, Clock, CheckCircle } from "../../components/icons/Icons";

const SupplyCoordinatorPage = ({ onLogout, userData }) => {
  const [activeTab, setActiveTab] = useState("Hàng chờ bốc xếp");
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  
  // State Modal Xem chi tiết
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState([]);

  // State Modal GIẢ LẬP STORE MANAGER BÁO LỖI
  const [showDemoReportModal, setShowDemoReportModal] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [reportItems, setReportItems] = useState([]);
  const [generalNote, setGeneralNote] = useState("");

  const [orders, setOrders] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allocationConfig, setAllocationConfig] = useState({ maxOrdersPerTrip: 10, maxUrgentPerTrip: 2 });

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("ck_token");
      const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const [ordersRes, shipmentsRes, incidentsRes, historyRes] = await Promise.all([
        fetch("http://localhost:8081/api/logistics/orders/ready", { headers: authHeaders }).catch(() => ({ ok: false })),
        fetch("http://localhost:8081/api/shipments/active", { headers: authHeaders }).catch(() => ({ ok: false })), 
        fetch("http://localhost:8081/api/incidents/pending", { headers: authHeaders }).catch(() => ({ ok: true, json: async () => [] })),
        fetch("http://localhost:8081/api/shipments/history", { headers: authHeaders }).catch(() => ({ ok: true, json: async () => [] }))
      ]);

      setOrders(ordersRes.ok ? await ordersRes.json() : []);
      setShipments(shipmentsRes.ok ? await shipmentsRes.json() : []);
      
      const rawIncidents = incidentsRes.ok ? await incidentsRes.json() : [];
      const realIncidents = rawIncidents.filter(inc => {
        const text = (inc.issue_description || inc.issue || "").replace(/['"]/g, '').trim();
        return text !== "Đủ hàng" && text !== "Đủ hàng "; 
      });
      setIncidents(realIncidents); 

      setHistoryOrders(historyRes.ok ? await historyRes.json() : []);
    } catch (error) { console.error("Lỗi:", error.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleConfirmShipment = async () => {
    if (orders.length === 0) {
      alert("⚠️ Không có đơn hàng nào đang chờ để phân bổ!");
      setShowShipmentModal(false);
      return; 
    }

    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch("http://localhost:8081/api/logistics/orders/allocate-routes", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ maxOrdersPerTrip: parseInt(allocationConfig.maxOrdersPerTrip), maxUrgentPerTrip: parseInt(allocationConfig.maxUrgentPerTrip) }),
      });
      if (res.ok) { alert("🎉 Phân bổ tuyến thành công!"); setShowShipmentModal(false); fetchAllData(); } else alert("Không có đơn chờ!");
    } catch (e) { alert("Lỗi kết nối!"); }
  };

  const handleAcceptDelivery = async (shipmentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn nhận giao chuyến xe này?")) return;
    
    const currentUserId = userData?.id || userData?.account_id; 
    if (!currentUserId) {
      return alert("Không tìm thấy thông tin tài khoản của bạn. Vui lòng đăng nhập lại!");
    }

    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/logistics/orders/${shipmentId}/assign`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: currentUserId, vehiclePlate: "Xe Nội Bộ" }),
      });
      if (res.ok) { alert(`Đã nhận chuyến thành công! Lên đường thôi!`); fetchAllData(); } else { const err = await res.json(); alert("Lỗi: " + err.message); }
    } catch (e) { alert("Lỗi kết nối!"); }
  };

  const handleMarkAsDelivered = async (shipmentId) => {
    if (!window.confirm(`Xác nhận chuyến xe ${shipmentId} đã tới nơi?`)) return;
    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/shipments/${shipmentId}/delivered`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { alert("Tài xế đã báo tới nơi!"); fetchAllData(); } else alert("Lỗi cập nhật!");
    } catch (e) { alert("Lỗi kết nối."); }
  };

  const handleViewDetails = async (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/shipments/${shipmentId}/details`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setShipmentDetails(await res.json()); setShowDetailsModal(true); } else alert("Lỗi tải chi tiết!");
    } catch (e) { alert("Lỗi kết nối."); }
  };

  const openDemoReportModal = async (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    setGeneralNote("");
    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/shipments/${shipmentId}/details`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const initialReport = data.map(item => ({
          productId: item.product_id, productName: item.product_name, expectedQuantity: item.expected_quantity,
          receivedQuantity: item.expected_quantity, note: ""
        }));
        setReportItems(initialReport); setShowDemoReportModal(true);
      }
    } catch (e) { alert("Lỗi kết nối."); }
  };

  const submitDemoReport = async () => {
    let hasDiscrepancy = false;

    const payloadItems = reportItems.map(item => {
      const expected = parseInt(item.expectedQuantity);
      const received = parseInt(item.receivedQuantity);
      
      let finalNote = "";

      if (received !== expected) {
        hasDiscrepancy = true;
        let autoNote = received < expected ? `Thiếu ${expected - received}` : `Dư ${received - expected}`;
        finalNote = autoNote; 
      } else {
        finalNote = "Đủ hàng";
      }

      return {
        productId: item.productId, 
        receivedQuantity: received,
        note: finalNote
      };
    });

    if (generalNote.trim() !== "" && payloadItems.length > 0) {
        payloadItems[0].note = payloadItems[0].note + ` | Ghi chú chung: ${generalNote}`;
    }

    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/shipments/${selectedShipmentId}/report`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ reportedItems: payloadItems })
      });
      
      if (res.ok) { 
        alert(hasDiscrepancy ? "Đã gửi báo cáo sự cố về Bếp Trung Tâm xử lý!" : "Store Manager đã chốt kiểm hàng thành công!"); 
        setShowDemoReportModal(false); 
        fetchAllData(); 
      } else {
        const err = await res.json();
        alert("Lỗi khi gửi báo cáo: " + err.message); 
      }
    } catch (e) { alert("Lỗi kết nối máy chủ."); }
  };

  const handleResolveIncident = async (shipmentId) => {
    if(!shipmentId) return alert("Không tìm thấy mã chuyến xe gốc để bù!");
    if(!window.confirm("Bạn có chắc chắn muốn tạo đơn Giao Bù cho sự cố này?")) return;
    try {
      const token = localStorage.getItem("ck_token");
      const res = await fetch(`http://localhost:8081/api/shipments/${shipmentId}/resolve-replacement`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if(res.ok) { alert("✅ Đã tạo lệnh Giao Bù thành công!"); fetchAllData(); } else { const err = await res.json(); alert("Lỗi tạo đơn bù: " + err.message); }
    } catch (e) { alert("Lỗi kết nối máy chủ."); }
  };

  if (loading) return <div className="ck-root ck-min-h-screen ck-bg-black ck-flex ck-items-center ck-justify-center"><p className="ck-text-red-500 ck-font-black ck-animate-pulse">ĐANG KẾT NỐI HỆ THỐNG...</p></div>;

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-10 ck-pb-4 ck-border-b ck-border-gray-800">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20"><Package className="ck-text-white" size={32} /></div>
          <div><h1 className="ck-text-2xl ck-font-black ck-text-white leading-tight">Supply Coordinator</h1><p className="ck-text-xs ck-text-red-400 ck-font-bold uppercase ck-tracking-widest">Hệ thống điều phối thực thời</p></div>
        </div>
        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block"><p className="ck-text-sm ck-font-bold">{userData?.full_name || "Coordinator"}</p><p className="ck-text-xs ck-text-red-400">{userData?.role || "Logistics Manager"}</p></div>
          <button onClick={onLogout} className="ck-btn ck-bg-gradient-btn-admin ck-text-white ck-px-5 ck-py-2.5 ck-rounded-xl ck-font-bold ck-border-none"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="ck-flex ck-gap-6 ck-relative ck-z-10" style={{ minHeight: "700px" }}>
        {/* SIDEBAR */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5" style={{ width: "22%", flexShrink: 0 }}>
          <ul className="ck-space-y-2" style={{ listStyleType: "none", padding: 0 }}>
            {[ 
              { name: "Hàng chờ bốc xếp", icon: <Package size={18} />, count: orders.length }, 
              { name: "Lịch trình vận chuyển", icon: <Activity size={18} />, count: shipments.length }, 
              { name: "Xử lý khiếu nại", icon: <AlertTriangle size={18} />, count: incidents.filter((v, i, a) => a.findIndex(t => (t.shipment_id === v.shipment_id)) === i).length }, 
              { name: "Lịch sử hoạt động", icon: <Clock size={18} />, count: historyOrders.length } 
            ].map((item) => (
              <li key={item.name}>
                <button onClick={() => setActiveTab(item.name)} className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ck-flex ck-items-center ck-justify-between ${activeTab === item.name ? "ck-bg-gradient-btn-admin ck-text-white shadow-lg" : "ck-text-gray-400 hover:ck-bg-gray-800"}`} style={{ border: "none", background: activeTab === item.name ? "" : "transparent" }}>
                  <div className="ck-flex ck-items-center ck-gap-3">{item.icon} {item.name}</div>
                  {item.count > 0 && <span className="ck-text-[10px] ck-bg-black/30 ck-px-2 ck-py-0.5 ck-rounded-full">{item.count}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTENT AREA */}
        <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6">
          {activeTab === "Hàng chờ bốc xếp" && (
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-animate-fade-in">
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between"><h3 className="ck-text-xl ck-font-bold">Đơn hàng sẵn sàng xuất kho</h3><button onClick={() => setShowShipmentModal(true)} className="ck-btn ck-px-6 ck-py-2.5 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none shadow-xl hover:ck-scale-105 ck-transition-transform flex items-center gap-2"><Activity size={18} /> Chạy AI Phân bổ tuyến</button></div>
              <div className="ck-p-4">
                <table className="ck-w-full"><thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs uppercase"><tr><th className="ck-py-4 ck-px-6 ck-text-center">Mã Đơn</th><th className="ck-py-4 ck-px-6 ck-text-center">Cửa hàng</th><th className="ck-py-4 ck-px-6 ck-text-center">Loại</th><th className="ck-py-4 ck-px-6 ck-text-center">Trạng thái</th></tr></thead>
                  <tbody className="ck-text-white ck-text-sm">
                    {orders.length > 0 ? orders.map((o) => (
                      <tr key={o.order_id} className="ck-border-t ck-border-gray-700 ck-text-center hover:ck-bg-gray-800/50">
                        <td className="ck-py-4 ck-px-6 ck-font-mono ck-text-red-400 ck-font-bold">{o.order_id}</td><td className="ck-py-4 ck-px-6 ck-font-bold">{o.store_name || o.store_id}</td>
                        <td className="ck-py-4 ck-px-6"><span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-[10px] ck-font-black ${o.order_type === "COMPENSATION" ? "ck-bg-orange-500/20 ck-text-orange-400" : "ck-bg-blue-500/20 ck-text-blue-400"}`}>{o.order_type}</span></td><td className="ck-py-4 ck-px-6 ck-text-green-400 ck-font-bold">{o.status || 'READY_TO_SHIP'}</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="ck-p-10 ck-text-center ck-text-gray-600">Không có đơn hàng nào chờ xử lý.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Lịch trình vận chuyển" && (
            <div className="ck-grid ck-grid-cols-2 ck-gap-6 ck-animate-fade-in">
              {shipments.length > 0 ? shipments.map((s) => (
                <div key={s.shipment_id} className="ck-bg-gray-900 ck-border-t-4 ck-border-t-red-600 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="ck-flex ck-justify-between ck-mb-6">
                      <span className="ck-text-red-400 ck-font-mono ck-text-lg ck-font-black">{s.shipment_id}</span>
                      <span className={`ck-text-[10px] ck-px-3 ck-py-1 ck-rounded-full ck-font-bold uppercase tracking-widest ${
                        s.status === 'SHIPPING' ? 'ck-bg-yellow-500/20 ck-text-yellow-400' : 
                        s.status === 'DELIVERED' ? 'ck-bg-green-600/20 ck-text-green-400' : 'ck-bg-blue-600/20 ck-text-blue-400'
                      }`}>{s.status}</span>
                    </div>
                    <div className="ck-space-y-3 ck-text-sm">
                      <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-800 ck-pb-2"><span className="ck-text-gray-500">Người đi giao</span><span className="ck-text-white ck-font-bold">{s.driver_name || s.driver || "Chưa nhận"}</span></div>
                    </div>
                  </div>
                  
                  {s.status === 'PENDING' ? (
                    <button onClick={() => handleAcceptDelivery(s.shipment_id)} className="ck-w-full ck-mt-6 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-black ck-border-none shadow-lg shadow-red-900/30 hover:ck-scale-105 ck-transition-transform flex items-center justify-center gap-2">
                      <Package size={18} /> NHẬN GIAO CHUYẾN NÀY
                    </button>
                  ) : s.status === 'SHIPPING' ? (
                    <button onClick={() => handleMarkAsDelivered(s.shipment_id)} className="ck-w-full ck-mt-6 ck-py-3 ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-rounded-xl ck-font-black ck-border-none ck-transition-colors shadow-lg shadow-green-900/30">XÁC NHẬN ĐÃ TỚI NƠI</button>
                  ) : s.status === 'DELIVERED' ? (
                    <button 
                      onClick={() => openDemoReportModal(s.shipment_id)} 
                      className="ck-w-full ck-mt-6 ck-py-3 ck-rounded-xl ck-font-black ck-border-none ck-transition-transform hover:ck-scale-105 flex justify-center items-center gap-2"
                      style={{ backgroundColor: "#e11d48", color: "#ffffff", boxShadow: "0 10px 15px -3px rgba(225, 29, 72, 0.4)" }}
                    >
                      <CheckCircle size={18} /> DEMO: STORE KIỂM HÀNG
                    </button>
                  ) : (
                    <button onClick={() => handleViewDetails(s.shipment_id)} className="ck-w-full ck-mt-6 ck-py-3 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-black ck-border-none ck-transition-colors flex justify-center items-center gap-2"><FileText size={16} /> XEM CHI TIẾT</button>
                  )}
                </div>
              )) : <div className="ck-col-span-2 ck-p-20 ck-text-center ck-text-gray-500 ck-bg-gray-900 ck-rounded-3xl">Hiện không có chuyến xe nào đang hoạt động.</div>}
            </div>
          )}

          {activeTab === "Xử lý khiếu nại" && (
            <div className="ck-space-y-4 ck-animate-fade-in">
              {incidents.length > 0 ? (
                incidents.filter((v, i, a) => a.findIndex(t => (t.shipment_id === v.shipment_id)) === i)
                .map((inc) => (
                <div key={inc.id} className="ck-bg-gray-900 ck-border-l-4 ck-border-l-red-600 ck-border-gray-700 ck-p-6 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div>
                    <div className="ck-flex ck-items-center ck-gap-3 ck-mb-2">
                        <p className="ck-text-xs ck-text-gray-500 uppercase tracking-widest">Mã chuyến xe sự cố: {inc.shipment_id || inc.id}</p>
                        <span className="ck-px-2 ck-py-0.5 ck-bg-red-500/20 ck-text-red-400 ck-rounded-md ck-text-[10px] ck-font-black">CẦN XỬ LÝ</span>
                    </div>
                    <h4 className="ck-text-lg ck-font-black ck-text-white">{inc.store_id || inc.store_name}</h4>
                    
                    <div className="ck-mt-3 ck-bg-gray-800/50 ck-p-3 ck-rounded-lg ck-border ck-border-gray-700">
                        <p className="ck-text-sm ck-text-gray-300 ck-font-bold ck-flex ck-items-center ck-gap-2">
                            <AlertTriangle size={14} className="ck-text-yellow-500" />
                            Nội dung báo cáo:
                        </p>
                        <p className="ck-text-sm ck-text-red-400 ck-mt-1 ck-italic">
                            "{inc.issue_description || inc.issue || inc.note}"
                        </p>
                    </div>
                  </div>
                  <button onClick={() => handleResolveIncident(inc.shipment_id || inc.id)} className="ck-btn ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-px-6 ck-py-2.5 ck-rounded-xl ck-font-black ck-border-none ck-flex ck-items-center ck-gap-2 shadow-lg shadow-orange-900/20"><Plus size={18} /> Tạo đơn Giao bù</button>
                </div>
              ))) : <div className="ck-p-20 ck-text-center ck-text-gray-500 ck-bg-gray-900 ck-rounded-3xl">Tuyệt vời! Không có khiếu nại nào tồn đọng.</div>}
            </div>
          )}

          {activeTab === "Lịch sử hoạt động" && (
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-animate-fade-in">
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between"><h3 className="ck-text-xl ck-font-bold">Nhật ký đơn hàng đã xử lý</h3></div>
              <div className="ck-p-4">
                <table className="ck-w-full"><thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs uppercase"><tr><th className="ck-py-4 ck-px-6 ck-text-center">Mã Đơn</th><th className="ck-py-4 ck-px-6 ck-text-center">Cửa hàng</th><th className="ck-py-4 ck-px-6 ck-text-center">Loại</th><th className="ck-py-4 ck-px-6 ck-text-center">Trạng thái</th></tr></thead>
                  <tbody className="ck-text-white ck-text-sm">
                    {historyOrders.length > 0 ? historyOrders.map((o) => (
                      <tr key={o.order_id} className="ck-border-t ck-border-gray-700 ck-text-center hover:ck-bg-gray-800/50">
                        <td className="ck-py-4 ck-px-6 ck-font-mono ck-text-gray-400">{o.order_id}</td><td className="ck-py-4 ck-px-6 ck-font-bold">{o.store_name || o.store_id}</td>
                        <td className="ck-py-4 ck-px-6"><span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-[10px] ck-font-black ${o.order_type === "COMPENSATION" ? "ck-bg-orange-500/20 ck-text-orange-400" : "ck-bg-blue-500/20 ck-text-blue-400"}`}>{o.order_type}</span></td>
                        <td className="ck-py-4 ck-px-6"><span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-[10px] ck-font-black uppercase tracking-widest ${(o.status === 'DONE' || o.status === 'COMPLETED' || o.status === 'PARTIAL_RECEIVED') ? 'ck-bg-green-600/20 ck-text-green-400' : 'ck-bg-red-600/20 ck-text-red-400'}`}>{o.status}</span></td>
                      </tr>
                    )) : <tr><td colSpan="4" className="ck-p-10 ck-text-center ck-text-gray-600">Chưa có dữ liệu lịch sử đơn hàng.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showShipmentModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-md ck-shadow-2xl ck-animate-fade-in">
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between"><h3 className="ck-text-xl ck-font-black ck-text-white flex items-center gap-2"><Activity size={24} className="text-red-500" /> Cấu hình AI</h3><button onClick={() => setShowShipmentModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button></div>
            <div className="ck-p-8 ck-space-y-6">
              <div className="ck-space-y-4">
                <div><label className="ck-block ck-text-[10px] ck-text-gray-500 uppercase ck-mb-2">Số đơn TỐI ĐA mỗi chuyến</label><select value={allocationConfig.maxOrdersPerTrip} onChange={(e) => setAllocationConfig({ ...allocationConfig, maxOrdersPerTrip: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-border-gray-700 ck-rounded-xl ck-p-3 ck-text-white ck-outline-none focus:ck-border-red-500 ck-cursor-pointer">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (<option key={num} value={num}>{num} đơn</option>))}</select></div>
                <div><label className="ck-block ck-text-[10px] ck-text-gray-500 uppercase ck-mb-2">Số đơn GẤP tối đa</label><select value={allocationConfig.maxUrgentPerTrip} onChange={(e) => setAllocationConfig({ ...allocationConfig, maxUrgentPerTrip: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-border-gray-700 ck-rounded-xl ck-p-3 ck-text-white ck-outline-none focus:ck-border-red-500 ck-cursor-pointer"><option value="1">1 đơn</option><option value="2">2 đơn</option></select></div>
              </div>
              <div className="ck-flex ck-gap-4 ck-pt-4"><button onClick={() => setShowShipmentModal(false)} className="ck-flex-1 ck-py-4 ck-bg-transparent ck-text-gray-500 ck-font-black ck-border-none hover:ck-text-white">HỦY BỎ</button><button onClick={handleConfirmShipment} className="ck-flex-1 ck-py-4 ck-bg-gradient-btn-admin ck-text-white ck-rounded-2xl ck-font-black ck-border-none shadow-xl shadow-red-900/20 hover:ck-scale-105 ck-transition-transform">CHẠY PHÂN BỔ</button></div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-xl ck-shadow-2xl ck-animate-fade-in"><div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between"><h3 className="ck-text-xl ck-font-black ck-text-white flex items-center gap-2"><Package size={24} className="text-green-500" /> Danh sách món ăn</h3><button onClick={() => setShowDetailsModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button></div><div className="ck-p-6"><p className="ck-text-sm ck-text-gray-400 ck-mb-4">Chuyến xe: <span className="ck-text-red-400 ck-font-mono">{selectedShipmentId}</span></p><div className="ck-bg-gray-800 ck-rounded-xl ck-p-2 ck-max-h-60 ck-overflow-y-auto"><table className="ck-w-full ck-text-sm"><thead className="ck-text-gray-400 ck-border-b ck-border-gray-700"><tr><th className="ck-p-3 ck-text-left">Sản phẩm</th><th className="ck-p-3 ck-text-right">Số lượng</th></tr></thead><tbody>{shipmentDetails.length > 0 ? shipmentDetails.map((item, idx) => (<tr key={idx} className="ck-border-b ck-border-gray-700/50 hover:ck-bg-gray-700"><td className="ck-p-3 ck-font-bold">{item.product_name}</td><td className="ck-p-3 ck-text-right ck-text-green-400 ck-font-black">{item.expected_quantity}</td></tr>)) : <tr><td colSpan="2" className="ck-p-6 ck-text-center ck-text-gray-500">Đang tải...</td></tr>}</tbody></table></div></div></div>
        </div>
      )}

      {showDemoReportModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-3xl ck-shadow-2xl ck-animate-fade-in">
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between">
              <div>
                <h3 className="ck-text-xl ck-font-black ck-text-white flex items-center gap-2"><CheckCircle size={24} className="text-blue-500" /> [DEMO] Store Manager Kiểm Hàng</h3>
                <p className="ck-text-xs ck-text-gray-400 ck-mt-1">Nhập số lượng thực nhận. Nếu có sự cố, vui lòng nhập ghi chú bên dưới.</p>
              </div>
              <button onClick={() => setShowDemoReportModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button>
            </div>
            
            <div className="ck-p-6 ck-max-h-[60vh] ck-overflow-y-auto">
              <table className="ck-w-full ck-text-sm ck-mb-6">
                <thead className="ck-text-gray-400 ck-border-b ck-border-gray-700 ck-text-left">
                  <tr>
                    <th className="ck-p-3">Sản phẩm</th>
                    <th className="ck-p-3 ck-text-center">Xuất kho (CK)</th>
                    <th className="ck-p-3 ck-text-center">Thực nhận (Store)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportItems.map((item, idx) => (
                    <tr key={idx} className="ck-border-b ck-border-gray-700/50">
                      <td className="ck-p-3 ck-font-bold">{item.productName}</td>
                      <td className="ck-p-3 ck-text-center ck-text-gray-400">{item.expectedQuantity}</td>
                      <td className="ck-p-3 ck-flex ck-justify-center">
                        <input 
                          type="number" min="0" 
                          value={item.receivedQuantity}
                          onChange={(e) => {
                            const newItems = [...reportItems];
                            newItems[idx].receivedQuantity = e.target.value;
                            setReportItems(newItems);
                          }}
                          className={`ck-w-20 ck-text-center ck-bg-gray-800 ck-border-2 ck-rounded-lg ck-p-2 ck-font-black ck-outline-none 
                            ${parseInt(item.receivedQuantity) < parseInt(item.expectedQuantity) 
                                ? 'ck-border-red-500 ck-text-red-400' 
                                : parseInt(item.receivedQuantity) > parseInt(item.expectedQuantity)
                                  ? 'ck-border-yellow-500 ck-text-yellow-400'
                                  : 'ck-border-green-500 ck-text-green-400'}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ck-mt-4 ck-bg-gray-800/50 ck-p-4 ck-rounded-xl ck-border ck-border-gray-700">
                <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">Ghi chú sự cố chuyến xe (Tùy chọn):</label>
                <textarea 
                  rows="2"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="Ví dụ: Thùng phở bị móp méo, thiếu 1 túi tỏi..."
                  className="ck-w-full ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-lg ck-p-3 ck-text-white ck-outline-none focus:ck-border-blue-500 ck-resize-none"
                />
              </div>

            </div>

            <div className="ck-p-6 ck-border-t ck-border-gray-800 ck-flex ck-gap-4">
              <button onClick={() => setShowDemoReportModal(false)} className="ck-flex-1 ck-py-4 ck-rounded-2xl ck-font-black ck-border-none ck-transition-all" style={{ backgroundColor: "#374151", color: "#ffffff" }}>HỦY BỎ</button>
              <button onClick={submitDemoReport} className="ck-flex-1 ck-py-4 ck-rounded-2xl ck-font-black ck-border-none shadow-xl ck-transition-transform hover:ck-scale-105" style={{ backgroundColor: "#2563eb", color: "#ffffff", boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.4)" }}>XÁC NHẬN & GỬI BÁO CÁO</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupplyCoordinatorPage;