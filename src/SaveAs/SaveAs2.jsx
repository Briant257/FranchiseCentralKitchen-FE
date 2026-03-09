import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogOut, Package, FileText, AlertTriangle, CheckCircle, Clock, Send, Plus, Shield, Activity
} from "../../components/icons/Icons";

const SupplyCoordinatorPage = ({ onLogout, userData }) => {
  const [activeTab, setActiveTab] = useState("Hàng chờ bốc xếp");
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  // ==========================================
  // 1. STATE QUẢN LÝ DỮ LIỆU THẬT
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State phục vụ Modal lập chuyến hàng
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState({ driver: '', plate: '' });

  // ==========================================
  // 2. HÀM FETCH DATA TỔNG THỂ (SYNC VỚI DATABASE)
  // ==========================================
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi đồng thời tất cả API từ Backend
      const [ordersRes, incidentsRes, shipmentsRes] = await Promise.all([
        fetch('/api/orders/ready'),
        fetch('/api/incidents/pending'),
        fetch('/api/shipments/active')
      ]);

      const ordersData = await ordersRes.json();
      const incidentsData = await incidentsRes.json();
      const shipmentsData = await shipmentsRes.json();

      setOrders(ordersData);
      setIncidents(incidentsData);
      setShipments(shipmentsData);
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động load dữ liệu khi vào trang
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==========================================
  // 3. LOGIC NGHIỆP VỤ (CALL API)
  // ==========================================

  // Giải quyết sự cố -> Backend tự tạo đơn COMPENSATION
  const handleResolveIncident = async (incidentId) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        alert("Xử lý thành công! Đơn giao bù đã được khởi tạo.");
        fetchAllData(); // Reload để cập nhật danh sách đơn mới
      }
    } catch (error) {
      alert("Lỗi khi kết nối máy chủ xử lý sự cố.");
    }
  };

  // Xác nhận xuất kho -> Tạo chuyến hàng mới
  const handleConfirmShipment = async () => {
    if (selectedOrders.length === 0) return alert("Vui lòng chọn ít nhất 1 đơn hàng!");
    
    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver: deliveryInfo.driver || "Tài xế mặc định",
          plate: deliveryInfo.plate || "Chưa gán xe",
          orderIds: selectedOrders
        })
      });

      if (response.ok) {
        alert("Lập lệnh vận chuyển thành công!");
        setShowShipmentModal(false);
        setSelectedOrders([]);
        fetchAllData();
      }
    } catch (error) {
      alert("Lỗi khi tạo lệnh vận chuyển.");
    }
  };

  // ==========================================
  // 4. GIAO DIỆN (UI GIỮ NGUYÊN)
  // ==========================================
  if (loading) return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-flex ck-items-center ck-justify-center">
      <p className="ck-text-red-500 ck-font-black ck-animate-pulse">ĐANG KẾT NỐI HỆ THỐNG LOGISTICS...</p>
    </div>
  );

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-10 ck-pb-4 ck-border-b ck-border-gray-800">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <Package className="ck-text-white" size={32} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white leading-tight">Supply Coordinator</h1>
            <p className="ck-text-xs ck-text-red-400 ck-font-bold uppercase ck-tracking-widest">Hệ thống điều phối thực thời</p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
             <p className="ck-text-sm ck-font-bold">{userData?.full_name || "Coordinator"}</p>
             <p className="ck-text-xs ck-text-red-400">{userData?.role || "Logistics Manager"}</p>
          </div>
          <button onClick={onLogout} className="ck-btn ck-bg-gradient-btn-admin ck-text-white ck-px-5 ck-py-2.5 ck-rounded-xl ck-font-bold ck-border-none">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="ck-flex ck-gap-6 ck-relative ck-z-10" style={{ minHeight: '700px' }}>
        {/* SIDEBAR */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5" style={{ width: '22%', flexShrink: 0 }}>
          <ul className="ck-space-y-2" style={{ listStyleType: 'none', padding: 0 }}>
            {[
              { name: 'Hàng chờ bốc xếp', icon: <Package size={18} />, count: orders.length },
              { name: 'Lịch trình vận chuyển', icon: <Activity size={18} />, count: shipments.length },
              { name: 'Xử lý khiếu nại', icon: <AlertTriangle size={18} />, count: incidents.length }
            ].map((item) => (
              <li key={item.name}>
                <button 
                  onClick={() => setActiveTab(item.name)}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ck-flex ck-items-center ck-justify-between ${activeTab === item.name ? "ck-bg-gradient-btn-admin ck-text-white shadow-lg" : "ck-text-gray-400 hover:ck-bg-gray-800"}`}
                  style={{ border: 'none', background: activeTab === item.name ? '' : 'transparent' }}
                >
                  <div className="ck-flex ck-items-center ck-gap-3">
                    {item.icon} {item.name}
                  </div>
                  {item.count > 0 && <span className="ck-text-[10px] ck-bg-black/30 ck-px-2 ck-py-0.5 ck-rounded-full">{item.count}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6">
          
          {/* TAB: HÀNG CHỜ BỐC XẾP */}
          {activeTab === 'Hàng chờ bốc xếp' && (
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-animate-fade-in">
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                <h3 className="ck-text-xl ck-font-bold">Đơn hàng sẵn sàng xuất kho</h3>
                <button onClick={() => setShowShipmentModal(true)} className="ck-btn ck-px-6 ck-py-2.5 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none shadow-xl hover:ck-scale-105 ck-transition-transform">
                  + Lập chuyến xe mới
                </button>
              </div>
              <div className="ck-p-4">
                <table className="ck-w-full">
                  <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs uppercase">
                    <tr>
                      <th className="ck-py-4 ck-px-6 ck-text-center">Mã Đơn</th>
                      <th className="ck-py-4 ck-px-6 ck-text-center">Cửa hàng</th>
                      <th className="ck-py-4 ck-px-6 ck-text-center">Loại</th>
                      <th className="ck-py-4 ck-px-6 ck-text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="ck-text-white ck-text-sm">
                    {orders.length > 0 ? orders.map((o) => (
                      <tr key={o.order_id} className="ck-border-t ck-border-gray-700 ck-text-center hover:ck-bg-gray-800/50">
                        <td className="ck-py-4 ck-px-6 ck-font-mono ck-text-red-400 ck-font-bold">{o.order_id}</td>
                        <td className="ck-py-4 ck-px-6 ck-font-bold">{o.store_name || o.store_id}</td>
                        <td className="ck-py-4 ck-px-6">
                           <span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-[10px] ck-font-black ${o.order_type === 'COMPENSATION' ? 'ck-bg-orange-500/20 ck-text-orange-400' : 'ck-bg-blue-500/20 ck-text-blue-400'}`}>
                              {o.order_type}
                           </span>
                        </td>
                        <td className="ck-py-4 ck-px-6 ck-text-green-400 ck-font-bold">READY</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="ck-p-10 ck-text-center ck-text-gray-600">Không có đơn hàng nào chờ xử lý.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SỰ CỐ */}
          {activeTab === 'Xử lý khiếu nại' && (
            <div className="ck-space-y-4 ck-animate-fade-in">
               {incidents.length > 0 ? incidents.map(inc => (
                 <div key={inc.id} className="ck-bg-gray-900 ck-border-l-4 ck-border-l-red-600 ck-border-gray-700 ck-p-6 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                    <div>
                      <p className="ck-text-xs ck-text-gray-500 ck-mb-1 uppercase tracking-widest">Incident ID: {inc.id}</p>
                      <h4 className="ck-text-lg ck-font-black ck-text-white">{inc.store_id}</h4>
                      <p className="ck-text-sm ck-text-gray-400 ck-mt-1">{inc.issue_description || inc.issue}</p>
                    </div>
                    <button 
                      onClick={() => handleResolveIncident(inc.id)}
                      className="ck-btn ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-px-6 ck-py-2.5 ck-rounded-xl ck-font-black ck-border-none ck-flex ck-items-center ck-gap-2 shadow-lg shadow-orange-900/20"
                    >
                      <Plus size={18} /> Giao bù hàng
                    </button>
                 </div>
               )) : <div className="ck-p-20 ck-text-center ck-text-gray-500 ck-bg-gray-900 ck-rounded-3xl">Tuyệt vời! Không có khiếu nại nào tồn đọng.</div>}
            </div>
          )}

          {/* TAB: LỊCH TRÌNH */}
          {activeTab === 'Lịch trình vận chuyển' && (
            <div className="ck-grid ck-grid-cols-2 ck-gap-6 ck-animate-fade-in">
               {shipments.map(s => (
                  <div key={s.shipment_id} className="ck-bg-gray-900 ck-border-t-4 ck-border-t-red-600 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl shadow-xl">
                    <div className="ck-flex ck-justify-between ck-mb-6">
                      <span className="ck-text-red-400 ck-font-mono ck-text-lg ck-font-black">{s.shipment_id}</span>
                      <span className="ck-text-[10px] ck-bg-blue-600/20 ck-text-blue-400 ck-px-3 ck-py-1 ck-rounded-full ck-font-bold uppercase tracking-widest">{s.status}</span>
                    </div>
                    <div className="ck-space-y-3 ck-text-sm">
                       <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-800 ck-pb-2">
                          <span className="ck-text-gray-500">Tài xế</span>
                          <span className="ck-text-white ck-font-bold">{s.driver_name || s.driver}</span>
                       </div>
                       <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-800 ck-pb-2">
                          <span className="ck-text-gray-500">Biển số</span>
                          <span className="ck-text-white ck-font-bold">{s.vehicle_plate || s.plate}</span>
                       </div>
                    </div>
                    <button className="ck-w-full ck-mt-6 ck-py-3 ck-bg-gray-800 hover:ck-bg-red-600 ck-text-white ck-rounded-xl ck-font-black ck-border-none ck-transition-colors">THEO DÕI LỘ TRÌNH</button>
                  </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: LẬP CHUYẾN HÀNG (MỀM HÓA INPUT) */}
      {showShipmentModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-xl ck-shadow-2xl ck-animate-fade-in">
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between">
               <h3 className="ck-text-xl ck-font-black ck-text-white">Lệnh vận chuyển mới</h3>
               <button onClick={() => setShowShipmentModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button>
            </div>
            <div className="ck-p-8 ck-space-y-6">
               <div className="ck-grid ck-grid-cols-2 ck-gap-4">
                  <div>
                    <label className="ck-block ck-text-[10px] ck-text-gray-500 uppercase ck-mb-2">Họ tên Tài xế *</label>
                    <input 
                      type="text" 
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, driver: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      className="ck-w-full ck-bg-gray-800 ck-border-gray-700 ck-rounded-xl ck-p-3 ck-text-white ck-outline-none focus:ck-border-red-500" 
                    />
                  </div>
                  <div>
                    <label className="ck-block ck-text-[10px] ck-text-gray-500 uppercase ck-mb-2">Biển số xe *</label>
                    <input 
                      type="text" 
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, plate: e.target.value})}
                      placeholder="51C-XXX.XX"
                      className="ck-w-full ck-bg-gray-800 ck-border-gray-700 ck-rounded-xl ck-p-3 ck-text-white ck-outline-none focus:ck-border-red-500" 
                    />
                  </div>
               </div>
               <div>
                  <label className="ck-block ck-text-[10px] ck-text-gray-500 uppercase ck-mb-2">Chọn đơn bốc xếp ({selectedOrders.length})</label>
                  <div className="ck-space-y-2 ck-max-h-48 ck-overflow-y-auto ck-pr-2">
                    {orders.map(o => (
                       <label key={o.order_id} className="ck-flex ck-items-center ck-gap-3 ck-p-4 ck-bg-gray-800/50 ck-rounded-2xl ck-cursor-pointer hover:ck-bg-gray-800">
                          <input 
                            type="checkbox" 
                            onChange={(e) => {
                              if(e.target.checked) setSelectedOrders([...selectedOrders, o.order_id]);
                              else setSelectedOrders(selectedOrders.filter(id => id !== o.order_id));
                            }}
                            className="ck-accent-red-500 ck-w-5 ck-h-5" 
                          />
                          <div className="ck-flex-1">
                            <p className="ck-text-sm ck-font-bold">{o.order_id}</p>
                            <p className="ck-text-[10px] ck-text-gray-500">{o.store_name || o.store_id}</p>
                          </div>
                       </label>
                    ))}
                  </div>
               </div>
               <div className="ck-flex ck-gap-4 ck-pt-4">
                  <button onClick={() => setShowShipmentModal(false)} className="ck-flex-1 ck-py-4 ck-bg-transparent ck-text-gray-500 ck-font-black ck-border-none">HỦY BỎ</button>
                  <button onClick={handleConfirmShipment} className="ck-flex-1 ck-py-4 ck-bg-gradient-btn-admin ck-text-white ck-rounded-2xl ck-font-black ck-border-none shadow-xl shadow-red-900/20">XÁC NHẬN XUẤT KHO</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCoordinatorPage;