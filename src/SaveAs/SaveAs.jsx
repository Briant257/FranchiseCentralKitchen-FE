import React, { useState, useCallback,useEffect } from 'react';
import { Eye, ChefHat, LogOut } from "../../components/icons/Icons";
import api from "../../services/api"; 

const CentralKitchenPage = ({ onLogout, userData }) => {
  // 1. STATE CHUNG
  const [activeKitchenTab, setActiveKitchenTab] = useState("Tổng Quan");
  const [kitchenSubTab, setKitchenSubTab] = useState("categories");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [selectedRecipeRun, setSelectedRecipeRun] = useState(null);

  // Dữ liệu từ API
  const [productionRuns, setProductionRuns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // ==========================================
  // 2. FETCH DATA TỪ API (ĐÃ BỎ MOCK DATA)
  // ==========================================
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [runsData, catsData, prodsData, ingsData, incsData] = await Promise.all([
        api.getProductionRuns().catch(() => []),
        api.getCategories().catch(() => []),
       api.getMasterProducts().catch(() => []),
        api.getIngredients().catch(() => []),
        api.getIncidents().catch(() => [])
      ]);
  
      // CHỈNH SỬA: Không dùng mockRuns nữa, lấy trực tiếp từ API
      setProductionRuns(Array.isArray(runsData) ? runsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      setIngredients(Array.isArray(ingsData) ? ingsData : []);
      setIncidents(Array.isArray(incsData) ? incsData : []);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ==========================================
  // LÓGIC TÍNH TOÁN THỐNG KÊ (MỚI)
  // ==========================================
  const stats = {
    totalRequested: productionRuns.reduce((sum, run) => sum + (run.planned_qty || 0), 0),
    cooking: productionRuns.filter(r => r.status === 'COOKING').length,
    completed: productionRuns.filter(r => r.status === 'COMPLETED').length,
    incidentCount: incidents.filter(i => i.status !== 'Đã giải quyết').length
  };


  // ==========================================
  // 3. XỬ LÝ TRẠNG THÁI NẤU (PRODUCTION RUNS)
  // ==========================================
  const handleUpdateRunStatus = async (id, newStatus) => {
    try {
      await api.updateProductionRunStatus(id, newStatus);
      await loadData(); // Gọi load lại dữ liệu từ API
    } catch (err) {
      setErrorModal({ show: true, message: err.message || "Lỗi hệ thống khi cập nhật trạng thái!" });
    }
  };

  useEffect(() => {
  loadData();
}, [loadData]);

  // ==========================================
  // 4. CRUD KHO BẾP & SỰ CỐ (CHUYỂN HÀM SANG GỌI API)
  // ==========================================
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ product_id: "", product_name: "", category_id: "", selling_price: "", emoji: "🥪" });

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: "", name: "", unit: "kg", kitchen_stock: "" });

  const [showAddIncidentForm, setShowAddIncidentForm] = useState(false);
  const [newIncidentForm, setNewIncidentForm] = useState({ type: "Thiết bị", priority: "Trung bình", title: "", reporter: "", description: "" });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentSearchText, setIncidentSearchText] = useState("");
  const [incidentAppliedSearch, setIncidentAppliedSearch] = useState("");
  const [filterIncidentPriority, setFilterIncidentPriority] = useState("Mức độ ưu tiên");

  // ---- XỬ LÝ DANH MỤC ----
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return alert("Vui lòng nhập tên danh mục!");
    try {
      if (editingCategory) await api.updateCategory(editingCategory.category_id, { name: newCategoryName });
      else await api.createCategory({ name: newCategoryName });
      setShowAddCategory(false); setNewCategoryName(""); loadData();
    } catch (err) { alert("Lỗi lưu danh mục!"); }
  };
  const handleDeleteCategory = async (catId) => { 
    if(window.confirm("Xóa danh mục này?")) { try { await api.deleteCategory(catId); loadData(); } catch(e) { alert("Lỗi xóa danh mục!"); } }
  };

  // ---- XỬ LÝ SẢN PHẨM ----
  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert("Vui lòng điền Tên và Giá!");
    try {
      if (editingProduct) await api.updateProduct(editingProduct.product_id, newProduct);
      else await api.createProduct(newProduct);
      setShowAddProduct(false); loadData();
    } catch (err) { alert("Lỗi lưu sản phẩm!"); }
  };
  const handleDeleteProduct = async (prodId) => { 
    if(window.confirm("Xóa sản phẩm này?")) { try { await api.deleteProduct(prodId); loadData(); } catch(e) { alert("Lỗi xóa sản phẩm!"); } }
  };

  // ---- XỬ LÝ NGUYÊN LIỆU ----
  const handleSaveIngredient = async () => {
    if (!newIngredient.name || !newIngredient.ingredient_id) return alert("Vui lòng điền đủ thông tin!");
    try {
      if (editingIngredient) await api.updateIngredient(editingIngredient.ingredient_id, newIngredient);
      else await api.createIngredient(newIngredient);
      setShowAddIngredient(false); loadData();
    } catch (err) { alert("Lỗi lưu nguyên liệu!"); }
  };
  const handleDeleteIngredient = async (ingId) => { 
    if(window.confirm("Xóa lô nguyên liệu này?")) { try { await api.deleteIngredient(ingId); loadData(); } catch(e) { alert("Lỗi xóa nguyên liệu!"); } }
  };

  // ---- XỬ LÝ SỰ CỐ ----
  const handleSaveNewIncident = async () => {
    if (!newIncidentForm.title || !newIncidentForm.reporter) return alert("Điền tiêu đề và người báo cáo!");
    try {
      await api.createIncident(newIncidentForm);
      setShowAddIncidentForm(false);
      setNewIncidentForm({ type: "Thiết bị", priority: "Trung bình", title: "", reporter: "", description: "" });
      loadData();
    } catch (err) { alert("Lỗi gửi báo cáo sự cố!"); }
  };

  const handleUpdateIncidentStatus = async (incId, newStatus) => {
    try {
      await api.updateIncidentStatus(incId, newStatus);
      await loadData();
      setSelectedIncident(prev => prev ? ({ ...prev, status: newStatus }) : null);
    } catch (err) { alert("Lỗi cập nhật sự cố!"); }
  };

  const filteredIncidents = incidents.filter(i => {
    let matchText = true;
    if (incidentAppliedSearch) {
      const kw = incidentAppliedSearch.toLowerCase();
      matchText = i.id?.toString().toLowerCase().includes(kw) || i.title?.toLowerCase().includes(kw);
    }
    return matchText && (filterIncidentPriority === "Mức độ ưu tiên" || i.priority === filterIncidentPriority);
  });

  // ==========================================
  // RENDER GIAO DIỆN (GIỮ NGUYÊN 100% UI GỐC CỦA BẠN)
  // ==========================================
  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-z-10 ck-pb-4 ck-border-b ck-border-gray-800">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <ChefHat className="ck-text-white" size={32} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight ck-mb-1">Hệ thống Bếp Trung Tâm</h1>
            <p className="ck-text-xs ck-text-gray-400 ck-font-medium ck-tracking-wider ck-uppercase">Điều phối & Sản xuất</p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
             <p className="ck-text-sm ck-font-bold ck-text-white">{userData?.name || "Bếp Trưởng"}</p>
             <p className="ck-text-xs ck-text-red-400">Trưởng ca điều phối</p>
          </div>
          <button onClick={onLogout} className="ck-btn ck-bg-gradient-btn-admin ck-text-white ck-px-5 ck-py-2.5 ck-rounded-xl ck-font-bold ck-border-none ck-transition-all ck-flex ck-items-center ck-gap-2 ck-shadow-lg">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="ck-flex ck-gap-6 ck-w-full ck-relative ck-z-10" style={{ minHeight: '800px' }}>
        
        {/* LEFT SIDEBAR */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col ck-justify-between" style={{ width: '20%', flexShrink: 0 }}>
          <ul className="ck-space-y-2 ck-flex-1 ck-mt-2" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {['Tổng Quan', 'Đơn', 'Xử lý sự cố'].map((item, idx) => (
              <li key={idx}>
                <button 
                  type="button"
                  onClick={() => { setActiveKitchenTab(item); setSelectedIncident(null); setShowAddIncidentForm(false); }}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${activeKitchenTab === item ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg" : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"}`}
                  style={activeKitchenTab !== item ? { border: 'none', background: 'transparent' } : { border: 'none' }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6 ck-min-w-0" style={{ width: '80%' }}>
          
         {/* ======================= TAB TỔNG QUAN ======================= */}
{activeKitchenTab === 'Tổng Quan' && (
  <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
    <div className="ck-grid ck-grid-cols-4 ck-gap-4">
      {[
        { label: 'Tổng suất ăn yêu cầu', value: stats.totalRequested, color: 'ck-text-blue-400' },
        { label: 'Mẻ đang nấu', value: stats.cooking, color: 'ck-text-orange-400' },
        { label: 'Mẻ đã hoàn thành', value: stats.completed, color: 'ck-text-green-400' },
        { label: 'Sự cố cần xử lý', value: stats.incidentCount, color: 'ck-text-red-400' }
      ].map((stat, idx) => (
        <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
          <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
          <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>

    {/* QUẢN LÝ KHO CHI TIẾT */}
    <div className="ck-mt-4 ck-pt-6 ck-border-t ck-border-gray-700">
      <h2 className="ck-text-2xl ck-font-black ck-text-white ck-mb-2 ck-text-left">Cài đặt & Quản lý Kho</h2>
      <div className="ck-flex ck-justify-start ck-gap-2 ck-mb-6 mt-4">
        <button type="button" onClick={() => {setKitchenSubTab("categories"); setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false);}} className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "categories" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`} style={kitchenSubTab !== "categories" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}>Danh mục sản phẩm</button>
        <button type="button" onClick={() => {setKitchenSubTab("products"); setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false);}} className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "products" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`} style={kitchenSubTab !== "products" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}>Sản phẩm bếp TT</button>
        <button type="button" onClick={() => {setKitchenSubTab("ingredients"); setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false);}} className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "ingredients" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`} style={kitchenSubTab !== "ingredients" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}>Nguyên liệu & Lô SX</button>
      </div>

      <div className="ck-flex ck-gap-6 ck-items-start">
        <div className={`ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ${ (showAddCategory || showAddProduct || showAddIngredient) ? 'ck-w-2/3' : 'ck-w-full' }`}>
          
          {/* BẢNG DANH MỤC */}
          {kitchenSubTab === "categories" && (
            <>
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                <h3 className="ck-text-xl ck-font-bold ck-text-white">Danh mục sản phẩm</h3>
                <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600" onClick={() => { setShowAddCategory(true); setEditingCategory(null); setNewCategoryName(""); }}>+ Thêm mới</button>
              </div>
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr><th className="ck-py-4 ck-px-6">STT</th><th className="ck-py-4 ck-px-6">Tên danh mục</th><th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th></tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {categories.map((cat, idx) => (
                    <tr key={cat.category_id || idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                      <td className="ck-py-4 ck-px-6 ck-text-gray-400">{idx + 1}</td>
                      <td className="ck-py-4 ck-px-6 ck-font-semibold">{cat.name}</td>
                      <td className="ck-py-4 ck-px-6 ck-text-center">
                        <div className="ck-flex ck-justify-center ck-gap-3">
                          <button onClick={() => { setEditingCategory(cat); setShowAddCategory(true); setNewCategoryName(cat.name); }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                          <button onClick={() => handleDeleteCategory(cat.category_id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* BẢNG SẢN PHẨM */}
          {kitchenSubTab === "products" && (
            <>
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                <h3 className="ck-text-xl ck-font-bold ck-text-white">Sản phẩm bếp trung tâm</h3>
                <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600" onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ product_id: "", product_name: "", category: categories[0]?.name || "", selling_price: "", kitchen_stock: "", min_threshold: "", emoji: "🥪" }); }}>+ Thêm mới</button>
              </div>
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr><th className="ck-py-4 ck-px-6">Mã</th><th className="ck-py-4 ck-px-6">Sản phẩm</th><th className="ck-py-4 ck-px-6">Giá</th><th className="ck-py-4 ck-px-6">Tồn</th><th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th></tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {products.map((p) => (
                    <tr key={p.product_id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                      <td className="ck-py-4 ck-px-6 ck-text-gray-400">{p.product_id}</td>
                      <td className="ck-py-4 ck-px-6 ck-font-semibold">{p.emoji || '🍽️'} {p.product_name} <span className="ck-block ck-text-xs ck-text-gray-500">{p.category}</span></td>
                      <td className="ck-py-4 ck-px-6 ck-text-blue-400">{Number(p.selling_price).toLocaleString()}₫</td>
                      <td className="ck-py-4 ck-px-6">{p.kitchen_stock || 0}</td>
                      <td className="ck-py-4 ck-px-6 ck-text-center">
                        <div className="ck-flex ck-justify-center ck-gap-3">
                          <button onClick={() => { setEditingProduct(p); setShowAddProduct(true); setNewProduct(p); }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                          <button onClick={() => handleDeleteProduct(p.product_id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* BẢNG NGUYÊN LIỆU */}
          {kitchenSubTab === "ingredients" && (
            <>
              <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                <h3 className="ck-text-xl ck-font-bold ck-text-white">Quản lý Lô Nguyên liệu</h3>
                <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600" onClick={() => { setShowAddIngredient(true); setEditingIngredient(null); setNewIngredient({ ingredient_id: "", name: "", batch: "", exp: "", kitchen_stock: "", unit: "kg", status: "Còn hạn" }); }}>+ Nhập lô mới</button>
              </div>
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr><th className="ck-py-4 ck-px-6">Tên NL</th><th className="ck-py-4 ck-px-6">Mã NL</th><th className="ck-py-4 ck-px-6">Tồn Bếp</th><th className="ck-py-4 ck-px-6">Đơn vị</th><th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th></tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {ingredients.map((ing) => (
                    <tr key={ing.ingredient_id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                      <td className="ck-py-4 ck-px-6 ck-font-semibold">{ing.name}</td>
                      <td className="ck-py-4 ck-px-6 ck-text-blue-400 ck-font-mono">{ing.ingredient_id}</td>
                      <td className="ck-py-4 ck-px-6">{Number(ing.kitchen_stock).toLocaleString()}</td>
                      <td className="ck-py-4 ck-px-6 ck-text-gray-400">{ing.unit}</td>
                      <td className="ck-py-4 ck-px-6 ck-text-center">
                        <div className="ck-flex ck-justify-center ck-gap-3">
                          <button onClick={() => { setEditingIngredient(ing); setShowAddIngredient(true); setNewIngredient(ing); }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                          <button onClick={() => handleDeleteIngredient(ing.ingredient_id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

                  {/* FORM CRUD BÊN PHẢI CHO KHO */}
                  {(showAddCategory || showAddProduct || showAddIngredient) && (
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-animate-fade-in ck-w-1/3">
                      <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                        <h3 className="ck-text-xl ck-font-bold ck-text-white">
                          {showAddCategory ? (editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục') : ''}
                          {showAddProduct ? (editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm') : ''}
                          {showAddIngredient ? (editingIngredient ? 'Sửa Lô Nguyên Liệu' : 'Nhập Lô Nguyên Liệu') : ''}
                        </h3>
                        <button onClick={() => {setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false);}} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer">✕</button>
                      </div>

                      {showAddCategory && (
                        <div className="ck-space-y-4">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên danh mục</label>
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà quay..." />
                          </div>
                          <button onClick={handleSaveCategory} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu thay đổi</button>
                        </div>
                      )}

                      {showAddProduct && (
                        <div className="ck-space-y-4">
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/4">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Icon</label>
                              <input type="text" value={newProduct.emoji} onChange={(e) => setNewProduct({...newProduct, emoji: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-text-center ck-outline-none" />
                            </div>
                            <div className="ck-w-3/4">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên sản phẩm *</label>
                              <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà truyền thống" />
                            </div>
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Danh mục</label>
                            <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none">
                              <option value="">Chọn danh mục...</option>
                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Giá bán (VNĐ) *</label>
                            <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                          </div>
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tồn kho</label>
                              <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Định mức Min</label>
                              <input type="number" value={newProduct.min} onChange={(e) => setNewProduct({...newProduct, min: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none" placeholder="0" />
                            </div>
                          </div>
                          <button onClick={handleSaveProduct} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu sản phẩm</button>
                        </div>
                      )}

                      {showAddIngredient && (
                        <div className="ck-space-y-4">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên nguyên liệu *</label>
                            <input type="text" value={newIngredient.name} onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà thả vườn" />
                          </div>
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mã lô (Batch ID) *</label>
                              <input type="text" value={newIngredient.batch} onChange={(e) => setNewIngredient({...newIngredient, batch: e.target.value.toUpperCase()})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-mono ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="B-260..." />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Hạn sử dụng (EXP) *</label>
                              <input type="date" value={newIngredient.exp} onChange={(e) => setNewIngredient({...newIngredient, exp: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" />
                            </div>
                          </div>
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-2/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Số lượng nhập</label>
                              <input type="number" value={newIngredient.stock} onChange={(e) => setNewIngredient({...newIngredient, stock: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn vị</label>
                              <select value={newIngredient.unit} onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                                <option value="kg">kg</option><option value="g">g</option><option value="lít">lít</option><option value="bao">bao</option><option value="thùng">thùng</option>
                              </select>
                            </div>
                          </div>
                          <button onClick={handleSaveIngredient} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu lô hàng</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          
          {/* ======================= TAB ĐƠN - XEM CÔNG THỨC & NẤU ======================= */}
{activeKitchenTab === 'Đơn' && (
  <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
    <div className="ck-flex ck-justify-between ck-items-center">
      <div className="ck-flex ck-gap-4 ck-items-center">
        <h2 className="ck-text-2xl ck-font-black ck-text-white">Phiếu yêu cầu nấu</h2>
        <span className="ck-text-xs ck-text-gray-500 ck-bg-gray-800 ck-px-3 ck-py-1 ck-rounded-full">Cập nhật: {lastUpdated.toLocaleTimeString()}</span>
      </div>
      <button onClick={loadData} disabled={isRefreshing} className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex ck-items-center ck-gap-2 cursor-pointer border-none">
        {isRefreshing ? "⏳ Đang tải..." : "🔄 Làm mới ngay"}
      </button>
    </div>

    <div className="ck-grid ck-grid-cols-3 ck-gap-6">
      {productionRuns.length === 0 ? (
          <p className="ck-text-gray-400">Không có đơn cần nấu.</p>
      ) : productionRuns.map((run) => {
        // Map theo DB: actual_qty / planned_qty
        const progressPercent = Math.round((Number(run.actual_qty || 0) / Number(run.planned_qty)) * 100) || 0;
        return (
          <div key={run.run_id} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col ck-justify-between ck-card-hover">
            <div>
              <div className="ck-flex ck-justify-between ck-items-start ck-mb-4">
                <div className="ck-flex ck-items-center ck-gap-2">
                  <h3 className="ck-text-lg ck-font-bold ck-text-white">{run.product_name || "Mẻ nấu mới"}</h3>
                  <button 
                      onClick={() => setSelectedRecipeRun(run)}
                      className="ck-p-1.5 ck-bg-gray-800 ck-text-gray-400 hover:ck-text-blue-400 ck-rounded-lg ck-transition-colors ck-border-none ck-cursor-pointer"
                      title="Xem công thức & định mức"
                  >
                      <Eye size={16} />
                  </button>
                </div>
                <span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-[10px] ck-font-bold ck-border ${
                  run.status === 'PLANNED' ? 'ck-bg-gray-800 ck-text-gray-400 ck-border-gray-600' :
                  run.status === 'COOKING' ? 'ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50 ck-animate-pulse' :
                  'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'
                }`}>
                  {run.status === 'PLANNED' ? 'CHỜ NẤU' : run.status === 'COOKING' ? 'ĐANG NẤU' : 'XONG'}
                </span>
              </div>
              
              <div className="ck-flex ck-items-end ck-gap-2 ck-mb-4">
                <span className="ck-text-4xl ck-font-black ck-text-blue-400">{run.planned_qty}</span>
                <span className="ck-text-sm ck-text-gray-400 ck-pb-1">phần ăn</span>
              </div>

              <div className="ck-mb-5">
                <div className="ck-flex ck-justify-between ck-text-[11px] ck-mb-1.5">
                  <span className="ck-text-gray-400 uppercase tracking-wider">Tiến độ nấu</span>
                  <span className="ck-text-white ck-font-bold">{run.actual_qty || 0}/{run.planned_qty}</span>
                </div>
                <div className="ck-w-full ck-bg-gray-800 ck-rounded-full ck-h-2">
                  <div className={`ck-h-2 ck-rounded-full ck-transition-all ck-duration-700 ${progressPercent === 100 ? 'ck-bg-green-500' : 'ck-bg-orange-500'}`} style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              <div className="ck-bg-gray-800/50 ck-rounded-xl ck-p-3 ck-mb-4">
                <span className="ck-text-[10px] ck-text-gray-500 ck-mb-2 ck-block ck-font-bold ck-uppercase">Thông tin lô hàng:</span>
                <div className="ck-flex ck-justify-between ck-items-center ck-text-xs">
                   <span className="ck-text-gray-300">Mã lô: {run.batch_code || 'N/A'}</span>
                   <span className="ck-text-white ck-font-bold">HSD: {run.expiry_date || '---'}</span>
                </div>
              </div>
            </div>

            <div className="ck-mt-2">
              {run.status === 'PLANNED' && (
                <button onClick={() => handleUpdateRunStatus(run.run_id, 'COOKING')} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors cursor-pointer">🔥 Bắt đầu nấu</button>
              )}
              {run.status === 'COOKING' && (
                <button onClick={() => handleUpdateRunStatus(run.run_id, 'COMPLETED')} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors cursor-pointer">✅ Hoàn thành mẻ</button>
              )}
              {run.status === 'COMPLETED' && (
                <button disabled className="ck-w-full ck-bg-gray-800 ck-text-gray-600 ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-opacity-50">Đã xong</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}

          {/* ======================= TAB XỬ LÝ SỰ CỐ ======================= */}
          {activeKitchenTab === 'Xử lý sự cố' && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input type="text" placeholder="🔍 Tìm kiếm mã sự cố..." className="ck-w-full ck-px-4 ck-py-2 ck-outline-none ck-bg-transparent ck-text-white" defaultValue={incidentSearchText} onChange={(e) => setIncidentSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setIncidentAppliedSearch(e.target.value); }} />
                  <button onClick={() => setIncidentAppliedSearch(incidentSearchText)} className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0">Tìm kiếm</button>
                </div>
                <select value={filterIncidentPriority} onChange={(e) => setFilterIncidentPriority(e.target.value)} className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer">
                  <option value="Mức độ ưu tiên">Mức độ ưu tiên</option><option value="Khẩn cấp">Khẩn cấp</option><option value="Cao">Cao</option>
                </select>
                <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0 ck-border-none" onClick={() => { setShowAddIncidentForm(true); setSelectedIncident(null); }}>
                  + Báo cáo sự cố mới
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300" style={{ width: (selectedIncident || showAddIncidentForm) ? '66.66%' : '100%' }}>
                  <table className="ck-w-full ck-text-center ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr><th className="ck-py-4 ck-px-4 ck-font-semibold">Mã SC</th><th className="ck-py-4 ck-px-4 ck-font-semibold">Phân loại</th><th className="ck-py-4 ck-px-4 ck-font-semibold">Tiêu đề</th><th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Mức độ</th><th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th></tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {filteredIncidents.length > 0 ? (
                        filteredIncidents.map((inc, idx) => (
                          <tr key={idx} onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}} className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedIncident?.id === inc.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-red-500' : ''}`}>
                            <td className="ck-py-4 ck-px-4 ck-font-bold">{inc.id}</td>
                            <td className="ck-py-4 ck-px-4">{inc.type}</td>
                            <td className="ck-py-4 ck-px-4 ck-font-semibold">{inc.title}</td>
                            <td className="ck-py-4 ck-px-4 ck-text-center">{inc.priority === 'Khẩn cấp' ? <span className="ck-text-red-500 ck-font-black">🔴 Khẩn cấp</span> : inc.priority === 'Cao' ? <span className="ck-text-orange-400 ck-font-bold">🟠 Cao</span> : <span className="ck-text-yellow-500 ck-font-semibold">🟡 Trung bình</span>}</td>
                            <td className="ck-py-4 ck-px-4">
                              <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${inc.status === 'Mới' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' : inc.status === 'Đang xử lý' ? 'ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50' : 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'}`}>{inc.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : ( <tr><td colSpan="5" className="ck-py-8 ck-text-center ck-text-gray-500">Không tìm thấy sự cố</td></tr> )}
                    </tbody>
                  </table>
                </div>

                {showAddIncidentForm && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Báo cáo sự cố</h3>
                      <button onClick={() => setShowAddIncidentForm(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4">
                      <div><label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tiêu đề sự cố *</label><input type="text" value={newIncidentForm.title} onChange={(e) => setNewIncidentForm({...newIncidentForm, title: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" /></div>
                      <div><label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Phân loại</label><select value={newIncidentForm.type} onChange={(e) => setNewIncidentForm({...newIncidentForm, type: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"><option value="Thiết bị">Thiết bị</option><option value="Nguyên liệu">Nguyên liệu</option><option value="Hệ thống">Hệ thống</option><option value="Vận chuyển">Vận chuyển</option></select></div>
                      <div><label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mức độ ưu tiên</label><select value={newIncidentForm.priority} onChange={(e) => setNewIncidentForm({...newIncidentForm, priority: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"><option value="Trung bình">Trung bình</option><option value="Cao">Cao</option><option value="Khẩn cấp">Khẩn cấp</option></select></div>
                      <div><label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Người báo cáo *</label><input type="text" value={newIncidentForm.reporter} onChange={(e) => setNewIncidentForm({...newIncidentForm, reporter: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" /></div>
                      <div><label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mô tả chi tiết</label><textarea value={newIncidentForm.description} onChange={(e) => setNewIncidentForm({...newIncidentForm, description: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none ck-min-h-[100px]"></textarea></div>
                      <button onClick={handleSaveNewIncident} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Gửi báo cáo</button>
                    </div>
                  </div>
                )}

                {selectedIncident && !showAddIncidentForm && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết {selectedIncident.id}</h3>
                      <button onClick={() => setSelectedIncident(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      {selectedIncident.priority === 'Khẩn cấp' && (<div className="ck-bg-red-500-20 ck-border ck-border-red-500-50 ck-p-3 ck-rounded-lg ck-text-red-400 ck-font-bold ck-flex ck-items-center ck-gap-2"><span className="ck-animate-pulse">⚠️</span> CẦN XỬ LÝ NGAY</div>)}
                      <div><span className="ck-text-gray-400 ck-block ck-mb-1">Vấn đề:</span><p className="ck-text-white ck-font-bold ck-text-lg">{selectedIncident.title}</p></div>
                      <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2"><span className="ck-text-gray-400">Thời gian báo:</span><span className="ck-text-white">{selectedIncident.time} - {selectedIncident.date}</span></div>
                      <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2"><span className="ck-text-gray-400">Người báo cáo:</span><span className="ck-text-white ck-font-semibold">{selectedIncident.reporter}</span></div>
                      <div className="ck-pt-2"><span className="ck-text-gray-400 ck-block ck-mb-2">Mô tả chi tiết:</span><p className="ck-text-gray-300 ck-bg-gray-800 ck-p-3 ck-rounded-lg">{selectedIncident.description || "Không có mô tả thêm."}</p></div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-flex-col ck-gap-3">
                      {selectedIncident.status === 'Mới' && (<button onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'Đang xử lý')} className="ck-w-full ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">🔧 Nhận xử lý</button>)}
                      {selectedIncident.status === 'Đang xử lý' && (<button onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'Đã giải quyết')} className="ck-w-full ck-bg-green-500 hover:ck-bg-green-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">✅ Đánh dấu Đã giải quyết</button>)}
                      {selectedIncident.status === 'Đã giải quyết' && (<div className="ck-w-full ck-bg-green-500-20 ck-text-green-400 ck-py-3 ck-rounded-xl ck-font-bold ck-text-center">Sự cố đã được khắc phục</div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL HIỂN THỊ CÔNG THỨC & ĐỊNH MỨC */}
{selectedRecipeRun && (
  <div className="ck-fixed ck-inset-0 ck-bg-black/90 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
    <div className="ck-bg-gray-900 ck-border ck-border-blue-500/30 ck-rounded-2xl ck-flex ck-flex-col ck-w-full ck-max-w-md ck-shadow-2xl">
      <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between ck-items-center">
        <div className="ck-flex ck-items-center ck-gap-3 text-white">
          <div className="ck-p-2 ck-bg-blue-500/20 ck-rounded-lg ck-text-blue-400"><ChefHat size={24} /></div>
          <div>
              <h3 className="ck-text-lg ck-font-bold">Định mức sản xuất (BOM)</h3>
              <p className="ck-text-xs ck-text-gray-500 uppercase">{selectedRecipeRun.product_name}</p>
          </div>
        </div>
        <button onClick={() => setSelectedRecipeRun(null)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer">✕</button>
      </div>
      
      <div className="ck-p-6 ck-flex-1 ck-overflow-y-auto ck-scrollbar" style={{ maxHeight: '60vh' }}>
        <div className="ck-bg-blue-500/10 ck-border ck-border-blue-500/20 ck-p-4 ck-rounded-xl ck-mb-6">
          <p className="ck-text-[11px] ck-text-blue-400 ck-font-bold ck-uppercase ck-mb-1">Tổng sản lượng cần nấu:</p>
          <p className="ck-text-2xl ck-font-black ck-text-white">{selectedRecipeRun.planned_qty} <span className="ck-text-sm ck-font-normal ck-text-gray-500">phần ăn</span></p>
        </div>

        <div className="ck-mb-6">
          <p className="ck-text-[11px] ck-text-gray-500 ck-font-bold ck-uppercase ck-mb-3">Nguyên liệu cần xuất kho:</p>
          <div className="ck-space-y-3">
              {/* Map theo bảng Formula: ingredient_id, amount_needed */}
              {selectedRecipeRun.formula ? selectedRecipeRun.formula.map((f, i) => {
                  const totalNeeded = (f.amount_needed * selectedRecipeRun.planned_qty).toFixed(2);
                  return (
                      <div key={i} className="ck-bg-gray-800/50 ck-border ck-border-gray-800 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between text-white">
                          <span className="ck-text-sm ck-text-gray-300">{f.ingredient_name || f.ingredient_id}</span>
                          <div className="ck-text-right">
                              <span className="ck-text-lg ck-font-black ck-text-blue-400 ck-font-mono">{totalNeeded}</span>
                              <span className="ck-text-[10px] ck-text-gray-500 ck-ml-1 uppercase">{f.unit || 'g'}</span>
                          </div>
                      </div>
                  );
              }) : <p className="ck-text-xs ck-text-gray-500 italic">Dữ liệu công thức đang được cập nhật...</p>}
          </div>
        </div>

        <div>
          <p className="ck-text-[11px] ck-text-gray-500 ck-font-bold ck-uppercase ck-mb-2">Ghi chú mẻ nấu:</p>
          <p className="ck-text-xs ck-text-gray-400 ck-leading-relaxed ck-bg-black/30 ck-p-3 ck-rounded-lg ck-border ck-border-gray-800 whitespace-pre-line">
            {selectedRecipeRun.note || "Không có ghi chú thêm cho mẻ nấu này."}
          </p>
        </div>
      </div>
      
      <div className="ck-p-6 ck-bg-gray-800/30 ck-rounded-b-2xl">
        <button onClick={() => setSelectedRecipeRun(null)} className="ck-w-full ck-bg-blue-600 hover:ck-bg-blue-500 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">Xác nhận & Đóng</button>
      </div>
    </div>
  </div>
)}

      {/* MODAL BÁO LỖI THIẾU NGUYÊN LIỆU */}
      {errorModal.show && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-red-500 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <div className="ck-flex ck-flex-col ck-items-center ck-text-center">
              <div className="ck-w-16 ck-h-16 ck-bg-red-500/20 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-mb-4"><span className="ck-text-3xl">❌</span></div>
              <h2 className="ck-text-xl ck-font-black ck-text-white ck-mb-2">Thao tác thất bại!</h2>
              <p className="ck-text-gray-300 ck-mb-6">{errorModal.message}</p>
              <button onClick={() => setErrorModal({ show: false, message: "" })} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CentralKitchenPage;