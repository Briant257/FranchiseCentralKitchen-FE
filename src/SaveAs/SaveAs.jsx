import React, { useState, useCallback, useEffect } from 'react';
import { Eye, ChefHat, LogOut } from "../../components/icons/Icons";
import api from "../../services/api"; 

const CentralKitchenPage = ({ onLogout, userData }) => {
  const [activeKitchenTab, setActiveKitchenTab] = useState("Tổng Quan");
  const [aggregationData, setAggregationData] = useState(null); 
  const [showAggModal, setShowAggModal] = useState(false);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [selectedRecipeRun, setSelectedRecipeRun] = useState(null);

  const [productionRuns, setProductionRuns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  
  const [incidents, setIncidents] = useState([]);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [catsData, prodsData, ingsData, ordersData] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getMasterProducts().catch(() => []),
        api.getIngredients().catch(() => []),
        api.getKitchenOrders().catch(() => []) 
      ]);
  
      setCategories(Array.isArray(catsData) ? catsData : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      setIngredients(Array.isArray(ingsData) ? ingsData : []);
      
      setProductionRuns(prevRuns => {
         if (prevRuns.length > 0) return prevRuns; 
         const runs = Array.isArray(ordersData) ? ordersData : [];
         return runs.map((r, i) => ({
             run_id: r.id || `RUN-${i+1}`,
             product_name: r.productName || r.name || `Sản phẩm ${i+1}`,
             planned_qty: r.quantity || 100,
             actual_qty: r.actual_qty || 0,
             status: r.status || 'PLANNED', 
             batch_code: r.batchCode || `B-260${i}`,
             expiry_date: r.deliveryDate || "Trong ngày",
             formula: r.formula || []
         }));
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const stats = {
    totalRequested: productionRuns.reduce((sum, run) => sum + (Number(run.planned_qty) || 0), 0),
    cooking: productionRuns.filter(r => r.status === 'COOKING').length,
    completed: productionRuns.filter(r => r.status === 'COMPLETED').length,
    incidentCount: incidents.filter(i => i.status !== 'Đã giải quyết').length
  };

  const handleGetAggregation = async () => {
    try {
      const data = await api.getKitchenAggregation();
      setAggregationData(data);
      setShowAggModal(true);
    } catch (err) { 
      setAggregationData([{ name: "Gà rán", qty: 50 }]);
      setShowAggModal(true); 
    }
  };

  const handleConfirmCook = async () => {
    try {
      await api.confirmAggregation();
      setShowAggModal(false); 
      loadData();
      alert("✅ Đã chốt đơn và tạo mẻ nấu thành công!");
    } catch (err) { 
      alert("Lỗi chốt đơn, thử lại sau!"); 
      setShowAggModal(false); 
    }
  };

  const handleUpdateRunStatus = (id, newStatus) => {
    setProductionRuns(prev => prev.map(run => {
        if (run.run_id === id) {
            return { 
                ...run, 
                status: newStatus, 
                actual_qty: newStatus === 'COMPLETED' ? run.planned_qty : run.actual_qty 
            };
        }
        return run;
    }));
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ product_id: "", product_name: "", base_unit: "PHAN", cost_price: "", selling_price: "" });

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: "", name: "", unit: "G", kitchen_stock: "", min_threshold: "", unit_cost: "" });

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
      if (editingCategory) await api.updateCategory(editingCategory.id || editingCategory.category_id, { name: newCategoryName, description: "" });
      else await api.createCategory({ name: newCategoryName, description: "" });
      setShowAddCategory(false); setNewCategoryName(""); loadData();
    } catch (err) { alert("Lỗi lưu danh mục!"); }
  };
  const handleDeleteCategory = async (catId) => { 
    if(window.confirm("Xóa danh mục này?")) { try { await api.deleteCategory(catId); loadData(); } catch(e) { alert("Lỗi xóa danh mục!"); } }
  };

  // ---- XỬ LÝ SẢN PHẨM ----
  const handleSaveProduct = async () => {
    if (!newProduct.product_name || !newProduct.selling_price || !newProduct.product_id) {
        return alert("Vui lòng điền đủ Mã món, Tên món và Giá bán!");
    }

    const payload = {
        id: newProduct.product_id,
        productId: newProduct.product_id, 
        product_id: newProduct.product_id,
        name: newProduct.product_name,
        productName: newProduct.product_name,
        product_name: newProduct.product_name,
        price: Number(newProduct.selling_price || 0),
        costPrice: Number(newProduct.cost_price || 0),
        cost_price: Number(newProduct.cost_price || 0),
        sellingPrice: Number(newProduct.selling_price || 0),
        selling_price: Number(newProduct.selling_price || 0),
        baseUnit: newProduct.base_unit || "PHAN", 
        base_unit: newProduct.base_unit || "PHAN",
        active: true,
        isActive: true,
        is_active: 1
    };

    try {
      if (editingProduct) {
        const targetId = editingProduct.product_id || editingProduct.id;
        await api.updateProduct(targetId, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowAddProduct(false); loadData();
    } catch (err) { alert("Lỗi lưu sản phẩm: " + err.message); }
  };
  
  const handleDeleteProduct = async (prodId) => { 
    if(window.confirm("Xóa sản phẩm này?")) { try { await api.deleteProduct(prodId); loadData(); } catch(e) { alert("Lỗi xóa sản phẩm!"); } }
  };

  // ---- XỬ LÝ NGUYÊN LIỆU ----
  const handleSaveIngredient = async () => {
    if (!newIngredient.name || !newIngredient.ingredient_id) {
        return alert("Vui lòng điền Mã và Tên nguyên liệu!");
    }

    const payload = {
        ingredient_id: newIngredient.ingredient_id,
        ingredientId: newIngredient.ingredient_id, 
        name: newIngredient.name,
        ingredientName: newIngredient.name,
        unit: newIngredient.unit,
        kitchen_stock: Number(newIngredient.kitchen_stock || 0),
        kitchenStock: Number(newIngredient.kitchen_stock || 0),
        min_threshold: Number(newIngredient.min_threshold || 0),
        minThreshold: Number(newIngredient.min_threshold || 0),
        unit_cost: Number(newIngredient.unit_cost || 0),
        unitCost: Number(newIngredient.unit_cost || 0)
    };

    try {
      if (editingIngredient) {
          const targetId = editingIngredient.ingredient_id || editingIngredient.ingredientId || editingIngredient.id;
          await api.updateIngredient(targetId, payload);
      } else {
          await api.createIngredient(payload);
      }
      setShowAddIngredient(false); 
      loadData();
    } catch (err) { alert("Lỗi lưu nguyên liệu: " + err.message); }
  };

  const handleDeleteIngredient = async (ingId) => { 
    if(window.confirm("Xóa nguyên liệu này?")) { try { await api.deleteIngredient(ingId); loadData(); } catch(e) { alert("Lỗi xóa nguyên liệu!"); } }
  };

  // ---- XỬ LÝ SỰ CỐ ----
  const handleSaveNewIncident = () => {
    if (!newIncidentForm.title || !newIncidentForm.reporter) return alert("Điền tiêu đề và người báo cáo!");
    const newInc = {
        ...newIncidentForm,
        id: `SC-${Math.floor(Math.random() * 1000)}`,
        status: 'Mới',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('vi-VN')
    };
    setIncidents([newInc, ...incidents]);
    setShowAddIncidentForm(false);
    setNewIncidentForm({ type: "Thiết bị", priority: "Trung bình", title: "", reporter: "", description: "" });
    alert("✅ Đã ghi nhận sự cố!");
  };

  const handleUpdateIncidentStatus = (incId, newStatus) => {
    setIncidents(prev => prev.map(i => i.id === incId ? { ...i, status: newStatus } : i));
    setSelectedIncident(prev => prev ? ({ ...prev, status: newStatus }) : null);
  };

  const filteredIncidents = incidents.filter(i => {
    let matchText = true;
    if (incidentAppliedSearch) {
      const kw = incidentAppliedSearch.toLowerCase();
      matchText = i.id?.toString().toLowerCase().includes(kw) || i.title?.toLowerCase().includes(kw);
    }
    return matchText && (filterIncidentPriority === "Mức độ ưu tiên" || i.priority === filterIncidentPriority);
  });

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
                          <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 cursor-pointer" onClick={() => { setShowAddCategory(true); setEditingCategory(null); setNewCategoryName(""); }}>+ Thêm mới</button>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr><th className="ck-py-4 ck-px-6">STT</th><th className="ck-py-4 ck-px-6">Tên danh mục</th><th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th></tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {categories.map((cat, idx) => (
                              <tr key={cat.id || cat.category_id || idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-text-gray-400">{idx + 1}</td>
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">{cat.name}</td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button onClick={() => { setEditingCategory(cat); setShowAddCategory(true); setNewCategoryName(cat.name); }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                                    <button onClick={() => handleDeleteCategory(cat.id || cat.category_id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
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
                          <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 cursor-pointer" onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ product_id: "", product_name: "", base_unit: "PHAN", cost_price: "", selling_price: "", emoji: "🍔" }); }}>+ Thêm mới</button>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr><th className="ck-py-4 ck-px-6">Mã</th><th className="ck-py-4 ck-px-6">Sản phẩm</th><th className="ck-py-4 ck-px-6">Đơn vị</th><th className="ck-py-4 ck-px-6">Giá Vốn/Bán</th><th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th></tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {products.filter(p => {
                                const isHidden = String(p.is_active) === "0" || p.isActive === false || p.active === false;
                                return !isHidden;
                            }).map((p) => (
                              <tr key={p.product_id || p.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-text-gray-400 ck-font-mono">{p.product_id || p.id}</td>
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">{p.emoji || '🍽️'} {p.product_name || p.name}</td>
                                <td className="ck-py-4 ck-px-6 ck-text-yellow-400">{p.base_unit || p.baseUnit || 'PHAN'}</td>
                                <td className="ck-py-4 ck-px-6">
                                    <span className="ck-text-red-400 ck-font-bold">{Number(p.cost_price || p.costPrice || 0).toLocaleString()}₫</span> <span className="ck-text-gray-500">/</span> <span className="ck-text-blue-400">{Number(p.selling_price || p.price || 0).toLocaleString()}₫</span>
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button onClick={() => { 
                                        setEditingProduct(p); 
                                        setShowAddProduct(true); 
                                        setNewProduct({
                                            product_id: p.product_id || p.id,
                                            product_name: p.product_name || p.name,
                                            base_unit: p.base_unit || p.baseUnit || "PHAN",
                                            cost_price: p.cost_price || p.costPrice || "",
                                            selling_price: p.selling_price || p.price || "",
                                            emoji: p.emoji || "🍔"
                                        }); 
                                    }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                                    <button onClick={() => handleDeleteProduct(p.product_id || p.id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {products.filter(p => !(String(p.is_active) === "0" || p.isActive === false)).length === 0 && (
                              <tr><td colSpan="5" className="ck-py-8 ck-text-center ck-text-gray-500">Chưa có sản phẩm nào đang hoạt động.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* BẢNG NGUYÊN LIỆU */}
                    {kitchenSubTab === "ingredients" && (
                      <>
                        <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                          <h3 className="ck-text-xl ck-font-bold ck-text-white">Quản lý Nguyên liệu gốc</h3>
                          <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 cursor-pointer" onClick={() => { setShowAddIngredient(true); setEditingIngredient(null); setNewIngredient({ ingredient_id: "", name: "", unit: "G", kitchen_stock: "", min_threshold: "", unit_cost: "" }); }}>+ Thêm nguyên liệu</button>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr>
                              <th className="ck-py-4 ck-px-6">Mã NL</th>
                              <th className="ck-py-4 ck-px-6">Tên Nguyên Liệu</th>
                              <th className="ck-py-4 ck-px-6">Tồn Bếp / Min</th>
                              <th className="ck-py-4 ck-px-6">Đơn giá</th>
                              <th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {ingredients.map((ing) => {
                              const isLowStock = Number(ing.kitchen_stock) <= Number(ing.min_threshold);
                              return (
                              <tr key={ing.ingredient_id || ing.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-text-blue-400 ck-font-mono">{ing.ingredient_id || ing.id}</td>
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">{ing.name || ing.ingredientName}</td>
                                <td className="ck-py-4 ck-px-6">
                                  <span className={isLowStock ? "ck-text-red-400 ck-font-bold" : "ck-text-green-400 ck-font-bold"}>
                                    {Number(ing.kitchen_stock || 0).toLocaleString()}
                                  </span> 
                                  <span className="ck-text-gray-500"> / {Number(ing.min_threshold || 0).toLocaleString()}</span>
                                  <span className="ck-text-gray-400 ck-text-xs ck-ml-1">{ing.unit}</span>
                                  {isLowStock && <span className="ck-ml-2 ck-text-[10px] ck-bg-red-500/20 ck-text-red-400 ck-px-2 ck-py-1 ck-rounded-md">Sắp hết</span>}
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-text-orange-400">{Number(ing.unit_cost || 0).toLocaleString()}₫</td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button onClick={() => { 
                                        setEditingIngredient(ing); 
                                        setShowAddIngredient(true); 
                                        setNewIngredient({
                                            ingredient_id: ing.ingredient_id || ing.id,
                                            name: ing.name || ing.ingredientName,
                                            unit: ing.unit || "G",
                                            kitchen_stock: ing.kitchen_stock || 0,
                                            min_threshold: ing.min_threshold || 0,
                                            unit_cost: ing.unit_cost || 0
                                        }); 
                                    }} className="ck-text-gray-400 hover:ck-text-white border-none bg-transparent cursor-pointer">✏️</button>
                                    <button onClick={() => handleDeleteIngredient(ing.ingredient_id || ing.id)} className="ck-text-red-500 hover:ck-text-red-400 border-none bg-transparent cursor-pointer">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            )})}
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
                          {showAddIngredient ? (editingIngredient ? 'Sửa Lô Nguyên Liệu' : 'Thêm NL Gốc') : ''}
                        </h3>
                        <button onClick={() => {setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false);}} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer">✕</button>
                      </div>

                      {showAddCategory && (
                        <div className="ck-space-y-4">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên danh mục</label>
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà quay..." />
                          </div>
                          <button onClick={handleSaveCategory} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none cursor-pointer">Lưu thay đổi</button>
                        </div>
                      )}

                      {showAddProduct && (
                        <div className="ck-space-y-4">
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mã Món *</label>
                              <input type="text" readOnly={!!editingProduct} value={newProduct.product_id} onChange={(e) => setNewProduct({...newProduct, product_id: e.target.value.toUpperCase()})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-mono ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: P_001" />
                            </div>
                            <div className="ck-w-2/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên sản phẩm *</label>
                              <input type="text" value={newProduct.product_name} onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà rán truyền thống" />
                            </div>
                          </div>
                          
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn vị (Base Unit)</label>
                              <select value={newProduct.base_unit} onChange={(e) => setNewProduct({...newProduct, base_unit: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none">
                                <option value="CAI">CÁI</option><option value="PHAN">PHẦN</option><option value="LY">LY</option><option value="COMBO">COMBO</option>
                              </select>
                            </div>
                            <div className="ck-w-1/2">
                               <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Danh mục (Tùy chọn)</label>
                               <select className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                                 <option value="">Chọn danh mục...</option>
                                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                            </div>
                          </div>

                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Giá vốn (Cost)</label>
                              <input type="number" value={newProduct.cost_price} onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-red-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Giá bán *</label>
                              <input type="number" value={newProduct.selling_price} onChange={(e) => setNewProduct({...newProduct, selling_price: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                          </div>
                          
                          <button onClick={handleSaveProduct} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none cursor-pointer hover:ck-opacity-90">Lưu sản phẩm</button>
                        </div>
                      )}

                      {showAddIngredient && (
                        <div className="ck-space-y-4">
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mã NL *</label>
                              <input type="text" readOnly={!!editingIngredient} value={newIngredient.ingredient_id} onChange={(e) => setNewIngredient({...newIngredient, ingredient_id: e.target.value.toUpperCase()})} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-mono ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: ING001" />
                            </div>
                            <div className="ck-w-2/3">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên nguyên liệu *</label>
                              <input type="text" value={newIngredient.name} onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Ức gà tươi" />
                            </div>
                          </div>
                          
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn giá (Unit Cost)</label>
                              <input type="number" value={newIngredient.unit_cost} onChange={(e) => setNewIngredient({...newIngredient, unit_cost: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-orange-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn vị (Unit)</label>
                              <select value={newIngredient.unit} onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                                <option value="G">Gram (G)</option>
                                <option value="KG">Kilogram (KG)</option>
                                <option value="CAI">Cái (CAI)</option>
                                <option value="BAO">Bao (BAO)</option>
                                <option value="CHAI">Chai (CHAI)</option>
                                <option value="COMBO">Combo (COMBO)</option>
                                <option value="LIT">Lít (LIT)</option>
                              </select>
                            </div>
                          </div>

                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tồn kho hiện tại</label>
                              <input type="number" value={newIngredient.kitchen_stock} onChange={(e) => setNewIngredient({...newIngredient, kitchen_stock: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mức cảnh báo (Min)</label>
                              <input type="number" value={newIngredient.min_threshold} onChange={(e) => setNewIngredient({...newIngredient, min_threshold: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-red-400 ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="10" />
                            </div>
                          </div>

                          <div className="ck-bg-blue-500/10 ck-p-3 ck-rounded-lg ck-border ck-border-blue-500/20">
                            <p className="ck-text-xs ck-text-blue-400">
                              💡 <b>Lưu ý:</b> Đây là thao tác tạo danh mục gốc. Để nhập kho, vui lòng dùng chức năng <b>Tạo Phiếu Nhập Kho</b>.
                            </p>
                          </div>

                          <button onClick={handleSaveIngredient} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none cursor-pointer hover:ck-opacity-90">Lưu nguyên liệu</button>
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
                
                <div className="ck-flex ck-gap-3">
                  <button 
  onClick={handleGetAggregation} 
  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-flex ck-items-center ck-gap-2 cursor-pointer transition-colors shadow-lg shadow-red-500/20"
>
  📦 Gom đơn Bếp
</button>
                  <button onClick={loadData} disabled={isRefreshing} className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex ck-items-center ck-gap-2 cursor-pointer transition-colors">
                    {isRefreshing ? "⏳ Đang tải..." : "🔄 Làm mới"}
                  </button>
                </div>
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                {productionRuns.length === 0 ? (
                    <p className="ck-text-gray-400">Không có đơn cần nấu.</p>
                ) : productionRuns.map((run) => {
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
              {/* THANH CÔNG CỤ TRÊN CÙNG */}
              <div className="ck-flex ck-gap-4 ck-items-center">
                {/* Ô TÌM KIẾM ĐÃ FIX MÀU ĐEN (DARK MODE) */}
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input 
                    type="text" 
                    placeholder="🔍 Tìm kiếm mã sự cố..." 
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none ck-bg-gray-900 ck-text-white placeholder-gray-500 text-sm" 
                    defaultValue={incidentSearchText} 
                    onChange={(e) => setIncidentSearchText(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') setIncidentAppliedSearch(e.target.value); }} 
                  />
                  <button 
                    onClick={() => setIncidentAppliedSearch(incidentSearchText)} 
                    className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0 ck-cursor-pointer"
                  >
                    Tìm kiếm
                  </button>
                </div>

                <select 
                  value={filterIncidentPriority} 
                  onChange={(e) => setFilterIncidentPriority(e.target.value)} 
                  className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer hover:ck-border-gray-500 transition-colors"
                >
                  <option value="Mức độ ưu tiên">Mức độ ưu tiên</option>
                  <option value="Khẩn cấp">Khẩn cấp</option>
                  <option value="Cao">Cao</option>
                </select>

                <button 
                  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0 ck-border-none ck-cursor-pointer shadow-lg shadow-red-500/20" 
                  onClick={() => { setShowAddIncidentForm(true); setSelectedIncident(null); }}
                >
                  + Báo cáo sự cố mới
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                {/* BẢNG DANH SÁCH SỰ CỐ - CÓ THÊM CỘT THAO TÁC NHANH */}
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300 shadow-2xl" style={{ width: (selectedIncident || showAddIncidentForm) ? '66.66%' : '100%' }}>
                  <table className="ck-w-full ck-text-center ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã SC</th>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold">Phân loại</th>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold">Tiêu đề</th>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Mức độ</th>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th>
                        <th className="ck-py-4 ck-px-4 ck-font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {filteredIncidents.length > 0 ? (
                        filteredIncidents.map((inc, idx) => (
                          <tr 
                            key={idx} 
                            className={`ck-border-t ck-border-gray-700 ck-transition-colors hover:ck-bg-gray-800/50 ${selectedIncident?.id === inc.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-red-500' : ''}`}
                          >
                            <td className="ck-py-4 ck-px-4 ck-font-bold ck-text-gray-400" onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}}>{inc.id}</td>
                            <td className="ck-py-4 ck-px-4" onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}}>{inc.type}</td>
                            <td className="ck-py-4 ck-px-4 ck-font-semibold" onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}}>{inc.title}</td>
                            <td className="ck-py-4 ck-px-4 ck-text-center" onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}}>
                              {inc.priority === 'Khẩn cấp' ? <span className="ck-text-red-500 ck-font-black">🔴 Khẩn cấp</span> : inc.priority === 'Cao' ? <span className="ck-text-orange-400 ck-font-bold">🟠 Cao</span> : <span className="ck-text-yellow-500 ck-font-semibold">🟡 Trung bình</span>}
                            </td>
                            <td className="ck-py-4 ck-px-4" onClick={() => {setSelectedIncident(inc); setShowAddIncidentForm(false);}}>
                              <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${inc.status === 'Mới' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' : inc.status === 'Đang xử lý' ? 'ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50' : 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'}`}>{inc.status}</span>
                            </td>
                            <td className="ck-py-4 ck-px-4">
                              {inc.status !== 'Đã giải quyết' ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Không mở bảng chi tiết khi bấm nút này
                                    handleUpdateIncidentStatus(inc.id, 'Đã giải quyết');
                                  }}
                                  className="ck-px-3 ck-py-1.5 ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-text-[10px] ck-font-black ck-rounded-lg ck-border-none ck-cursor-pointer shadow-lg shadow-green-500/20 transition-all active:ck-scale-90"
                                >
                                  XỬ LÝ XONG
                                </button>
                              ) : (
                                <span className="ck-text-green-500 ck-text-xs ck-font-bold">✨ Đã chốt</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : ( 
                        <tr><td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500 italic">Không tìm thấy sự cố nào phù hợp.</td></tr> 
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FORM BÁO CÁO SỰ CỐ MỚI */}
                {showAddIncidentForm && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-animate-fade-in shadow-2xl" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Báo cáo sự cố</h3>
                      <button onClick={() => setShowAddIncidentForm(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tiêu đề sự cố *</label>
                        <input type="text" value={newIncidentForm.title} onChange={(e) => setNewIncidentForm({...newIncidentForm, title: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none transition-colors" placeholder="Tóm tắt vấn đề..." />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Phân loại</label>
                        <select value={newIncidentForm.type} onChange={(e) => setNewIncidentForm({...newIncidentForm, type: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none">
                          <option value="Thiết bị">Thiết bị</option>
                          <option value="Nguyên liệu">Nguyên liệu</option>
                          <option value="Hệ thống">Hệ thống</option>
                          <option value="Vận chuyển">Vận chuyển</option>
                        </select>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mức độ ưu tiên</label>
                        <select value={newIncidentForm.priority} onChange={(e) => setNewIncidentForm({...newIncidentForm, priority: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none">
                          <option value="Trung bình">Trung bình</option>
                          <option value="Cao">Cao</option>
                          <option value="Khẩn cấp">Khẩn cấp</option>
                        </select>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Người báo cáo *</label>
                        <input type="text" value={newIncidentForm.reporter} onChange={(e) => setNewIncidentForm({...newIncidentForm, reporter: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none" placeholder="Tên nhân viên..." />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mô tả chi tiết</label>
                        <textarea value={newIncidentForm.description} onChange={(e) => setNewIncidentForm({...newIncidentForm, description: e.target.value})} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none ck-min-h-[100px] ck-resize-none" placeholder="Nhập thêm chi tiết..."></textarea>
                      </div>
                      <button onClick={handleSaveNewIncident} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-cursor-pointer hover:ck-opacity-90 transition-opacity">Gửi báo cáo sự cố</button>
                    </div>
                  </div>
                )}

                {/* CHI TIẾT SỰ CỐ ĐÃ CHỌN */}
                {selectedIncident && !showAddIncidentForm && (
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in shadow-2xl" style={{ width: '33.33%' }}>
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết {selectedIncident.id}</h3>
                      <button onClick={() => setSelectedIncident(null)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1">✕</button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      {selectedIncident.priority === 'Khẩn cấp' && (
                        <div className="ck-bg-red-500-20 ck-border ck-border-red-500-50 ck-p-3 ck-rounded-lg ck-text-red-400 ck-font-bold ck-flex ck-items-center ck-gap-2">
                          <span className="ck-animate-pulse">⚠️</span> CẦN XỬ LÝ NGAY
                        </div>
                      )}
                      <div>
                        <span className="ck-text-gray-400 ck-block ck-mb-1">Vấn đề:</span>
                        <p className="ck-text-white ck-font-bold ck-text-lg">{selectedIncident.title}</p>
                      </div>
                      <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                        <span className="ck-text-gray-400">Thời gian báo:</span>
                        <span className="ck-text-white">{selectedIncident.time} - {selectedIncident.date}</span>
                      </div>
                      <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                        <span className="ck-text-gray-400">Người báo cáo:</span>
                        <span className="ck-text-white ck-font-semibold">{selectedIncident.reporter}</span>
                      </div>
                      <div className="ck-pt-2">
                        <span className="ck-text-gray-400 ck-block ck-mb-2">Mô tả chi tiết:</span>
                        <p className="ck-text-gray-300 ck-bg-gray-800 ck-p-3 ck-rounded-lg ck-leading-relaxed">
                          {selectedIncident.description || "Không có mô tả thêm."}
                        </p>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-flex-col ck-gap-3">
                      {selectedIncident.status === 'Mới' && (
                        <button onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'Đang xử lý')} className="ck-w-full ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer shadow-lg shadow-orange-500/20">🔧 Nhận xử lý</button>
                      )}
                      {selectedIncident.status === 'Đang xử lý' && (
                        <button onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'Đã giải quyết')} className="ck-w-full ck-bg-green-500 hover:ck-bg-green-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer shadow-lg shadow-green-500/20">✅ Đánh dấu Đã giải quyết</button>
                      )}
                      {selectedIncident.status === 'Đã giải quyết' && (
                        <div className="ck-w-full ck-bg-green-500-20 ck-text-green-400 ck-py-4 ck-rounded-xl ck-font-bold ck-text-center ck-border ck-border-green-500-50">
                          Sự cố đã được khắc phục thành công!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL XÁC NHẬN GOM ĐƠN NẤU */}
      {showAggModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-blue-500 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <h2 className="ck-text-xl ck-font-black ck-text-white ck-mb-2">Gom đơn chi nhánh</h2>
            <p className="ck-text-gray-300 ck-mb-4">Hệ thống đã quét các đơn hàng mới. Bạn có muốn chốt tổng hợp thành mẻ nấu không?</p>
            
            {aggregationData && (
              <div className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-lg ck-mb-6 ck-text-sm ck-text-gray-400">
                Có <strong className="ck-text-blue-400">{Array.isArray(aggregationData) ? aggregationData.length : Object.keys(aggregationData).length}</strong> loại sản phẩm cần nấu.
              </div>
            )}

            <div className="ck-flex ck-gap-4">
              <button onClick={() => setShowAggModal(false)} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors ck-cursor-pointer">Hủy</button>
              <button onClick={handleConfirmCook} className="ck-w-full ck-bg-blue-600 hover:ck-bg-blue-500 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer shadow-lg shadow-blue-500/30">Chốt Nấu</button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setErrorModal({ show: false, message: "" })} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors ck-cursor-pointer">Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CentralKitchenPage;