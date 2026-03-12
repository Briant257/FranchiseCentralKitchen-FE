import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, LayoutDashboard, Search, Plus, Store, ShoppingCart } from "../../components/icons/Icons";
import api from "../../services/api";

const ManagerPage = ({ onLogout, userData }) => {
  const [activeManagementTab, setActiveManagementTab] = useState("Bảng KPI");
  const [, setIsLoading] = useState(false);

  const [masterProducts, setMasterProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]); 
  const [reports, setReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [kpiStats, setKpiStats] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isOrderingForStore, setIsOrderingForStore] = useState(false);
  const [stores, setStores] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  // --- STATE CHO CÔNG THỨC VÀ KHO ---
  const [activeRecipeProduct, setActiveRecipeProduct] = useState(null); 
  const [recipeDetail, setRecipeDetail] = useState(null); 
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);

  // --- HÀM XỬ LÝ CÔNG THỨC ---
  const handleSelectProductForRecipe = async (product) => {
    setActiveRecipeProduct(product);
    setRecipeDetail(null);
    setIsLoadingRecipe(true);
    try {
      const targetId = product.product_id || product.productId || product.id;
      const data = await api.getRecipeOfProduct(targetId);
      setRecipeDetail(data || { ingredients: [] });
    } catch (error) {
      setRecipeDetail({ ingredients: [] });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [searchTermHộ, setSearchTermHộ] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats, reps, exps, invs, kpis, sts, ords] = await Promise.all([
        api.getMasterProducts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getReports().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getManagerInventory().catch(() => []),
        api.getKPIStats().catch(() => []),
        api.getStores?.().catch(() => []),
        api.getAllOrders?.().catch(() => []) 
      ]);
      setMasterProducts(prods);
      setCategoriesList(cats); 
      setReports(reps);
      setExpenses(exps);
      setInventory(invs);
      setKpiStats(kpis);
      setStores(sts);
      setAllOrders(ords);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Manager:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ==========================================
  // LOGIC TÍNH TOÁN "MỀM" CHO CHI PHÍ
  // ==========================================
  const ingredientExpenseVal = masterProducts.reduce((sum, p) => sum + (Number(p.cost_price) || 0), 0);
  const operationExpenseVal = Math.round(ingredientExpenseVal * 0.15); 
  const totalExpenseVal = ingredientExpenseVal + operationExpenseVal;

  const costStructureArray = masterProducts.reduce((acc, cur) => {
      const catName = cur.category || "Khác";
      const found = acc.find(item => item.name === catName);
      if (found) found.value += (Number(cur.cost_price) || 0);
      else acc.push({ name: catName, value: (Number(cur.cost_price) || 0) });
      return acc;
  }, []);

  // ==========================================
  // CÁC HÀM XỬ LÝ CHUNG
  // ==========================================
  const addToCart = (product) => {
    const targetId = product.product_id || product.productId || product.id;
    const existing = cart.find(i => (i.product_id || i.productId || i.id) === targetId);
    if (existing) setCart(cart.map(i => (i.product_id || i.productId || i.id) === targetId ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { ...product, quantity: 1 }]);
  };

  const handleCreateOrderHộ = async () => {
    if (!cart.length) return alert("Giỏ hàng đang trống! Vui lòng chọn món.");
    if (!selectedStore?.id) return alert("Vui lòng chọn cửa hàng cần đặt hộ!");

    const payload = {
      storeId: selectedStore.id,
      note: `[MANAGER ĐẶT HỘ] ${orderNote}`,
      items: cart.map(i => ({ 
        productId: i.product_id || i.productId || i.id, 
        quantity: Number(i.quantity) 
      }))
    };

    try {
      setIsLoading(true); 
      const response = await api.addOrder(payload);
      alert(`✅ Đã tạo đơn tiêu chuẩn thành công!\nMã đơn: ${response.orderId}`);
      setCart([]); setOrderNote(""); setIsOrderingForStore(false); loadData(); 
    } catch (e) { alert(`❌ Lỗi đặt hàng hộ: ${e.message || "Vui lòng thử lại sau"}`); } 
    finally { setIsLoading(false); }
  };

  // ==========================================
  // HÀM XỬ LÝ SẢN PHẨM MASTER
  // ==========================================
  const [showAddMasterProduct, setShowAddMasterProduct] = useState(false);
  const [editingMasterProduct, setEditingMasterProduct] = useState(null);
  
  const [newMasterProduct, setNewMasterProduct] = useState({ 
      product_id: "", product_name: "", categoryId: "", base_unit: "CAI", cost_price: "", selling_price: "" 
  });
  
  const [productSearchText, setProductSearchText] = useState("");
  const [productAppliedSearch, setProductAppliedSearch] = useState("");
  const [filterProductCategory, setFilterProductCategory] = useState("Tất cả danh mục");

  const handleSaveMasterProduct = async () => {
    if (!newMasterProduct.product_name) return alert("Vui lòng điền Tên sản phẩm!");
    if (!newMasterProduct.categoryId && categoriesList.length > 0) {
        newMasterProduct.categoryId = categoriesList[0].id || categoriesList[0].categoryId;
    }

    const payload = {
        id: newMasterProduct.product_id,
        productId: newMasterProduct.product_id, 
        product_id: newMasterProduct.product_id,
        name: newMasterProduct.product_name,
        productName: newMasterProduct.product_name,
        product_name: newMasterProduct.product_name,
        categoryId: newMasterProduct.categoryId, 
        category_id: newMasterProduct.categoryId,
        price: Number(newMasterProduct.selling_price || 0),
        costPrice: Number(newMasterProduct.cost_price || 0),
        cost_price: Number(newMasterProduct.cost_price || 0),
        sellingPrice: Number(newMasterProduct.selling_price || 0),
        selling_price: Number(newMasterProduct.selling_price || 0),
        baseUnit: newMasterProduct.base_unit || "CAI", 
        base_unit: newMasterProduct.base_unit || "CAI",
        active: true,
        isActive: true,
        is_active: true
    };

    try {
      setIsLoading(true);
      if (editingMasterProduct) {
        const targetId = editingMasterProduct.product_id || editingMasterProduct.productId || editingMasterProduct.id;
        if(!targetId) throw new Error("Mất dấu ID Sản phẩm khi cập nhật.");
        await api.updateMasterProduct(targetId, payload);
        alert("✅ Cập nhật sản phẩm thành công!");
      } else {
        if(!payload.productId) return alert("Vui lòng nhập Mã Món (VD: P_010) khi tạo mới!");
        await api.createMasterProduct(payload);
        alert("✅ Tạo sản phẩm mới thành công!");
      }
      setShowAddMasterProduct(false); 
      await loadData(); 
    } catch (error) { 
        alert(`❌ Lỗi lưu sản phẩm: ${error.message}`); 
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteMasterProduct = async (prod) => { 
    const targetId = prod.product_id || prod.productId || prod.id;
    if(!targetId) return alert("Không tìm thấy mã sản phẩm để xóa!");

    if(window.confirm(`Bạn có chắc muốn xóa sản phẩm mã [${targetId}] này?`)) {
      try { 
        setIsLoading(true);
        await api.deleteMasterProduct(targetId); 
        alert("✅ Đã xóa sản phẩm thành công!");
        await loadData(); 
      } catch (error) { 
        alert(`❌ Lỗi xóa sản phẩm: ${error.message}`); 
      } finally {
        setIsLoading(false);
      }
    } 
  };

  // ==========================================
  // HÀM XỬ LÝ KHÁC
  // ==========================================
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [newReport, setNewReport] = useState({ name: "", type: "PDF", fromDate: "", toDate: "" });

  const handleCreateReport = async () => {
    if (!newReport.name) return alert("Vui lòng nhập tên báo cáo!");
    try { await api.createReport(newReport); setShowCreateReport(false); loadData(); } catch (error) { alert("Lỗi tạo báo cáo!"); }
  };

  // BIẾN CHO TÌM KIẾM CHI PHÍ NHẬP HÀNG
  const [expenseSearchText, setExpenseSearchText] = useState("");
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");

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
             <p className="ck-text-sm ck-font-bold ck-text-white">{userData?.name || "manager1"}</p>
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
                    setShowCreateReport(false); 
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
                {kpiStats && kpiStats.totalRevenueToday !== undefined ? (
                  <>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Doanh thu hôm nay</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-blue-400">{kpiStats.totalRevenueToday?.toLocaleString()} ₫</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Doanh thu tháng này</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-green-400">{kpiStats.totalRevenueThisMonth?.toLocaleString()} ₫</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Số đơn hôm nay</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-orange-400">{kpiStats.totalOrdersToday}</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Trạng thái</h4>
                      <p className="ck-text-xl ck-font-black ck-text-white">Hoạt động tốt</p>
                    </div>
                  </>
                ) : (
                  <div className="ck-col-span-4 ck-text-center ck-py-10 ck-text-gray-500">Đang tải dữ liệu KPI...</div>
                )}
              </div>
              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '350px' }}><h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Sản lượng Sản xuất vs Nhu cầu</h3><div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center"><span className="ck-text-gray-500">[Khu vực vẽ Biểu đồ Đường / Cột]</span></div></div>
                <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col"><h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Phân tích chi phí</h3><div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center"><span className="ck-text-gray-500">[Biểu đồ Tròn]</span></div></div>
              </div>
            </div>
          )}

          {/* ================== 2. TAB QUẢN LÝ SẢN PHẨM ================== */}
          {activeManagementTab === 'Quản lý sản phẩm' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input 
                    type="text" 
                    placeholder="🔍 Tìm kiếm mã Món, Tên sản phẩm..." 
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none ck-text-white placeholder-gray-400" 
                    style={{ backgroundColor: '#1f2937' }} 
                    defaultValue={productSearchText} 
                    onChange={(e) => setProductSearchText(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') setProductAppliedSearch(e.target.value); }} 
                  />
                  <button onClick={() => setProductAppliedSearch(productSearchText)} className="ck-bg-gray-900 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0 ck-cursor-pointer">
                    Tìm kiếm
                  </button>
                </div>
                
                <select value={filterProductCategory} onChange={(e) => setFilterProductCategory(e.target.value)} className="ck-bg-gray-800 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Tất cả danh mục">Tất cả danh mục</option>
                  {categoriesList.map(cat => (
                      <option key={cat.id || cat.categoryId} value={cat.name || cat.categoryName}>{cat.name || cat.categoryName}</option>
                  ))}
                </select>
                
                <button 
                  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0 ck-cursor-pointer" 
                  style={{ border: 'none' }}
                  onClick={() => {
                    setEditingMasterProduct(null);
                    setNewMasterProduct({ product_id: "", product_name: "", categoryId: "", base_unit: "CAI", cost_price: "", selling_price: "", status: "Đang bán" });
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
                      <tr>
                        <th className="ck-py-4 ck-px-4">Mã Món</th>
                        <th className="ck-py-4 ck-px-4">Sản phẩm</th>
                        <th className="ck-py-4 ck-px-4">Danh mục</th>
                        <th className="ck-py-4 ck-px-4">Đơn vị</th>
                        <th className="ck-py-4 ck-px-4">Giá vốn</th>
                        <th className="ck-py-4 ck-px-4 ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {masterProducts.filter(prod => {
                          const isSoftDeleted = prod.active === false || prod.isActive === false || prod.is_active === false || String(prod.is_active) === "0" || String(prod.isActive) === "0";
                          if (isSoftDeleted) return false; 

                          let matchText = true;
                          const safeId = String(prod.product_id || prod.productId || prod.id || "");
                          const safeName = String(prod.product_name || prod.productName || prod.name || "");

                          if (productAppliedSearch) {
                              matchText = safeId.toLowerCase().includes(productAppliedSearch.toLowerCase()) || 
                                          safeName.toLowerCase().includes(productAppliedSearch.toLowerCase());
                          }
                          
                          const catName = prod.category || prod.categoryName || '';
                          let matchCat = filterProductCategory === "Tất cả danh mục" || catName === filterProductCategory;
                          return matchText && matchCat;
                      }).map((prod, idx) => (
                        <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                          <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{prod.product_id || prod.productId || prod.id}</td>
                          <td className="ck-py-4 ck-px-4 ck-font-bold">{prod.product_name || prod.productName || prod.name}</td>
                          <td className="ck-py-4 ck-px-4">{prod.category || prod.categoryName || 'Chưa phân loại'}</td>
                          <td className="ck-py-4 ck-px-4 ck-text-gray-400">{prod.base_unit || prod.baseUnit || 'CAI'}</td>
                          <td className="ck-py-4 ck-px-4 ck-text-blue-400 ck-font-mono">{Number(prod.cost_price || prod.costPrice || 0).toLocaleString()} ₫</td>
                          <td className="ck-py-4 ck-px-4 ck-text-center">
                            <button onClick={() => { setEditingMasterProduct(prod); setNewMasterProduct({...prod, categoryId: prod.category_id || prod.categoryId}); setShowAddMasterProduct(true); }} className="ck-mr-3 ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer">✏️</button>
                            <button onClick={() => handleDeleteMasterProduct(prod)} className="ck-text-red-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-cursor-pointer">🗑️</button>
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
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Mã Món (Product ID)</label>
                        <input type="text" readOnly={!!editingMasterProduct} value={newMasterProduct.product_id || newMasterProduct.productId || newMasterProduct.id} onChange={e=>setNewMasterProduct({...newMasterProduct, product_id: e.target.value})} className={`ck-w-full ck-bg-gray-800 ck-text-gray-400 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none ${!editingMasterProduct && 'focus:ck-border-red-500 ck-text-white'}`} placeholder="VD: P-004..." />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Tên sản phẩm *</label>
                        <input 
                          type="text" 
                          value={newMasterProduct.product_name || newMasterProduct.productName || newMasterProduct.name} 
                          onChange={e=>setNewMasterProduct({...newMasterProduct, product_name: e.target.value})} 
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" 
                          placeholder="Tên SP..." 
                        />
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Danh mục (Category)</label>
                            <select value={newMasterProduct.categoryId} onChange={e=> {
                                const selectedCat = categoriesList.find(c => String(c.id || c.categoryId) === String(e.target.value));
                                setNewMasterProduct({...newMasterProduct, categoryId: e.target.value, category: selectedCat?.name || selectedCat?.categoryName});
                            }} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                            <option value="">Chọn danh mục...</option>
                            {categoriesList.map(cat => (
                                <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>{cat.name || cat.categoryName}</option>
                            ))}
                            </select>
                        </div>
                        <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Đơn vị (Base Unit)</label>
                            <select value={newMasterProduct.base_unit || newMasterProduct.baseUnit || 'CAI'} onChange={e=>setNewMasterProduct({...newMasterProduct, base_unit: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none">
                            <option value="CAI">CÁI</option>
                            <option value="PHAN">PHẦN</option>
                            <option value="LY">LY</option>
                            <option value="COMBO">COMBO</option>
                            <option value="CHAI">CHAI</option>
                            </select>
                        </div>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Giá vốn (COGS)</label>
                        <input type="number" value={newMasterProduct.cost_price || newMasterProduct.costPrice} onChange={e=>setNewMasterProduct({...newMasterProduct, cost_price: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-blue-400 ck-outline-none" placeholder="0" />
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

          {/* ================== 3. TAB NGUYÊN LIỆU & NHẬP KHO ================== */}
          {activeManagementTab === 'Tổng quan tồn kho' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
              <div className="ck-flex ck-justify-between ck-items-center">
                 <div>
                   <h2 className="ck-text-2xl ck-font-black ck-text-white">Quản lý Nguyên Liệu</h2>
                   <p className="ck-text-xs ck-text-gray-400">Danh mục Nguyên liệu và Nhập hàng (Master Data)</p>
                 </div>
                 <button className="ck-btn ck-px-6 ck-py-2 ck-bg-yellow-500 hover:ck-bg-yellow-600 ck-text-black ck-rounded-xl ck-font-black ck-border-none ck-flex-shrink-0 shadow-lg shadow-yellow-500/20 ck-cursor-pointer">+ Tạo Phiếu Nhập Kho (Import)</button>
              </div>

              <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-4 ck-border-b ck-border-gray-700 ck-bg-gray-800/50 ck-flex ck-justify-between items-center">
                    <h3 className="ck-font-bold ck-text-white">Danh sách Nguyên Vật Liệu (Ingredients)</h3>
                    <button className="ck-text-yellow-400 ck-font-bold text-xs bg-transparent border-none ck-cursor-pointer">+ Thêm Nguyên liệu mới</button>
                  </div>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-5">Mã NL (ID)</th><th className="ck-py-4 ck-px-5">Tên Nguyên Liệu</th><th className="ck-py-4 ck-px-5 ck-text-center">Đơn vị gốc</th><th className="ck-py-4 ck-px-5 ck-text-center">Quy đổi</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {inventory.length > 0 ? inventory.map((item, idx) => (
                        <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                          <td className="ck-py-4 ck-px-5 ck-font-mono ck-text-gray-400">{item.ingredientId || item.id || `ING_00${idx+1}`}</td>
                          <td className="ck-py-4 ck-px-5 ck-font-bold">{item.ingredientName || item.name}</td>
                          <td className="ck-py-4 ck-px-5 ck-text-center ck-text-yellow-400 ck-font-bold">{item.unit || 'KG'}</td>
                          <td className="ck-py-4 ck-px-5 ck-text-center"><button className="ck-text-gray-400 hover:ck-text-white ck-bg-gray-700 ck-px-3 ck-py-1 ck-rounded-md ck-border-none ck-cursor-pointer ck-text-xs">Sửa đơn vị</button></td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="ck-py-8 ck-text-center ck-text-gray-500">Đang tải danh sách hoặc chưa có nguyên liệu nào. (Gọi API /api/ingredients)</td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

        {/* ================== 4. TAB PHÂN TÍCH CHI PHÍ ================== */}
        {activeManagementTab === 'Phân tích chi phí' && (
          <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
            <div className="ck-flex ck-justify-between ck-items-center">
              <h2 className="ck-text-2xl ck-font-black ck-text-white">Báo cáo Phân tích Chi phí</h2>
              <div className="ck-flex ck-gap-3">
                <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-cursor-pointer">
                  📥 Tải Báo Cáo ({expenses.length} phiếu chi)
                </button>
              </div>
            </div>

            <div className="ck-grid ck-grid-cols-4 ck-gap-4">
              {kpiStats && kpiStats.totalRevenueToday !== undefined ? (
                  <>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Doanh thu hôm nay</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-blue-400">{kpiStats.totalRevenueToday?.toLocaleString()} ₫</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Doanh thu tháng này</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-green-400">{kpiStats.totalRevenueThisMonth?.toLocaleString()} ₫</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Số đơn hôm nay</h4>
                      <p className="ck-text-3xl ck-font-black ck-text-orange-400">{kpiStats.totalOrdersToday}</p>
                    </div>
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">Trạng thái</h4>
                      <p className="ck-text-xl ck-font-black ck-text-white">Hoạt động tốt</p>
                    </div>
                  </>
              ) : (
                <div className="ck-col-span-4 ck-text-center ck-text-gray-500 ck-py-4">Đang tải chỉ số phân tích...</div>
              )}
            </div>

            <div className="ck-grid ck-grid-cols-3 ck-gap-6">
              <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '350px' }}>
                <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Xu hướng chi phí giao dịch</h3>
                <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-bg-gray-800/50">
                  <span className="ck-text-gray-500">Dữ liệu sẵn sàng từ {expenses.length} bản ghi thực tế</span>
                </div>
              </div>

              <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
                <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Cơ cấu Chi phí (%)</h3>
                <div className="ck-flex-1 ck-overflow-y-auto ck-scrollbar ck-pr-2">
                  {costStructureArray.length > 0 && totalExpenseVal > 0 ? (
                    <div className="ck-space-y-4">
                      {costStructureArray.map((item, i) => {
                        const percent = ((item.value / totalExpenseVal) * 100).toFixed(1);
                        return (
                          <div key={i}>
                            <div className="ck-flex ck-justify-between ck-text-xs ck-mb-1">
                              <span className="ck-text-gray-400">{item.name}</span>
                              <span className="ck-text-white ck-font-bold">{percent}%</span>
                            </div>
                            <div className="ck-w-full ck-bg-gray-800 ck-rounded-full ck-h-1.5">
                              <div className="ck-bg-blue-500 ck-h-1.5 ck-rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ck-h-full ck-flex ck-items-center ck-justify-center ck-text-gray-600 italic text-sm">
                      Chưa có dữ liệu phân bổ chi phí
                    </div>
                  )}
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
                  className="ck-btn ck-px-5 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-shadow-lg ck-cursor-pointer"
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
                          <td className="ck-py-4 ck-px-5 ck-text-center"><button className="ck-btn ck-px-4 ck-py-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-rounded-lg ck-font-bold ck-text-xs ck-border-none ck-cursor-pointer">Tải xuống ⬇</button></td>
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

          {/* ================== 6. TAB QUẢN LÝ CÔNG THỨC================== */}
          {activeManagementTab === 'Quản lý công thức' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
                  <input 
                    type="text" 
                    placeholder="🔍 Tìm món ăn để cấu hình công thức..." 
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none ck-text-white placeholder-gray-400" 
                    style={{ backgroundColor: '#1f2937' }}
                    defaultValue={recipeSearchText} 
                    onChange={(e) => setRecipeSearchText(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') setRecipeAppliedSearch(e.target.value); }} 
                  />
                  <button onClick={() => setRecipeAppliedSearch(recipeSearchText)} className="ck-bg-gray-900 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0 ck-cursor-pointer">
                    Tìm kiếm
                  </button>
                </div>
              </div>
              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                
                {/* CỘT TRÁI: DANH SÁCH MÓN ĂN (Từ API Products) */}
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: activeRecipeProduct ? '50%' : '100%' }}>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4">Mã Món (Product ID)</th><th className="ck-py-4 ck-px-4">Tên Món Ăn</th><th className="ck-py-4 ck-px-4 ck-text-center">Hành động</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {masterProducts.filter(prod => {
                          const isSoftDeleted = prod.is_active === false || prod.isActive === false || String(prod.is_active) === "0" || String(prod.isActive) === "0";
                          if (isSoftDeleted) return false; 

                          let matchText = true;
                          const safeId = String(prod.product_id || prod.productId || prod.id || "");
                          const safeName = String(prod.product_name || prod.productName || prod.name || "");

                          if (recipeAppliedSearch) {
                              matchText = safeId.toLowerCase().includes(recipeAppliedSearch.toLowerCase()) || 
                                          safeName.toLowerCase().includes(recipeAppliedSearch.toLowerCase());
                          }
                          return matchText;
                      }).map((product, idx) => (
                        <tr key={idx} onClick={() => handleSelectProductForRecipe(product)} className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${activeRecipeProduct?.product_id === product.product_id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}>
                          <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{product.product_id || product.productId || product.id}</td>
                          <td className="ck-py-4 ck-px-4"><span className="ck-font-bold">{product.product_name || product.productName || product.name}</span></td>
                          <td className="ck-py-4 ck-px-4 ck-text-center"><button className="ck-text-orange-400 ck-font-bold ck-text-xs ck-bg-transparent ck-border-none ck-cursor-pointer">Xem BOM →</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CỘT PHẢI: CHI TIẾT CÔNG THỨC (Gọi API GET /api/recipes/{id}) */}
                {activeRecipeProduct && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-flex ck-flex-col ck-animate-fade-in" style={{ width: '50%', maxHeight: '600px' }}>
                    <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                      <div><h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-1">Định mức nguyên liệu (BOM)</h3><p className="ck-text-sm ck-text-orange-400 ck-font-semibold">{activeRecipeProduct.product_name || activeRecipeProduct.name}</p></div>
                      <button onClick={() => setActiveRecipeProduct(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                      {isLoadingRecipe ? (
                        <div className="ck-text-center ck-py-10 ck-text-gray-500">Đang tải dữ liệu công thức...</div>
                      ) : (!recipeDetail || !recipeDetail.ingredients || recipeDetail.ingredients.length === 0) ? (
                        <div className="ck-text-center ck-py-10 ck-text-gray-500"><p className="ck-mb-2 ck-text-3xl">🫙</p><p>Món này chưa có công thức.</p></div>
                      ) : (
                        <div className="ck-space-y-3">
                          {recipeDetail.ingredients.map((ing, i) => (
                            <div key={i} className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between">
                              <div className="ck-flex-1"><p className="ck-text-white ck-font-semibold">{ing.ingredientName || ing.name}</p><p className="ck-text-xs ck-font-mono ck-text-gray-400">{ing.ingredientId || ing.id}</p></div>
                              <div className="ck-flex ck-items-center ck-gap-2 ck-w-1/3"><input type="number" defaultValue={ing.amountNeeded || ing.qty} readOnly className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-lg ck-border ck-border-gray-600 ck-outline-none ck-text-right ck-font-mono" /><span className="ck-text-sm ck-text-gray-400 ck-w-8">{ing.unit || 'g'}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="ck-w-full ck-mt-4 ck-py-3 ck-rounded-xl ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer shadow-lg shadow-orange-500/20">Cập nhật Cấu hình BOM</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 7. TAB CHI PHÍ NHẬP HÀNG (UI MỚI 100%) ================== */}
          {activeManagementTab === 'Chi phí nhập hàng' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in w-full">
              {/* DASHBOARD CHI PHÍ TỔNG HỢP */}
              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center shadow-lg">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Ước tính Tổng vốn (COGS)</h4>
                    <p className="ck-text-2xl ck-font-black ck-text-red-400">{ingredientExpenseVal.toLocaleString()} ₫</p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-red-500/20 ck-flex ck-items-center ck-justify-center ck-text-2xl">💰</div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center shadow-lg">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Số lượng Nguyên liệu</h4>
                    <p className="ck-text-2xl ck-font-black ck-text-white">{inventory.length} Loại</p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">📦</div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center shadow-lg">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Biên lợi nhuận dự kiến</h4>
                    <p className="ck-text-2xl ck-font-black ck-text-green-400">~ 35%</p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">📈</div>
                </div>
              </div>

              {/* THANH TÌM KIẾM */}
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input 
                    type="text" 
                    placeholder="🔍 Tra cứu giá vốn theo tên món ăn..." 
                    className="ck-w-full ck-px-4 ck-py-3 ck-outline-none ck-text-white placeholder-gray-400 text-sm"
                    style={{ backgroundColor: '#1f2937' }}
                    onChange={(e) => setExpenseSearchText(e.target.value)}
                  />
                  <button className="ck-bg-gray-900 hover:ck-bg-gray-700 ck-text-red-400 ck-px-8 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0 ck-cursor-pointer">
                    Tìm kiếm
                  </button>
                </div>
                <button onClick={() => setActiveManagementTab('Tổng quan tồn kho')} className="ck-btn ck-px-6 ck-py-3 ck-bg-red-500 hover:ck-bg-red-600 ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-cursor-pointer shadow-lg shadow-red-500/20 transition-colors">
                  + Đi tới Nhập kho (API)
                </button>
              </div>

              {/* BẢNG DỮ LIỆU */}
              <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden shadow-2xl">
                <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-bg-gray-800/50">
                  <h3 className="ck-text-lg ck-font-bold ck-text-white">Phân tích Giá vốn Sản phẩm Master</h3>
                </div>
                <div className="ck-overflow-x-auto">
                  <table className="ck-w-full ck-text-left ck-border-collapse min-w-full">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-xs ck-uppercase tracking-wider">
                      <tr>
                        <th className="ck-p-5 whitespace-nowrap">Mã Món</th>
                        <th className="ck-p-5 min-w-[200px]">Tên Sản Phẩm</th>
                        <th className="ck-p-5 ck-text-center whitespace-nowrap">Giá Vốn (Cost)</th>
                        <th className="ck-p-5 ck-text-center whitespace-nowrap">Giá Franchise</th>
                        <th className="ck-p-5 ck-text-right whitespace-nowrap">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {masterProducts.filter(p => (p.product_name || "").toLowerCase().includes(expenseSearchText.toLowerCase())).map((p, idx) => {
                        const margin = (p.selling_price || 0) - (p.cost_price || 0);
                        return (
                          <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors">
                            <td className="ck-p-5 ck-font-mono ck-text-gray-400">{p.product_id}</td>
                            <td className="ck-p-5 ck-font-bold">{p.product_name}</td>
                            <td className="ck-p-5 ck-text-center ck-text-red-400 ck-font-bold">{Number(p.cost_price).toLocaleString()} ₫</td>
                            <td className="ck-p-5 ck-text-center ck-text-blue-400">{Number(p.selling_price).toLocaleString()} ₫</td>
                            <td className="ck-p-5 ck-text-right">
                              <span className={`ck-font-bold ${margin > 0 ? 'ck-text-green-400' : 'ck-text-red-400'}`}>
                                +{margin.toLocaleString()} ₫
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {masterProducts.length === 0 && (
                        <tr><td colSpan="5" className="ck-p-10 ck-text-center ck-text-gray-500 italic">Chưa có dữ liệu sản phẩm để phân tích.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================== TAB CHÍNH: CỬA HÀNG FRANCHISE ================== */}
          {activeManagementTab === 'Cửa hàng Franchise' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
              {!selectedStore ? (
                <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                  {stores.map(store => (
                    <div key={store.id} 
                         onClick={() => setSelectedStore(store)} 
                         className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl hover:ck-border-red-500 ck-transition-all ck-cursor-pointer group shadow-xl">
                      <div className="ck-flex ck-justify-between ck-mb-4">
                        <div className="ck-p-3 ck-bg-gray-800 ck-rounded-xl">
                          <Store className="ck-text-red-400" size={32} />
                        </div>
                        <span className={`ck-badge ${store.isActive !== false ? 'ck-badge-green' : 'ck-badge-red'} ck-h-fit`}>
                          {store.isActive !== false ? 'Đang chạy' : 'Tạm dừng'}
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
                              className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold border-none shadow-lg shadow-red-500/20 ck-flex ck-items-center ck-gap-2 ck-cursor-pointer">
                        <Plus size={20} /> Tạo đơn đặt hộ
                      </button>
                    )}
                  </div>

                  {isOrderingForStore ? (
                    <div className="ck-grid ck-grid-cols-3 ck-gap-6 ck-animate-slide-up">
                      <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-p-8">
                        <div className="ck-flex ck-justify-between ck-mb-8 items-center">
                          <h3 className="ck-text-2xl ck-font-black ck-text-white">Thực đơn Bếp Tổng</h3>
                          <div className="ck-relative">
                            <Search className="ck-absolute ck-left-4 ck-top-1/2 ck--translate-y-1/2 ck-text-gray-500" size={18} />
                            {/* Input search trong suốt */}
                            <input 
                              type="text" 
                              placeholder="Tìm tên món ăn..." 
                              className="ck-input ck-pl-12 ck-w-64 ck-bg-transparent ck-text-white" 
                              onChange={(e) => setSearchTermHộ(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="ck-grid ck-grid-cols-2 ck-gap-4 ck-max-h-[500px] ck-overflow-y-auto ck-scrollbar ck-pr-2">
                          {masterProducts
                            .filter(p => p.product_name && p.product_name.toLowerCase().includes(searchTermHộ.toLowerCase()))
                            .map(p => (
                            <div key={p.product_id} className="ck-bg-gray-800 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center hover:ck-bg-gray-700 ck-transition-colors ck-border ck-border-transparent hover:ck-border-red-500/50">
                              <div className="ck-flex ck-gap-4">
                                <div>
                                  <p className="ck-font-bold ck-text-white text-sm">{p.product_name}</p>
                                  <p className="ck-text-xs ck-text-blue-400 ck-mono mt-1">{Number(p.selling_price || 0).toLocaleString()}đ</p>
                                </div>
                              </div>
                              <button onClick={() => addToCart(p)} className="ck-w-10 ck-h-10 ck-bg-red-500 ck-rounded-xl border-none ck-text-white ck-font-black ck-cursor-pointer hover:ck-scale-110 ck-transition-transform">+</button>
                            </div>
                          ))}
                        </div>
                      </div>

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
                            <div key={item.product_id} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800 ck-p-3 ck-rounded-xl">
                              <div className="ck-flex-1">
                                <p className="ck-text-white ck-font-bold text-xs">{item.product_name}</p>
                                <p className="ck-text-[10px] ck-text-gray-500">{item.quantity} x {Number(item.selling_price || 0).toLocaleString()}đ</p>
                              </div>
                              <span className="ck-text-red-400 ck-font-black ck-mono">{(Number(item.selling_price || 0) * item.quantity).toLocaleString()}đ</span>
                            </div>
                          ))}
                        </div>
                        <div className="ck-border-t ck-border-gray-800 ck-pt-6 ck-space-y-4">
                          <textarea 
                            placeholder="Ghi chú quan trọng cho Bếp..." 
                            className="ck-input ck-w-full ck-h-20 ck-bg-transparent ck-text-white" 
                            onChange={(e) => setOrderNote(e.target.value)} 
                          />
                          <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                             <span className="ck-text-gray-400 ck-font-bold">TỔNG CỘNG:</span>
                             <span className="ck-text-2xl ck-font-black ck-text-orange-400">
                               {cart.reduce((s, i) => s + Number(i.selling_price || 0) * i.quantity, 0).toLocaleString()}đ
                             </span>
                          </div>
                          <button onClick={handleCreateOrderHộ} className="ck-w-full ck-py-4 ck-bg-red-600 ck-text-white ck-rounded-2xl ck-font-black ck-text-lg border-none shadow-lg ck-cursor-pointer hover:ck-bg-red-700 transition-colors">GỬI ĐƠN ĐẶT HỘ</button>
                        </div>
                      </div>
                    </div>
                  ) : (
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