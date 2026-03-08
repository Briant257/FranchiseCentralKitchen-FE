import React, { useState } from 'react';
import { 

  Plus, Eye, Search, Filter, LogOut, 
  Package, FileText, AlertTriangle, CheckCircle, Clock, Store, Activity, Send

} from "../../components/icons/Icons";

const SupplyCoordinatorPage = ({ onLogout, userData }) => {
  // ==========================================
  // 1. STATE & DATA CỨNG (HỘI TỤ TINH TÚY)
  // ==========================================
  const [activeTab, setActiveTab] = useState("Điều phối đơn");
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  // Data Đơn hàng - Đầy đủ thông tin để Thầy soi Khối 6
  const [orders, setOrders] = useState([
    { id: 'ORD-881', store: 'KFC Quận 1', type: 'STANDARD', status: 'NEW', time: '10:30 AM', items: 12, total: '5,400,000' },
    { id: 'ORD-882', store: 'KFC Gò Vấp', type: 'URGENT', status: 'NEW', time: '11:15 AM', items: 5, total: '2,100,000' },
    { id: 'ORD-883', store: 'KFC Thủ Đức', type: 'STANDARD', status: 'COOKING', time: '09:45 AM', items: 25, total: '12,000,000' },
    { id: 'ORD-884', store: 'KFC Bình Thạnh', type: 'STANDARD', status: 'DONE', time: '08:20 AM', items: 15, total: '7,200,000' },
    { id: 'ORD-885', store: 'KFC Quận 7', status: 'DONE', time: '08:10 AM', items: 10, total: '4,800,000' },
  ]);

  // Data Chuyến hàng - Khớp Khối 7 Logistics

  const [shipments] = useState([

    { id: 'SHP-201', driver: 'Trần Văn Cường', plate: '51C-123.45', type: 'MAIN_ROUTE', status: 'DELIVERING', orderCount: 2 },
  ]);

  // Nghiệp vụ Gom đơn (Aggregation)
  const handleAggregate = () => {
    const hasNew = orders.some(o => o.status === 'NEW');
    if (!hasNew) return alert("Không còn đơn mới để gom!");
    setOrders(orders.map(o => o.status === 'NEW' ? { ...o, status: 'AGGREGATED' } : o));
    alert("Đã gom đơn thành công! Trạng thái hệ thống: AGGREGATED.");
  };

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER - ĐỒNG BỘ MÀU RED GRADIENT */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-10 ck-pb-4 ck-border-b ck-border-gray-800">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <Package className="ck-text-white" size={32} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight">Supply Coordinator</h1>
            <p className="ck-text-xs ck-text-red-400 ck-font-bold ck-uppercase ck-tracking-widest">Hệ thống điều phối 2026</p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
             <p className="ck-text-sm ck-font-bold ck-text-white">{userData?.name || "Điều Phối Viên"}</p>
             <p className="ck-text-xs ck-text-red-400">Trưởng ca Logistics</p>
          </div>
          <button onClick={onLogout} className="ck-btn ck-bg-gradient-btn-admin ck-text-white ck-px-5 ck-py-2.5 ck-rounded-xl ck-font-bold ck-border-none ck-shadow-lg">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="ck-flex ck-gap-6 ck-relative ck-z-10" style={{ minHeight: '750px' }}>
        
        {/* SIDEBAR - TRẢI NGHIỆM ĐỒNG NHẤT */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5" style={{ width: '20%', flexShrink: 0 }}>
          <ul className="ck-space-y-2 ck-flex-1" style={{ listStyleType: 'none', padding: 0 }}>
            {[
              { name: 'Điều phối đơn', icon: <FileText size={18} /> },
              { name: 'Lịch giao hàng', icon: <Package size={18} /> },
              { name: 'Khiếu nại cửa hàng', icon: <AlertTriangle size={18} /> }
            ].map((item) => (
              <li key={item.name}>
                <button 
                  onClick={() => setActiveTab(item.name)}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ck-flex ck-items-center ck-gap-3 ${activeTab === item.name ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg" : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"}`}
                  style={{ border: 'none', background: activeTab === item.name ? '' : 'transparent' }}
                >
                  {item.icon} {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6">
          
          {/* STATS CARDS - BẢO HIỂM CON SỐ */}
          <div className="ck-grid ck-grid-cols-4 ck-gap-4">
            {[
              { label: 'Đơn hàng mới', value: orders.filter(o => o.status === 'NEW').length, color: 'ck-text-red-400' },
              { label: 'Đang nấu (Bếp)', value: '01', color: 'ck-text-orange-400' },
              { label: 'Đã sẵn sàng giao', value: orders.filter(o => o.status === 'DONE').length, color: 'ck-text-green-400' },
              { label: 'Sự cố vận hành', value: '02', color: 'ck-text-yellow-400' }
            ].map((stat, idx) => (
              <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center">
                <h4 className="ck-text-xs ck-font-semibold ck-text-gray-400 ck-mb-2 uppercase tracking-tighter">{stat.label}</h4>
                <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {activeTab === 'Điều phối đơn' && (
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-animate-fade-in">
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                <div>
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Hàng chờ điều phối</h3>
                  <p className="ck-text-xs ck-text-gray-500 mt-1">Tổng hợp yêu cầu từ hệ thống nhượng quyền</p>
                </div>
                <button 
                  onClick={handleAggregate}
                  className="ck-btn ck-px-6 ck-py-2.5 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2 ck-border-none ck-shadow-lg"
                >
                  <Send size={18} /> Gom đơn & Gửi Bếp
                </button>
              </div>

              <div className="ck-p-4">
               <table className="ck-w-full ck-border-collapse">
  <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs ck-uppercase">
    <tr>
      {/* Thêm ck-text-center vào tất cả tiêu đề cột */}
      <th className="ck-py-4 ck-px-6 ck-text-center">Mã Đơn</th>
      <th className="ck-py-4 ck-px-6 ck-text-center">Cửa hàng</th>
      <th className="ck-py-4 ck-px-6 ck-text-center">Trạng thái</th>
      <th className="ck-py-4 ck-px-6 ck-text-center">Tổng tiền</th>
    </tr>
  </thead>
  <tbody className="ck-text-white ck-text-sm">
    {orders.map((o) => (
      <tr key={o.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800/50 ck-transition-colors">
        {/* Thêm ck-text-center vào tất cả các ô dữ liệu */}
        <td className="ck-py-4 ck-px-6 ck-font-mono ck-text-red-400 ck-font-bold ck-text-center">{o.id}</td>
        <td className="ck-py-4 ck-px-6 ck-font-bold ck-text-center">{o.store}</td>
        <td className="ck-py-4 ck-px-6 ck-text-center">
          <div className="ck-flex ck-items-center ck-justify-center ck-gap-2"> {/* Thêm ck-justify-center ở đây */}
            {o.status === 'NEW' && <Clock size={14} className="ck-text-blue-400" />}
            {o.status === 'DONE' && <CheckCircle size={14} className="ck-text-green-400" />}
            <span className={`ck-font-medium ${o.status === 'DONE' ? 'ck-text-green-400' : ''}`}>{o.status}</span>
          </div>
        </td>
        <td className="ck-py-4 ck-px-6 ck-text-center ck-font-black ck-text-red-400">{o.total}₫</td>
      </tr>
    ))}
  </tbody>
</table>
              </div>
            </div>
          )}

          {activeTab === 'Lịch giao hàng' && (
            <div className="ck-space-y-6 ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center">
                <h3 className="ck-text-xl ck-font-bold">Quản lý lộ trình Logistics</h3>
                <button 
                  onClick={() => setShowShipmentModal(true)}
                  className="ck-bg-gradient-btn-admin ck-text-white ck-px-6 ck-py-3 ck-rounded-xl ck-font-bold ck-border-none shadow-lg"
                >
                  + Lập chuyến hàng mới
                </button>
              </div>
              <div className="ck-grid ck-grid-cols-2 ck-gap-6">
                {shipments.map(s => (
                  <div key={s.id} className="ck-bg-gray-900 ck-border-l-4 ck-border-l-red-500 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl">
                    <div className="ck-flex ck-justify-between ck-mb-4">
                      <span className="ck-text-red-400 ck-font-mono font-bold">{s.id}</span>
                      <span className="ck-text-xs ck-bg-green-500-20 ck-text-green-400 ck-px-2 ck-py-1 ck-rounded-lg">Đã xuất kho</span>
                    </div>
                    <div className="ck-space-y-2 ck-text-sm ck-text-gray-400">
                       <p className="ck-flex ck-justify-between"><span>Tài xế:</span> <span className="ck-text-white">{s.driver}</span></p>
                       <p className="ck-flex ck-justify-between"><span>Biển số:</span> <span className="ck-text-white">{s.plate}</span></p>
                       <p className="ck-flex ck-justify-between"><span>Số đơn:</span> <span className="ck-text-white">{s.orderCount} đơn hàng</span></p>
                    </div>
                    <button className="ck-w-full ck-mt-6 ck-py-2.5 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border-none">Theo dõi lộ trình</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* KIỆT TÁC MODAL LẬP CHUYẾN HÀNG MỚI */}
      {/* ========================================== */}
      {showShipmentModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/95 ck-flex ck-items-center ck-justify-center ck-z-50 ck-p-4">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-w-full ck-max-w-2xl ck-shadow-2xl ck-animate-fade-in">
            
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between ck-items-center">
              <div className="ck-flex ck-items-center ck-gap-3">
                <div className="ck-p-2 ck-bg-gradient-btn-admin ck-rounded-lg ck-text-white">
                  <Package size={24} />
                </div>
                <h3 className="ck-text-xl ck-font-black">Khởi tạo chuyến giao hàng mới</h3>
              </div>
              <button onClick={() => setShowShipmentModal(false)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-2xl">✕</button>
            </div>

            <div className="ck-p-8 ck-grid ck-grid-cols-2 ck-gap-8">
              {/* Cột 1: Thông tin (Shipment Table) */}
              <div className="ck-space-y-5">
                <p className="ck-text-red-400 ck-text-xs ck-font-bold uppercase tracking-widest">1. Phương tiện & Tài xế</p>
                <div>
                  <label className="ck-block ck-text-gray-500 ck-text-[10px] uppercase mb-1">Chọn tài xế điều phối *</label>
                  <select className="ck-w-full ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-xl ck-p-4 ck-text-white ck-outline-none">
                    <option>Nguyễn Văn Hùng (ID: TX001)</option>
                    <option>Lê Minh Tâm (ID: TX002)</option>
                  </select>
                </div>
                <div>
                  <label className="ck-block ck-text-gray-500 ck-text-[10px] uppercase mb-1">Biển số xe *</label>
                  <input type="text" className="ck-w-full ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-xl ck-p-4 ck-text-white" defaultValue="51C-888.66" />
                </div>
              </div>

              {/* Cột 2: Chọn đơn (Shipment_Details Table) */}
              <div className="ck-space-y-5">
                <p className="ck-text-red-400 ck-text-xs ck-font-bold uppercase tracking-widest">2. Danh sách đơn bốc xếp (DONE)</p>
                <div className="ck-bg-black/40 ck-rounded-2xl ck-p-4 ck-border ck-border-gray-800 ck-max-h-60 ck-overflow-y-auto">
                  <div className="ck-space-y-3">
                    {orders.filter(o => o.status === 'DONE').map(o => (
                      <label key={o.id} className="ck-flex ck-items-center ck-gap-3 ck-p-3 ck-bg-gray-800/50 ck-rounded-xl ck-cursor-pointer hover:ck-bg-gray-800">
                        <input type="checkbox" defaultChecked className="ck-accent-red-500 ck-w-4 ck-h-4" />
                        <div>
                          <p className="ck-text-sm ck-font-bold">{o.id}</p>
                          <p className="ck-text-[10px] ck-text-gray-500">{o.store} - {o.items} món</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ck-p-8 ck-bg-gray-800/30 ck-rounded-b-3xl ck-flex ck-gap-4">
              <button onClick={() => setShowShipmentModal(false)} className="ck-flex-1 ck-py-4 ck-bg-transparent ck-text-gray-500 ck-font-bold ck-border-none">Hủy bỏ</button>
              <button onClick={() => {setShowShipmentModal(false); alert("Đã lập lệnh xuất kho thành công!")}} className="ck-flex-1 ck-py-4 ck-bg-gradient-btn-admin ck-text-white ck-rounded-2xl ck-font-black ck-border-none shadow-xl">XÁC NHẬN XUẤT KHO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCoordinatorPage;