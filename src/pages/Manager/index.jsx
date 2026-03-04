import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, LayoutDashboard, Search, Download, Filter, Plus, X, Eye, Trash2, Store, ShoppingCart, Send } from "../../components/icons/Icons";
import api from "../../services/api";

const ManagerPage = ({ onLogout, userData }) => {
  const [activeManagementTab, setActiveManagementTab] = useState("Bảng KPI");
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE LƯU TRỮ DỮ LIỆU TỪ API
  // ==========================================
  const [masterProducts, setMasterProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [kpiStats, setKpiStats] = useState([]);

  const [selectedStore, setSelectedStore] = useState(null); // Cửa hàng đang xem
  const [isOrderingForStore, setIsOrderingForStore] = useState(false); // Trạng thái đang đặt hàng hộ
  const [stores, setStores] = useState([]); // Danh sách cửa hàng lấy từ API
  const [allOrders, setAllOrders] = useState([]); // Chứa tất cả đơn hàng để lọc theo store

  // State hỗ trợ cho việc đặt hàng hộ
  const [cart, setCart] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [searchTermHộ, setSearchTermHộ] = useState("");

  // ==========================================
  // HÀM FETCH DỮ LIỆU TỪ API
  // ==========================================
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, reps, exps, invs, recs, kpis, sts, ords] = await Promise.all([
        api.getMasterProducts().catch(() => []),
        api.getReports().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getManagerInventory().catch(() => []),
        api.getManagerRecipes().catch(() => []),
        api.getKPIStats().catch(() => []),
        // Fetch thêm danh sách cửa hàng và đơn hàng
        api.getStores?.().catch(() => [{id: 'ST001', name: 'CN Quận 1', address: '123 Lê Lợi', is_active: true}, {id: 'ST002', name: 'CN Quận 3', address: '456 Võ Văn Tần', is_active: true}]),
        api.getAllOrders?.().catch(() => []) 
      ]);
      setMasterProducts(prods);
      setReports(reps);
      setExpenses(exps);
      setInventory(invs);
      setRecipes(recs);
      setKpiStats(kpis);
      setStores(sts);
      setAllOrders(ords);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Manager:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Logic giỏ hàng đặt hộ
  const addToCart = (product) => {
    const existing = cart.find(i => i.sku === product.sku);
    if (existing) setCart(cart.map(i => i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { ...product, quantity: 1 }]);
  };

  const handleCreateOrderHộ = async () => {
    if (!cart.length || !deliveryDate) return alert("Vui lòng chọn món và ngày giao!");
    const newOrder = {
      id: `MGR-${Date.now().toString().slice(-4)}`,
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      items: cart.map(i => ({ productId: i.sku, name: i.name, quantity: i.quantity, price: i.price })),
      status: "pending",
      date: new Date().toLocaleString("vi-VN"),
      deliveryDate: new Date(deliveryDate).toLocaleDateString("vi-VN"),
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      note: `[MANAGER ĐẶT HỘ] ${orderNote}`,
    };
    try {
      await api.addOrder(newOrder);
      alert("✅ Đã tạo đơn đặt hàng hộ thành công!");
      setCart([]); setIsOrderingForStore(false); loadData();
    } catch (e) { alert("Lỗi đặt hàng hộ!"); }
  };

  const [selectedRecipeRun, setSelectedRecipeRun] = useState(null);

  // ==========================================
  // STATE & HÀM ĐIỀU KHIỂN UI (SẢN PHẨM MASTER)
  // ==========================================
  const [showAddMasterProduct, setShowAddMasterProduct] = useState(false);
  const [editingMasterProduct, setEditingMasterProduct] = useState(null);
  const [newMasterProduct, setNewMasterProduct] = useState({ sku: "", name: "", category: "Gà rán", cogs: "", price: "", status: "Đang bán", emoji: "🍔" });
  const [productSearchText, setProductSearchText] = useState("");
  const [productAppliedSearch, setProductAppliedSearch] = useState("");
  const [filterProductCategory, setFilterProductCategory] = useState("Tất cả danh mục");

  const handleSaveMasterProduct = async () => {
    if (!newMasterProduct.name || !newMasterProduct.price) return alert("Vui lòng điền Tên và Giá bán!");
    try {
      if (editingMasterProduct) await api.updateMasterProduct(editingMasterProduct.sku, newMasterProduct);
      else await api.createMasterProduct(newMasterProduct);
      setShowAddMasterProduct(false);
      loadData();
    } catch (error) { alert("Lỗi lưu sản phẩm!"); }
  };

  const handleDeleteMasterProduct = async (sku) => { 
    if(window.confirm("Bạn có chắc muốn xóa SP này?")) {
      try { await api.deleteMasterProduct(sku); loadData(); } catch (error) { alert("Lỗi xóa sản phẩm!"); }
    } 
  };

  // ==========================================
  // STATE & HÀM ĐIỀU KHIỂN UI (BÁO CÁO)
  // ==========================================
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [newReport, setNewReport] = useState({ name: "", type: "PDF", fromDate: "", toDate: "" });

  const handleCreateReport = async () => {
    if (!newReport.name) return alert("Vui lòng nhập tên báo cáo!");
    try { await api.createReport(newReport); setShowCreateReport(false); loadData(); } catch (error) { alert("Lỗi tạo báo cáo!"); }
  };

  // ==========================================
  // STATE & HÀM ĐIỀU KHIỂN UI (PHIẾU CHI)
  // ==========================================
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "Nhập nguyên liệu", supplier: "", ref: "", amount: "", method: "Chuyển khoản" });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseSearchText, setExpenseSearchText] = useState("");
  const [expenseAppliedSearch, setExpenseAppliedSearch] = useState("");
  const [filterExpenseCategory, setFilterExpenseCategory] = useState("Hạng mục chi");
  const [filterExpenseDate, setFilterExpenseDate] = useState("");

  const handleSaveExpense = async () => {
    if (!newExpense.supplier || !newExpense.amount) return alert("Vui lòng nhập Nhà cung cấp và Số tiền!");
    try { await api.createExpense(newExpense); setShowAddExpense(false); loadData(); } catch (error) { alert("Lỗi lưu phiếu chi!"); }
  };

  // ==========================================
  // BỘ LỌC TỒN KHO & CÔNG THỨC
  // ==========================================
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [inventoryAppliedSearch, setInventoryAppliedSearch] = useState("");
  const [filterInventoryLocation, setFilterInventoryLocation] = useState("Tất cả Kho");
  const [filterInventoryCategory, setFilterInventoryCategory] = useState("Tất cả danh mục");
  const [filterInventoryStatus, setFilterInventoryStatus] = useState("Cảnh báo tồn kho");

  const filteredInventory = inventory.filter(item => {
    let matchText = true;
    if (inventoryAppliedSearch) matchText = item.sku.toLowerCase().includes(inventoryAppliedSearch.toLowerCase()) || item.name.toLowerCase().includes(inventoryAppliedSearch.toLowerCase());
    let matchLocation = filterInventoryLocation === "Tất cả Kho" || item.location === filterInventoryLocation;
    let matchCat = filterInventoryCategory === "Tất cả danh mục" || item.category === filterInventoryCategory;
    let matchStat = filterInventoryStatus === "Cảnh báo tồn kho" || (filterInventoryStatus === "Sắp hết hàng" && item.status === "Sắp hết") || (filterInventoryStatus === "Đã hết hàng" && item.status === "Hết hàng");
    return matchText && matchLocation && matchCat && matchStat;
  });

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");
  const [filterRecipeCategory, setFilterRecipeCategory] = useState("Tất cả danh mục");

  const filteredRecipes = recipes.filter(r => (filterRecipeCategory === "Tất cả danh mục" || r.category === filterRecipeCategory) && (recipeAppliedSearch ? r.name.toLowerCase().includes(recipeAppliedSearch.toLowerCase()) : true));

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER QUẢN LÝ */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-10 ck-pb-4 ck-border-b ck-border-gray-800">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <LayoutDashboard className="ck-text-white" size={28} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight ck-mb-1">Phân hệ Quản Lý</h1>
            <p className="ck-text-xs ck-text-gray-400 ck-font-medium ck-tracking-wider ck-uppercase">Vận hành & Kế toán Bếp</p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
             <p className="ck-text-sm ck-font-bold ck-text-white">{userData?.name || "Quản Lý Cấp Cao"}</p>
             <p className="ck-text-xs ck-text-red-400">Ban Giám Đốc</p>
          </div>
          <button onClick={onLogout} className="ck-btn ck-bg-gradient-btn-admin ck-text-white ck-px-5 ck-py-2.5 ck-rounded-xl ck-font-bold ck-border-none ck-transition-all ck-flex ck-items-center ck-gap-2 ck-shadow-lg">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="ck-flex ck-gap-6 ck-w-full ck-relative ck-z-10 ck-animate-fade-in" style={{ minHeight: '800px' }}>
        
        {/* LEFT SIDEBAR */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ width: '20%', flexShrink: 0 }}>
          <ul className="ck-space-y-2 ck-flex-1 ck-mt-2" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {['Bảng KPI', 'Quản lý sản phẩm', 'Tổng quan tồn kho', 'Phân tích chi phí', 'Báo cáo', 'Quản lý công thức', 'Chi phí nhập hàng','Cửa hàng Franchise'].map((item, idx) => (
              <li key={idx}>
                <button 
                  type="button"
                  onClick={() => {
                    setActiveManagementTab(item);
                    setEditingMasterProduct(null); setShowAddMasterProduct(false);
                    setShowCreateReport(false); setShowAddExpense(false);
                  }}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${
                    activeManagementTab === item ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg" : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
                  }`}
                  style={activeManagementTab !== item ? { border: 'none', background: 'transparent' } : { border: 'none' }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex ck-flex-col ck-gap-6" style={{ width: '80%' }}>

          {/* ================== 1. TAB BẢNG KPI ================== */}
          {activeManagementTab === 'Bảng KPI' && (
            <div className="ck-flex ck-flex-col ck-gap-6">
              <div className="ck-grid ck-grid-cols-4 ck-gap-4">
                {[
                  { label: 'Giá trị xuất kho', value: '145.2M', sub: '₫ trong ngày', color: 'ck-text-blue-400' },
                  { label: '% Chi phí thực phẩm', value: '32.5%', sub: 'Mục tiêu < 35%', color: 'ck-text-green-400' },
                  { label: 'Tỷ lệ hao hụt', value: '2.8%', sub: 'Cảnh báo > 3%', color: 'ck-text-yellow-400' },
                  { label: 'Tỷ lệ giao hàng', value: '98.5%', sub: 'Đúng giờ', color: 'ck-text-purple-400' }
                ].map((stat, idx) => (
                  <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
                    <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
                    <span className="ck-text-xs ck-text-gray-500 ck-mt-1">{stat.sub}</span>
                  </div>
                ))}
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '350px' }}>
                  <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Sản lượng Sản xuất vs Nhu cầu</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                    <span className="ck-text-gray-500">[Khu vực vẽ Biểu đồ Đường / Cột]</span>
                  </div>
                </div>
                <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Phân tích chi phí</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                    <span className="ck-text-gray-500">[Biểu đồ Tròn]</span>
                  </div>
                </div>
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '250px' }}>
                  <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Phân tích hao hụt</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                    <span className="ck-text-gray-500">[Top nguyên liệu hao hụt]</span>
                  </div>
                </div>
                <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Hiệu suất giao hàng nhượng quyền</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center">
                    <span className="ck-text-gray-500">[Bảng xếp hạng tài xế / Chi nhánh]</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== 2. TAB QUẢN LÝ SẢN PHẨM ================== */}
          {activeManagementTab === 'Quản lý sản phẩm' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input type="text" placeholder="🔍 Tìm kiếm mã SKU, Tên sản phẩm..." className="ck-w-full ck-px-4 ck-py-2 ck-outline-none" style={{ backgroundColor: '#111827', color: 'white' }} defaultValue={productSearchText} onChange={(e) => setProductSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setProductAppliedSearch(e.target.value); }} />
                  <button onClick={() => setProductAppliedSearch(productSearchText)} className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0">Tìm kiếm</button>
                </div>
                <select value={filterProductCategory} onChange={(e) => setFilterProductCategory(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Tất cả danh mục">Tất cả danh mục</option><option value="Gà rán">Gà rán</option><option value="Burger">Burger</option><option value="Thức uống">Thức uống</option><option value="Ăn vặt">Ăn vặt</option>
                </select>
                
                <button 
                  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0" 
                  style={{ border: 'none' }}
                  onClick={() => {
                    setEditingMasterProduct(null);
                    setNewMasterProduct({ sku: "", name: "", category: "Gà rán", cogs: "", price: "", status: "Đang bán", emoji: "🍔" });
                    setShowAddMasterProduct(true);
                  }}
                >
                  + Thêm SP Master
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: showAddMasterProduct ? '66.66%' : '100%' }}>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4">Mã SKU</th><th className="ck-py-4 ck-px-4">Sản phẩm</th><th className="ck-py-4 ck-px-4">Danh mục</th><th className="ck-py-4 ck-px-4">Giá vốn</th><th className="ck-py-4 ck-px-4">Giá Franchise</th><th className="ck-py-4 ck-px-4 ck-text-center">Hành động</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {masterProducts.filter(prod => {
                          let matchText = true;
                          if (productAppliedSearch) matchText = prod.sku.toLowerCase().includes(productAppliedSearch.toLowerCase()) || prod.name.toLowerCase().includes(productAppliedSearch.toLowerCase());
                          let matchCat = filterProductCategory === "Tất cả danh mục" || prod.category === filterProductCategory;
                          return matchText && matchCat;
                      }).map((prod, idx) => (
                        <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                          <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{prod.sku}</td>
                          <td className="ck-py-4 ck-px-4 ck-font-bold">{prod.emoji} {prod.name}</td>
                          <td className="ck-py-4 ck-px-4">{prod.category}</td>
                          <td className="ck-py-4 ck-px-4 ck-text-blue-400 ck-font-mono">{Number(prod.cogs).toLocaleString()} ₫</td>
                          <td className="ck-py-4 ck-px-4 ck-text-green-400 ck-font-mono">{Number(prod.price).toLocaleString()} ₫</td>
                          <td className="ck-py-4 ck-px-4 ck-text-center">
                            <button onClick={() => { setEditingMasterProduct(prod); setNewMasterProduct(prod); setShowAddMasterProduct(true); }} className="ck-mr-3 ck-text-gray-400 hover:ck-text-white">✏️</button>
                            <button onClick={() => handleDeleteMasterProduct(prod.sku)} className="ck-text-red-500 hover:ck-text-red-400">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showAddMasterProduct && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">{editingMasterProduct ? "Sửa Sản Phẩm" : "Thêm SP Master"}</h3>
                      <button onClick={() => setShowAddMasterProduct(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      {editingMasterProduct && (
                        <div><label className="ck-block ck-text-gray-400 ck-mb-1">Mã SKU</label><input type="text" readOnly value={newMasterProduct.sku} className="ck-w-full ck-bg-gray-800 ck-text-gray-400 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none" /></div>
                      )}
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Tên sản phẩm *</label>
                        <div className="ck-flex ck-gap-2">
                          <input type="text" value={newMasterProduct.emoji} onChange={e=>setNewMasterProduct({...newMasterProduct, emoji: e.target.value})} className="ck-w-12 ck-bg-gray-800 ck-text-white ck-px-2 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-text-center ck-outline-none" />
                          <input type="text" value={newMasterProduct.name} onChange={e=>setNewMasterProduct({...newMasterProduct, name: e.target.value})} className="ck-flex-1 ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="Tên SP..." />
                        </div>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Danh mục</label>
                        <select value={newMasterProduct.category} onChange={e=>setNewMasterProduct({...newMasterProduct, category: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                          <option>Gà rán</option><option>Burger</option><option>Thức uống</option><option>Ăn vặt</option>
                        </select>
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div><label className="ck-block ck-text-gray-400 ck-mb-1">Giá vốn (COGS)</label><input type="number" value={newMasterProduct.cogs} onChange={e=>setNewMasterProduct({...newMasterProduct, cogs: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-blue-400 ck-outline-none" placeholder="0" /></div>
                        <div><label className="ck-block ck-text-gray-400 ck-mb-1">Giá Franchise</label><input type="number" value={newMasterProduct.price} onChange={e=>setNewMasterProduct({...newMasterProduct, price: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-green-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-green-400 ck-outline-none" placeholder="0" /></div>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button onClick={handleSaveMasterProduct} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">Lưu dữ liệu</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 3. TAB TỔNG QUAN TỒN KHO ================== */}
          {activeManagementTab === 'Tổng quan tồn kho' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-yellow-400 ck-transition-colors">
                  <input type="text" placeholder="🔍 Tìm mã hàng, tên nguyên liệu..." className="ck-w-full ck-px-4 ck-py-2 ck-outline-none" style={{ backgroundColor: '#111827', color: 'white' }} defaultValue={inventorySearchText} onChange={(e) => setInventorySearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setInventoryAppliedSearch(e.target.value); }} />
                  <button onClick={() => setInventoryAppliedSearch(inventorySearchText)} className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-yellow-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0">Tìm kiếm</button>
                </div>
                
                <select value={filterInventoryLocation} onChange={(e) => setFilterInventoryLocation(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Tất cả Kho">Tất cả Kho</option>
                  <option value="Bếp Trung Tâm">Bếp Trung Tâm</option>
                  <option value="CN Quận 1">CN Quận 1</option>
                  <option value="CN Quận 3">CN Quận 3</option>
                </select>

                <select value={filterInventoryCategory} onChange={(e) => setFilterInventoryCategory(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Tất cả danh mục">Tất cả danh mục</option><option value="Thịt / Cá">Thịt / Cá</option><option value="Rau củ">Rau củ</option><option value="Gia vị / Sốt">Gia vị / Sốt</option><option value="Bao bì">Bao bì</option>
                </select>
                <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex-shrink-0">📥 Xuất File</button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: selectedInventoryItem ? '66.66%' : '100%' }}>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4">Mã Hàng</th><th className="ck-py-4 ck-px-4">Nguyên liệu / Vật tư</th><th className="ck-py-4 ck-px-4">Kho</th><th className="ck-py-4 ck-px-4">Danh mục</th><th className="ck-py-4 ck-px-4 ck-text-right">Tồn hiện tại</th><th className="ck-py-4 ck-px-4 ck-text-center">Tình trạng</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {filteredInventory.length > 0 ? (
                        filteredInventory.map((item, idx) => (
                          <tr key={idx} onClick={() => setSelectedInventoryItem(item)} className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedInventoryItem?.sku === item.sku && selectedInventoryItem?.location === item.location ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-yellow-400' : ''}`}>
                            <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{item.sku}</td>
                            <td className="ck-py-4 ck-px-4 ck-font-bold">{item.name}</td>
                            <td className="ck-py-4 ck-px-4">
                               <span className={`ck-text-xs ck-font-bold ck-px-2 ck-py-1 ck-rounded-md ${item.location === 'Bếp Trung Tâm' ? 'ck-bg-purple-500-20 ck-text-purple-400' : 'ck-bg-blue-500-20 ck-text-blue-400'}`}>{item.location}</span>
                            </td>
                            <td className="ck-py-4 ck-px-4 ck-text-gray-400">{item.category}</td>
                            <td className={`ck-py-4 ck-px-4 ck-font-mono ck-font-bold ck-text-right ${item.stock === 0 ? 'ck-text-red-500' : item.stock <= item.min ? 'ck-text-yellow-400' : 'ck-text-white'}`}>{item.stock.toLocaleString()} <span className="ck-text-xs ck-text-gray-500">{item.unit}</span></td>
                            <td className="ck-py-4 ck-px-4 ck-text-center">
                              {item.status === 'An toàn' && <span className="ck-bg-green-500-20 ck-text-green-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">An toàn</span>}
                              {item.status === 'Sắp hết' && <span className="ck-bg-yellow-500-20 ck-text-yellow-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">Sắp hết</span>}
                              {item.status === 'Hết hàng' && <span className="ck-bg-red-500-20 ck-text-red-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">Hết hàng</span>}
                            </td>
                          </tr>
                        ))
                      ) : ( <tr><td colSpan="7" className="ck-py-8 ck-text-center ck-text-gray-500">Không tìm thấy nguyên liệu nào phù hợp.</td></tr> )}
                    </tbody>
                  </table>
                </div>

                {selectedInventoryItem && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết Tồn kho</h3>
                      <button onClick={() => setSelectedInventoryItem(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-5 ck-text-sm">
                      <div className="ck-bg-gray-800 ck-p-4 ck-rounded-xl ck-border ck-border-gray-700">
                        <p className="ck-text-xs ck-text-gray-400 ck-font-mono ck-mb-1">{selectedInventoryItem.sku}</p>
                        <p className="ck-text-lg ck-text-white ck-font-bold ck-mb-1">{selectedInventoryItem.name}</p>
                        <p className="ck-text-xs ck-text-purple-400 ck-font-bold ck-mb-3">Kho: {selectedInventoryItem.location}</p>
                        <div className="ck-flex ck-justify-between ck-items-end">
                          <div><p className="ck-text-xs ck-text-gray-400 ck-mb-1">Tồn kho thực tế</p><p className="ck-text-2xl ck-font-black ck-text-white">{selectedInventoryItem.stock} <span className="ck-text-sm ck-text-gray-500 ck-font-normal">{selectedInventoryItem.unit}</span></p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 4. TAB PHÂN TÍCH CHI PHÍ ================== */}
          {activeManagementTab === 'Phân tích chi phí' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center">
                <h2 className="ck-text-2xl ck-font-black ck-text-white">Báo cáo Phân tích Chi phí</h2>
                <div className="ck-flex ck-gap-3">
                  <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600">📥 Tải Báo Cáo PDF</button>
                </div>
              </div>

              <div className="ck-grid ck-grid-cols-4 ck-gap-4">
                {kpiStats.map((stat, idx) => (
                  <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-flex-col ck-justify-center">
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
                    <div className="ck-flex ck-items-end ck-gap-3">
                      <p className="ck-text-3xl ck-font-black ck-text-white">{stat.value}</p>
                      <span className={`ck-text-sm ck-font-bold ck-mb-1 ${stat.isUp ? 'ck-text-green-400' : 'ck-text-red-400'}`}>{stat.isUp ? '↑' : '↓'} {stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '350px' }}>
                  <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Xu hướng Giá trị xuất kho & Chi phí vốn (6 tháng)</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-flex-col ck-items-center ck-justify-center ck-bg-gray-800 ck-bg-opacity-50">
                    <span className="ck-text-gray-500 ck-font-semibold">[Khu vực render Recharts - Bar Chart]</span>
                  </div>
                </div>
                <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
                  <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Cơ cấu Chi phí</h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-flex-col ck-items-center ck-justify-center ck-bg-gray-800 ck-bg-opacity-50 ck-p-4">
                    <div className="ck-w-32 ck-h-32 ck-rounded-full ck-border-8 ck-border-blue-500 ck-border-t-orange-500 ck-border-r-yellow-500 ck-border-b-green-500 ck-mb-4"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== 5. TAB BÁO CÁO ================== */}
          {activeManagementTab === 'Báo cáo' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl">
                <div className="ck-flex ck-items-center ck-gap-4">
                  <h2 className="ck-text-xl ck-font-black ck-text-white ck-mr-4">Trích xuất Báo cáo</h2>
                </div>
                <button 
                  className="ck-btn ck-px-5 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-shadow-lg"
                  onClick={() => setShowCreateReport(true)}
                >
                  + Tạo báo cáo tùy chỉnh
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all" style={{ width: showCreateReport ? '66.66%' : '100%' }}>
                  <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                    <h3 className="ck-text-lg ck-font-bold ck-text-white">Lịch sử xuất báo cáo gần đây</h3>
                  </div>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-5">Mã File</th><th className="ck-py-4 ck-px-5">Tên báo cáo</th><th className="ck-py-4 ck-px-5">Thời gian</th><th className="ck-py-4 ck-px-5 ck-text-center">Định dạng</th><th className="ck-py-4 ck-px-5 ck-text-center">Hành động</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {reports.map((report, idx) => (
                        <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors">
                          <td className="ck-py-4 ck-px-5 ck-font-mono ck-text-gray-400">{report.id}</td>
                          <td className="ck-py-4 ck-px-5 ck-font-bold">{report.name}</td>
                          <td className="ck-py-4 ck-px-5 ck-text-gray-400">{report.date}</td>
                          <td className="ck-py-4 ck-px-5 ck-text-center"><span className={`ck-px-3 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ck-border ${report.type === 'PDF' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' : 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'}`}>{report.type}</span></td>
                          <td className="ck-py-4 ck-px-5 ck-text-center"><button className="ck-btn ck-px-4 ck-py-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-rounded-lg ck-font-bold ck-text-xs ck-border-none">Tải xuống ⬇</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showCreateReport && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Tạo Báo Cáo Mới</h3>
                      <button onClick={() => setShowCreateReport(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Tên báo cáo *</label>
                        <input type="text" value={newReport.name} onChange={e=>setNewReport({...newReport, name: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="VD: Báo cáo tháng 3..." />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Định dạng file</label>
                        <select value={newReport.type} onChange={e=>setNewReport({...newReport, type: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                          <option>PDF</option><option>Excel</option>
                        </select>
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Từ ngày</label>
                          <input type="date" value={newReport.fromDate} onChange={e=>setNewReport({...newReport, fromDate: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none" />
                        </div>
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Đến ngày</label>
                          <input type="date" value={newReport.toDate} onChange={e=>setNewReport({...newReport, toDate: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button onClick={handleCreateReport} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">Tạo & Xuất file</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 6. TAB QUẢN LÝ CÔNG THỨC ================== */}
          {activeManagementTab === 'Quản lý công thức' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
                  <input type="text" placeholder="🔍 Tìm mã SKU, Tên sản phẩm..." className="ck-w-full ck-px-4 ck-py-2 ck-outline-none" style={{ backgroundColor: '#111827', color: 'white' }} defaultValue={recipeSearchText} onChange={(e) => setRecipeSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setRecipeAppliedSearch(e.target.value); }} />
                  <button onClick={() => setRecipeAppliedSearch(recipeSearchText)} className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0">Tìm kiếm</button>
                </div>
              </div>
              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: selectedRecipe ? '55%' : '100%' }}>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4">Sản phẩm (Master Data)</th><th className="ck-py-4 ck-px-4 ck-text-center">Số nguyên liệu</th><th className="ck-py-4 ck-px-4 ck-text-right">Giá vốn ước tính</th><th className="ck-py-4 ck-px-4 ck-text-center">Trạng thái</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {filteredRecipes.length > 0 ? (
                        filteredRecipes.map((recipe, idx) => (
                          <tr key={idx} onClick={() => setSelectedRecipe(recipe)} className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedRecipe?.sku === recipe.sku ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}>
                            <td className="ck-py-4 ck-px-4"><span className="ck-block ck-font-bold">{recipe.emoji} {recipe.name}</span><span className="ck-text-xs ck-font-mono ck-text-gray-400">{recipe.sku}</span></td>
                            <td className="ck-py-4 ck-px-4 ck-text-center ck-font-mono ck-text-gray-300">{recipe.ingredients.length} mục</td>
                            <td className="ck-py-4 ck-px-4 ck-text-right ck-text-blue-400 ck-font-mono ck-font-bold">{recipe.estCost.toLocaleString()} ₫</td>
                            <td className="ck-py-4 ck-px-4 ck-text-center"><span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${recipe.status === 'Đã thiết lập' ? 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50' : 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50'}`}>{recipe.status}</span></td>
                          </tr>
                        ))
                      ) : ( <tr><td colSpan="4" className="ck-py-8 ck-text-center ck-text-gray-500">Không tìm thấy công thức nào phù hợp.</td></tr> )}
                    </tbody>
                  </table>
                </div>

                {selectedRecipe && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-flex ck-flex-col ck-animate-fade-in" style={{ width: '45%', maxHeight: '600px' }}>
                    <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                      <div><h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-1">Định mức nguyên liệu (BOM)</h3><p className="ck-text-sm ck-text-orange-400 ck-font-semibold">{selectedRecipe.emoji} {selectedRecipe.name}</p></div>
                      <button onClick={() => setSelectedRecipe(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                      {selectedRecipe.ingredients.length === 0 ? (
                        <div className="ck-text-center ck-py-10 ck-text-gray-500"><p className="ck-mb-2 ck-text-3xl">🫙</p><p>Sản phẩm này chưa có công thức.</p></div>
                      ) : (
                        <div className="ck-space-y-3">
                          {selectedRecipe.ingredients.map((ing, i) => (
                            <div key={i} className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between ck-group">
                              <div className="ck-flex-1"><p className="ck-text-white ck-font-semibold">{ing.name}</p><p className="ck-text-xs ck-font-mono ck-text-gray-400">{ing.id}</p></div>
                              <div className="ck-flex ck-items-center ck-gap-2 ck-w-1/3"><input type="number" defaultValue={ing.qty} step="0.01" className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-lg ck-border ck-border-gray-600 focus:ck-border-orange-400 ck-outline-none ck-text-right ck-font-mono" /><span className="ck-text-sm ck-text-gray-400 ck-w-8">{ing.unit}</span></div>
                              <button className="ck-ml-2 ck-text-gray-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-opacity-0 group-hover:ck-opacity-100 ck-transition-opacity ck-cursor-pointer">🗑️</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="ck-w-full ck-mt-4 ck-py-3 ck-rounded-xl ck-border-2 ck-border-dashed ck-border-gray-600 hover:ck-border-orange-400 hover:ck-text-orange-400 ck-text-gray-400 ck-font-bold ck-bg-transparent ck-transition-colors ck-cursor-pointer">+ Thêm nguyên liệu</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 7. TAB CHI PHÍ NHẬP HÀNG ================== */}
          {activeManagementTab === 'Chi phí nhập hàng' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-grid ck-grid-cols-3 ck-gap-4">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div><h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Tổng Chi (Tháng này)</h4><p className="ck-text-2xl ck-font-black ck-text-red-400">86.200.000 ₫</p></div><div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-red-500-20 ck-flex ck-items-center ck-justify-center ck-text-2xl">💸</div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div><h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Chi phí Nguyên vật liệu</h4><p className="ck-text-2xl ck-font-black ck-text-white">68.500.000 ₫</p></div><div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">🥩</div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div><h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Chi phí Vận hành</h4><p className="ck-text-2xl ck-font-black ck-text-white">17.700.000 ₫</p></div><div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">⚡</div>
                </div>
              </div>

              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input type="text" placeholder="🔍 Tìm mã phiếu chi, nhà cung cấp..." className="ck-w-full ck-px-4 ck-py-2 ck-outline-none" style={{ backgroundColor: '#111827', color: 'white' }} defaultValue={expenseSearchText} onChange={(e) => setExpenseSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setExpenseAppliedSearch(e.target.value); }} />
                  <button onClick={() => setExpenseAppliedSearch(expenseSearchText)} className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0">Tìm kiếm</button>
                </div>
                <select value={filterExpenseCategory} onChange={(e) => setFilterExpenseCategory(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Hạng mục chi">Tất cả Hạng mục</option><option value="Nhập nguyên liệu">Nhập nguyên liệu</option><option value="Chi phí bao bì">Chi phí bao bì</option><option value="Vận hành / Điện nước">Vận hành / Điện nước</option>
                </select>
                <input type="date" value={filterExpenseDate} onChange={(e) => setFilterExpenseDate(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer" />
                
                <button 
                  onClick={() => setShowAddExpense(true)} 
                  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-flex-shrink-0"
                >
                  + Tạo Phiếu Chi
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: (selectedExpense || showAddExpense) ? '66.66%' : '100%' }}>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4">Mã Phiếu</th><th className="ck-py-4 ck-px-4">Thời gian</th><th className="ck-py-4 ck-px-4">Nhà cung cấp</th><th className="ck-py-4 ck-px-4">Hạng mục & Tham chiếu</th><th className="ck-py-4 ck-px-4 ck-text-right">Số tiền (VNĐ)</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {expenses.filter(tx => {
                        let matchText = expenseAppliedSearch ? tx.id.toLowerCase().includes(expenseAppliedSearch.toLowerCase()) || tx.supplier.toLowerCase().includes(expenseAppliedSearch.toLowerCase()) : true;
                        let matchCategory = filterExpenseCategory === "Hạng mục chi" || tx.category === filterExpenseCategory;
                        let matchDate = filterExpenseDate === "" || tx.date === filterExpenseDate;
                        return matchText && matchCategory && matchDate;
                      }).map((tx, idx) => (
                        <tr key={idx} onClick={() => { setSelectedExpense(tx); setShowAddExpense(false); }} className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedExpense?.id === tx.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-red-500' : ''}`}>
                          <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{tx.id}</td><td className="ck-py-4 ck-px-4 ck-text-gray-400">{tx.date}</td>
                          <td className="ck-py-4 ck-px-4 ck-font-bold">{tx.supplier}</td>
                          <td className="ck-py-4 ck-px-4"><span className="ck-block ck-text-gray-300">{tx.category}</span><span className="ck-text-xs ck-text-gray-500">{tx.ref}</span></td>
                          <td className="ck-py-4 ck-px-4 ck-text-right ck-font-mono ck-font-bold ck-text-red-400">-{tx.amount.toLocaleString()} ₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FORM TẠO PHIẾU CHI MỚI */}
                {showAddExpense && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Tạo Phiếu Chi</h3>
                      <button onClick={() => setShowAddExpense(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Nhà cung cấp / Đối tác *</label>
                        <input type="text" value={newExpense.supplier} onChange={e=>setNewExpense({...newExpense, supplier: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="VD: CP Foods, Bao Bì Xanh..." />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Hạng mục chi *</label>
                        <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                          <option>Nhập nguyên liệu</option><option>Chi phí bao bì</option><option>Vận hành / Điện nước</option><option>Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Số tiền (VNĐ) *</label>
                        <input type="number" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="0" />
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Mã tham chiếu (Đơn hàng)</label>
                          <input type="text" value={newExpense.ref} onChange={e=>setNewExpense({...newExpense, ref: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none" placeholder="Mã PO..." />
                        </div>
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Phương thức</label>
                          <select value={newExpense.method} onChange={e=>setNewExpense({...newExpense, method: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                            <option>Chuyển khoản</option><option>Tiền mặt</option><option>Công nợ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button onClick={handleSaveExpense} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">Lưu Phiếu Chi</button>
                    </div>
                  </div>
                )}

                {/* XEM CHI TIẾT PHIẾU CHI */}
                {selectedExpense && !showAddExpense && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết Phiếu Chi</h3>
                      <button onClick={() => setSelectedExpense(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-xl ck-p-5 ck-relative ck-overflow-hidden">
                      <div className="ck-absolute ck-top-0 ck-left-0 ck-w-full ck-h-2 ck-bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+')] ck-bg-repeat-x ck-transform ck--translate-y-1"></div>
                      <div className="ck-text-center ck-mb-6 ck-mt-2">
                        <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Mã Phiếu</p><p className="ck-text-xl ck-font-mono ck-font-bold ck-text-white">{selectedExpense.id}</p><p className="ck-text-xs ck-text-gray-500 ck-mt-1">{selectedExpense.date}</p>
                      </div>
                      <div className="ck-space-y-3 ck-text-sm ck-border-t ck-border-b ck-border-dashed ck-border-gray-600 ck-py-4 ck-mb-4">
                        <div className="ck-flex ck-justify-between"><span className="ck-text-gray-400">Nhà cung cấp:</span><span className="ck-text-white ck-font-semibold">{selectedExpense.supplier}</span></div>
                        <div className="ck-flex ck-justify-between"><span className="ck-text-gray-400">Hạng mục:</span><span className="ck-text-gray-300">{selectedExpense.category}</span></div>
                        <div className="ck-flex ck-justify-between"><span className="ck-text-gray-400">Mã PO/HĐ:</span><span className="ck-text-blue-400 ck-font-medium ck-underline ck-cursor-pointer">{selectedExpense.ref || "Không có"}</span></div>
                        <div className="ck-flex ck-justify-between"><span className="ck-text-gray-400">Hình thức:</span><span className="ck-text-white">{selectedExpense.method}</span></div>
                      </div>
                      <div className="ck-flex ck-justify-between ck-items-end">
                        <span className="ck-text-base ck-text-gray-300 ck-font-bold">Tổng chi:</span>
                        <span className="ck-text-3xl ck-font-black ck-text-red-400">-{selectedExpense.amount.toLocaleString()} ₫</span>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button className="ck-flex-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">🖨️ In Phiếu Chi</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== TAB CHÍNH: CỬA HÀNG FRANCHISE ================== */}
{activeManagementTab === 'Cửa hàng Franchise' && (
  <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
    {!selectedStore ? (
      /* VIEW 1: DANH SÁCH CỬA HÀNG (Dữ liệu từ biến stores) */
      <div className="ck-grid ck-grid-cols-3 ck-gap-6">
        {stores.map(store => (
          <div key={store.id} 
               onClick={() => setSelectedStore(store)} 
               className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl hover:ck-border-red-500 ck-transition-all ck-cursor-pointer group shadow-xl">
            <div className="ck-flex ck-justify-between ck-mb-4">
              <div className="ck-p-3 ck-bg-gray-800 ck-rounded-xl">
                <Store className="ck-text-red-400" size={32} />
              </div>
              <span className={`ck-badge ${store.is_active ? 'ck-badge-green' : 'ck-badge-red'} ck-h-fit`}>
                {store.is_active ? 'Đang chạy' : 'Tạm dừng'}
              </span>
            </div>
            <h3 className="ck-text-xl ck-font-black ck-text-white ck-mb-1">{store.name}</h3>
            <p className="ck-text-sm ck-text-gray-500 ck-mb-4 ck-line-clamp-1">{store.address}</p>
            <div className="ck-flex ck-justify-between ck-items-center ck-pt-4 ck-border-t ck-border-gray-800">
              <span className="ck-text-xs ck-font-mono ck-text-gray-600">{store.id}</span>
              <span className="ck-text-red-400 ck-font-bold group-hover:ck-translate-x-1 ck-transition-transform">
                Chi tiết →
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      /* VIEW 2 & 3: CHI TIẾT & ĐẶT HÀNG HỘ */
      <div className="ck-flex ck-flex-col ck-gap-6">
        <div className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900 ck-p-4 ck-rounded-2xl ck-border ck-border-gray-700">
          <div className="ck-flex ck-items-center ck-gap-4">
            <button onClick={() => {setSelectedStore(null); setIsOrderingForStore(false)}} 
                    className="ck-w-10 ck-h-10 ck-flex ck-items-center ck-justify-center ck-bg-gray-800 ck-rounded-full ck-text-gray-400 hover:ck-text-white border-none ck-cursor-pointer">
              ←
            </button>
            <div>
              <h2 className="ck-text-2xl ck-font-black ck-text-white">Cửa hàng: {selectedStore.name}</h2>
              <p className="ck-text-xs ck-text-gray-500 ck-mono">{selectedStore.id} | {selectedStore.address}</p>
            </div>
          </div>
          {!isOrderingForStore && (
            <button onClick={() => setIsOrderingForStore(true)} 
                    className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold border-none shadow-lg shadow-red-500/20 ck-flex ck-items-center ck-gap-2">
              <Plus size={20} /> Tạo đơn đặt hộ
            </button>
          )}
        </div>

        {isOrderingForStore ? (
          /* VIEW 3: GIAO DIỆN ĐẶT HÀNG HỘ (Dữ liệu từ biến masterProducts) */
          <div className="ck-grid ck-grid-cols-3 ck-gap-6 ck-animate-slide-up">
            <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-p-8">
              <div className="ck-flex ck-justify-between ck-mb-8 items-center">
                <h3 className="ck-text-2xl ck-font-black ck-text-white">Thực đơn Bếp Tổng</h3>
                <div className="ck-relative">
                  <Search className="ck-absolute ck-left-4 ck-top-1/2 ck--translate-y-1/2 ck-text-gray-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm tên món ăn..." 
                    className="ck-input ck-pl-12 ck-w-64" 
                    onChange={(e) => setSearchTermHộ(e.target.value)}
                  />
                </div>
              </div>
              <div className="ck-grid ck-grid-cols-2 ck-gap-4 ck-max-h-[500px] ck-overflow-y-auto ck-scrollbar ck-pr-2">
                {masterProducts
                  .filter(p => p.name.toLowerCase().includes(searchTermHộ.toLowerCase()))
                  .map(p => (
                  <div key={p.sku} className="ck-bg-gray-800 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center hover:ck-bg-gray-700 ck-transition-colors ck-border ck-border-transparent hover:ck-border-red-500/50">
                    <div className="ck-flex ck-gap-4">
                      <span className="ck-text-4xl">{p.emoji}</span>
                      <div>
                        <p className="ck-font-bold ck-text-white text-sm">{p.name}</p>
                        <p className="ck-text-xs ck-text-blue-400 ck-mono mt-1">{Number(p.price).toLocaleString()}đ</p>
                      </div>
                    </div>
                    <button onClick={() => addToCart(p)} className="ck-w-10 ck-h-10 ck-bg-red-500 ck-rounded-xl border-none ck-text-white ck-font-black ck-cursor-pointer hover:ck-scale-110 ck-transition-transform">+</button>
                  </div>
                ))}
              </div>
            </div>

            {/* GIỎ HÀNG HỘ (Dữ liệu từ biến cart) */}
            <div className="ck-bg-gray-900 ck-p-8 ck-rounded-3xl ck-border ck-border-red-500/20 shadow-2xl ck-flex ck-flex-col">
              <h3 className="ck-text-xl ck-font-black ck-mb-6 ck-flex ck-items-center ck-gap-3">
                <ShoppingCart className="ck-text-red-500" size={24}/> Giỏ hàng hộ
              </h3>
              <div className="ck-flex-1 ck-space-y-4 ck-mb-6 ck-max-h-64 ck-overflow-y-auto ck-scrollbar">
                {cart.length === 0 ? (
                  <div className="ck-text-center ck-py-10 ck-text-gray-600">
                    <p className="ck-text-4xl ck-mb-2">📦</p>
                    <p className="ck-text-xs uppercase font-bold">Chưa chọn món nào</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.sku} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800 ck-p-3 ck-rounded-xl">
                    <div className="ck-flex-1">
                      <p className="ck-text-white ck-font-bold text-xs">{item.name}</p>
                      <p className="ck-text-[10px] ck-text-gray-500">{item.quantity} x {Number(item.price).toLocaleString()}đ</p>
                    </div>
                    <span className="ck-text-red-400 ck-font-black ck-mono">{(item.price * item.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
              <div className="ck-border-t ck-border-gray-800 ck-pt-6 ck-space-y-4">
                <div>
                  <label className="ck-text-[10px] ck-text-gray-500 ck-font-bold uppercase mb-2 block">Ngày giao hàng dự kiến</label>
                  <input type="date" className="ck-input ck-w-full" onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
                <textarea 
                  placeholder="Ghi chú quan trọng cho Bếp..." 
                  className="ck-input ck-w-full ck-h-20" 
                  onChange={(e) => setOrderNote(e.target.value)} 
                />
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                   <span className="ck-text-gray-400 ck-font-bold">TỔNG CỘNG:</span>
                   <span className="ck-text-2xl ck-font-black ck-text-orange-400">
                     {cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}đ
                   </span>
                </div>
                <button onClick={handleCreateOrderHộ} className="ck-w-full ck-py-4 ck-bg-red-600 ck-text-white ck-rounded-2xl ck-font-black ck-text-lg border-none shadow-lg ck-cursor-pointer hover:ck-bg-red-700 transition-colors">GỬI ĐƠN ĐẶT HỘ</button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: LỊCH SỬ ĐƠN HÀNG (Lọc từ allOrders theo selectedStore.id) */
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-overflow-hidden shadow-2xl">
            <div className="ck-p-6 ck-bg-gray-800/50 ck-border-b ck-border-gray-700 ck-flex ck-justify-between items-center">
               <h3 className="ck-font-black ck-text-gray-300 ck-uppercase tracking-widest text-sm">Lịch sử giao dịch chi nhánh</h3>
               <button className="ck-text-blue-400 ck-font-bold text-xs bg-transparent border-none ck-cursor-pointer">Xuất báo cáo Store</button>
            </div>
            <table className="ck-w-full ck-text-left ck-border-collapse">
              <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-[10px] uppercase tracking-tighter">
                <tr>
                  <th className="ck-p-5">Mã đơn hàng</th>
                  <th className="ck-p-5">Thời gian đặt</th>
                  <th className="ck-p-5">Ngày giao dự kiến</th>
                  <th className="ck-p-5 ck-text-right">Tổng giá trị</th>
                  <th className="ck-p-5 ck-text-center">Trạng thái vận hành</th>
                </tr>
              </thead>
              <tbody className="ck-text-sm">
                {allOrders
                  .filter(o => o.storeId === selectedStore.id)
                  .map(order => (
                  <tr key={order.id} className="ck-border-t ck-border-gray-800 hover:ck-bg-gray-800/50 ck-transition-colors">
                    <td className="ck-p-5 ck-mono ck-text-blue-400 ck-font-bold">{order.id}</td>
                    <td className="ck-p-5 ck-text-gray-400">{order.date}</td>
                    <td className="ck-p-5 ck-text-white ck-font-medium">{order.deliveryDate}</td>
                    <td className="ck-p-5 ck-text-right ck-font-black ck-text-orange-400">
                      {order.total?.toLocaleString()}đ
                    </td>
                    <td className="ck-p-5 ck-text-center">
                      <span className={`ck-badge ${
                        order.status === 'Hoàn thành' || order.status === 'completed' 
                        ? 'ck-badge-green' 
                        : order.status === 'Đã hủy' || order.status === 'cancelled' 
                        ? 'ck-badge-red' 
                        : 'ck-badge-blue'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {allOrders.filter(o => o.storeId === selectedStore.id).length === 0 && (
                  <tr>
                    <td colSpan="5" className="ck-p-10 ck-text-center ck-text-gray-500 italic">
                      Cửa hàng này chưa có dữ liệu đơn hàng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
)}
          

        </div>
      </div>
    </div>
  );
};

export default ManagerPage;