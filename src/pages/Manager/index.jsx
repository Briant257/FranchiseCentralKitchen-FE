import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  Plus,
  Store,
  BarChart3,
  Package,
  CheckCircle,
  ChefHat,
  Settings,
} from "../../components/icons/Icons";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import "../../styles/admin-theme.css";
import "../../styles/manager-ui.css";

const MANAGER_TAB_ITEMS = [
  { label: "Bảng KPI", icon: BarChart3 },
  { label: "Quản lý sản phẩm", icon: Package },
  { label: "Tổng quan tồn kho", icon: LayoutDashboard },
  { label: "Kiểm kê kho", icon: CheckCircle },
  { label: "Quản lý công thức", icon: ChefHat },
  { label: "Cửa hàng Franchise", icon: Store },
  { label: "Cài đặt hệ thống", icon: Settings },
];

const ManagerPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activeManagementTab, setActiveManagementTab] = useState("Bảng KPI");
  const [isLoading, setIsLoading] = useState(false);

  const [masterProducts, setMasterProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [, setReports] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [kpiStats, setKpiStats] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  const [systemConfigs, setSystemConfigs] = useState({});

  // --- BỘ LỌC DATE PICKER KPI ---
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // --- STATE CHI TIẾT ĐƠN HÀNG FRANCHISE ---
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  // --- STATE KIỂM KÊ KHO ---
  const [stocktakeForm, setStocktakeForm] = useState({}); 
  const [isSubmittingStocktake, setIsSubmittingStocktake] = useState(false);
  
  // --- STATE NHẬP KHO ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    note: "",
    items: [{ ingredientId: "", quantity: "", importPrice: "" }],
  });
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // --- STATE QUẢN LÝ SẢN PHẨM & DANH MỤC ---
  const [productSubTab, setProductSubTab] = useState("products");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    productId: "",
    productName: "",
    categoryId: "",
    sellingPrice: "",
    baseUnit: "PHAN",
    isActive: true,
    ingredients: [],
  });

  const [productSearchText, setProductSearchText] = useState("");
  const [productAppliedSearch, setProductAppliedSearch] = useState("");
  const [filterProductCategory, setFilterProductCategory] = useState("Tất cả danh mục");

  const [showCreateReport, setShowCreateReport] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "", type: "EXCEL", fromDate: "", toDate: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, reps, invs, kpis, sts, cfgs, dashFull, cats] =
        await Promise.all([
          api.getMasterProducts().catch(() => []),
          api.getReports().catch(() => []),
          api.getManagerInventory().catch(() => []),
          api.getKPIStats().catch(() => []),
          api.getStoresAll?.().catch(() => []),
          api.getSystemConfigs?.().catch(() => ({})),
          api.getManagerAnalytics().catch(() => null),
          api.getCategories().catch(() => []),
        ]);

      setMasterProducts(prods);
      setCategoriesList(cats);
      setReports(reps);
      setInventory(invs);
      setKpiStats(kpis);
      setStores(sts);
      setSystemConfigs(cfgs || {});
      setDashboardData(dashFull || {}); 
      
    } catch (error) {
      console.error("Lỗi tải dữ liệu Manager:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // ==========================================
  // HÀM XỬ LÝ KIỂM KÊ KHO
  // ==========================================
  const handleStocktakeChange = (ingredientId, field, value) => {
    setStocktakeForm((prev) => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        [field]: value,
      },
    }));
  };

  const handleSubmitStocktake = async () => {
    const payloadItems = Object.entries(stocktakeForm)
      .filter(([id, data]) => data.actualQty !== "" && data.actualQty !== undefined)
      .map(([id, data]) => ({
        ingredientId: id,
        actualQty: Number(data.actualQty),
        note: data.note || "",
      }));

    if (payloadItems.length === 0) {
      return alert("Bạn chưa nhập số lượng kiểm kê cho nguyên liệu nào!");
    }

    if (window.confirm(`Xác nhận kiểm kê ${payloadItems.length} nguyên liệu?`)) {
      setIsSubmittingStocktake(true);
      try {
        const response = await api.submitStocktake({ items: payloadItems }); 
        alert("✅ " + (response?.message || "Đã hoàn tất quá trình đối soát và kiểm kê kho!"));
        setStocktakeForm({});
        loadData(); 
      } catch (err) {
        const beMessage = err.response?.data?.message || err.message;
        alert("❌ " + beMessage); 
      } finally {
        setIsSubmittingStocktake(false);
      }
    }
  };

  // ==========================================
  // HÀM XỬ LÝ SẢN PHẨM & DANH MỤC
  // ==========================================
  const productStats = useMemo(() => {
    let totalActive = 0;
    let sumPrice = 0;
    masterProducts.forEach((p) => {
      const isSelling =
        p.isActive === true || p.active === true || p.is_active === true || p.is_active === 1 || String(p.is_active) === "true";
      if (isSelling) totalActive++;
      sumPrice += Number(p.sellingPrice || p.price || 0);
    });
    return {
      total: totalActive,
      categoriesCount: categoriesList.length,
      withFormula: masterProducts.filter((p) => p.ingredients && p.ingredients.length > 0).length,
      avgPrice: masterProducts.length > 0 ? sumPrice / masterProducts.length : 0,
    };
  }, [masterProducts, categoriesList]);

  const handleSaveCategory = async () => {
    if (!newCategoryName) return alert("Vui lòng nhập tên danh mục!");
    try {
      await api.createCategory({
        name: newCategoryName,
        description: newCategoryDescription,
      });
      alert("Thêm danh mục thành công!");
      setShowAddCategory(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      loadData();
    } catch (err) {
      alert("Lỗi thêm danh mục: " + err.message);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.productName || !newProduct.sellingPrice)
      return alert("Vui lòng điền Tên và Giá bán!");

    const payload = {
      productId: newProduct.productId || undefined,
      productName: newProduct.productName,
      categoryId: newProduct.categoryId || (categoriesList[0]?.id ?? null),
      sellingPrice: Number(newProduct.sellingPrice),
      baseUnit: "PHAN", // Mặc định cứng
      isActive: newProduct.isActive,
      ingredients: newProduct.ingredients || []
    };

    try {
      if (editingProduct) {
        const idToUpdate = editingProduct.product_id || editingProduct.productId || editingProduct.id;
        await api.updateProduct(idToUpdate, payload);
        alert("Cập nhật sản phẩm thành công!");
      } else {
        await api.createProduct(payload);
        alert("Thêm sản phẩm thành công!");
      }
      setShowAddProduct(false);
      loadData();
    } catch (error) {
      alert("Lỗi lưu sản phẩm: " + error.message);
    }
  };

  const handleToggleMasterProductStatus = async (prod) => {
    const productId = prod.product_id || prod.productId;
    const isCurrentlySelling =
      prod.isActive === true || prod.active === true || prod.is_active === true || prod.is_active === 1 || String(prod.is_active) === "true";
    const newStatus = !isCurrentlySelling; 
    
    const confirmMsg = newStatus 
      ? "Bạn có chắc muốn chuyển SP này sang trạng thái ĐANG BÁN lại không?"
      : "Bạn có chắc muốn chuyển SP này sang trạng thái NGỪNG BÁN không?";

    if (window.confirm(confirmMsg)) {
      try {
        await api.updateProductStatus(productId, newStatus); 
        setMasterProducts((prevProducts) =>
          prevProducts.map((p) =>
            (p.product_id || p.productId) === productId
              ? { ...p, isActive: newStatus, active: newStatus, is_active: newStatus } 
              : p
          )
        );
      } catch (error) {
        alert("Lỗi cập nhật trạng thái!");
      }
    }
  };

  // ==========================================
  // HÀM XỬ LÝ KHÁC
  // ==========================================
  const handleCreateReport = async () => {
    if (!newReport.fromDate || !newReport.toDate) {
      return alert("Vui lòng chọn Từ ngày và Đến ngày để xuất báo cáo!");
    }
    try {
      api.exportAnalyticsCSV(newReport.fromDate, newReport.toDate);
      setShowCreateReport(false);
      loadData(); 
    } catch (error) {
      alert("Lỗi tạo báo cáo: " + error.message);
    }
  };

  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [inventoryAppliedSearch, setInventoryAppliedSearch] = useState("");
  const [filterInventoryStatus] = useState("Cảnh báo tồn kho");
  
  const filteredInventory = inventory.filter((item) => {
    const name = item.ingredientName || item.name || "";
    const id = item.ingredientId || item.id || "";
    
    let matchText = true;
    if (inventoryAppliedSearch)
      matchText =
        id.toLowerCase().includes(inventoryAppliedSearch.toLowerCase()) ||
        name.toLowerCase().includes(inventoryAppliedSearch.toLowerCase());
        
    const isLowStock = item.stock <= (item.minThreshold || item.min || 10);
    let matchStat = true;
    if (filterInventoryStatus === "Sắp hết hàng") matchStat = isLowStock && item.stock > 0;
    if (filterInventoryStatus === "Đã hết hàng") matchStat = item.stock <= 0;
    
    return matchText && matchStat; 
  });

  const inventorySummary = useMemo(() => {
    let safe = 0, low = 0, out = 0;
    for (const item of filteredInventory) {
      const stock = Number(item.stock) || 0;
      const min = Number(item.minThreshold ?? item.min ?? 10);
      if (stock <= 0) out += 1;
      else if (stock <= min) low += 1;
      else safe += 1;
    }
    return { shown: filteredInventory.length, safe, low, out, totalInSystem: inventory.length };
  }, [filteredInventory, inventory]);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");
  const [editingRecipeIngredients, setEditingRecipeIngredients] = useState([]);

  // ==========================================
  // HÀM XỬ LÝ NHẬP KHO
  // ==========================================
  const handleAddImportRow = () => {
    setImportForm((prev) => ({
      ...prev,
      items: [...prev.items, { ingredientId: "", quantity: "", importPrice: "" }],
    }));
  };

  const handleRemoveImportRow = (index) => {
    setImportForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1
          ? [{ ingredientId: "", quantity: "", importPrice: "" }]
          : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleImportRowChange = (index, field, value) => {
    setImportForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleSubmitImport = async (e) => {
    e.preventDefault();
    const validItems = importForm.items.filter((i) => i.ingredientId && (Number(i.quantity) || 0) > 0);
    if (validItems.length === 0) return;
    setImportSubmitting(true);
    try {
      await api.importInventory({
        note: importForm.note.trim(),
        items: validItems.map((i) => {
          const ing = inventory.find((x) => (x.ingredientId ?? x.id) === i.ingredientId);
          return {
            ingredientId: i.ingredientId,
            unit: ing?.unit || "KG",
            quantity: Number(i.quantity) || 0,
            importPrice: Number(i.importPrice) || 0,
          };
        }),
      });
      setShowImportModal(false);
      setImportForm({
        note: "",
        items: [{ ingredientId: "", quantity: "", importPrice: "" }],
      });
      loadData();
      alert("✅ Nhập kho thành công!");
    } catch (err) {
      alert("❌ Lỗi nhập kho: " + err.message);
    } finally {
      setImportSubmitting(false);
    }
  };

  // GOM CỤM DỮ LIỆU BIỂU ĐỒ KPI
  const chartData = React.useMemo(() => {
    const raw = dashboardData?.exportTrend || [];
    if (raw.length === 0) return [];

    const normalized = raw.map(d => ({
      date: d.date || d.timeLabel || "",
      val: Number(d.revenue || d.exportValue || d.totalValue || 0),
      count: Number(d.orderCount || d.totalOrders || 0)
    }));

    const len = normalized.length;

    if (len <= 14) {
      return normalized.map(d => ({
        label: d.date.split('-').slice(1).reverse().join('/'), 
        val: d.val,
        count: d.count,
        tooltipTitle: `Ngày: ${d.date.split('-').reverse().join('/')}`
      }));
    } 
    else if (len <= 60) {
      const grouped = [];
      for (let i = 0; i < len; i += 7) {
        const chunk = normalized.slice(i, i + 7);
        const sumVal = chunk.reduce((acc, curr) => acc + curr.val, 0);
        const sumCount = chunk.reduce((acc, curr) => acc + curr.count, 0);
        const start = chunk[0].date.split('-').slice(1).reverse().join('/');
        const end = chunk[chunk.length - 1].date.split('-').slice(1).reverse().join('/');
        
        grouped.push({
          label: `${start} - ${end}`,
          val: sumVal,
          count: sumCount,
          tooltipTitle: `Từ ${start} đến ${end}`
        });
      }
      return grouped;
    } 
    else {
      const monthMap = {};
      normalized.forEach(d => {
        const parts = d.date.split('-'); 
        let monthKey = "Khác";
        if (parts.length >= 2) monthKey = `${parts[1]}/${parts[0]}`;

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { label: `T${parts[1]}`, val: 0, count: 0, tooltipTitle: `Tháng ${monthKey}` };
        }
        monthMap[monthKey].val += d.val;
        monthMap[monthKey].count += d.count;
      });
      return Object.values(monthMap);
    }
  }, [dashboardData?.exportTrend]);

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg">
            <LayoutDashboard className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">Phân hệ quản lý</h1>
            <span className="admin-page-badge">Quản lý vận hành</span>
          </div>
        </div>
        <div className="ck-flex ck-items-center ck-gap-2">
          <HeaderSettingsMenu
            userData={userData}
            showProfile={true}
            onOpenProfile={() => setShowUpdateProfileModal(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onLogout={
              onLogout ?? (() => { api.logout(); window.location.reload(); })
            }
          />
        </div>
      </header>

      <ChangePasswordModal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
      <UpdateProfileModal
        open={showUpdateProfileModal}
        onClose={() => setShowUpdateProfileModal(false)}
        initialFullName={userData?.name ?? ""}
        initialEmail={userData?.email ?? ""}
        onSuccess={() => { onProfileUpdated?.(); setShowUpdateProfileModal(false); }}
      />

      <main className="ck-p-8">
        <div className="ck-max-w-7xl ingredient-polished manager-shell" style={{ marginLeft: "auto", marginRight: "auto" }}>
          <div className="ing-app manager-ui">
            <div className="tabs" style={{ marginBottom: 24 }}>
              {MANAGER_TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    className={`tab ${activeManagementTab === tab.label ? "active" : ""}`}
                    onClick={() => {
                      setActiveManagementTab(tab.label);
                      setEditingProduct(null);
                      setShowAddProduct(false);
                      setShowAddCategory(false);
                      setShowCreateReport(false);
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

          {/* ================== 1. TAB BẢNG KPI ================== */}
          {activeManagementTab === "Bảng KPI" && (
            <div className="ck-animate-fade-in relative mgr-section">
              <div className="mgr-section-head">
                <div>
                  <div className="mgr-section-head__eyebrow">Tổng quan vận hành</div>
                  <h2 className="mgr-section-head__title">Thống kê &amp; xu hướng xuất kho</h2>
                  <p className="mgr-section-head__sub">
                    Theo dõi chỉ số KPI theo khoảng thời gian, giá trị xuất kho và các món cần lưu ý.
                  </p>
                </div>
                <div className="mgr-toolbar">
                  <div className="mgr-toolbar__grow">
                    <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="mgr-input-date" />
                    <span className="mgr-toolbar-sep">đến</span>
                    <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="mgr-input-date" />
                    <button
                      type="button"
                      className="mgr-btn mgr-btn--green"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const kpis = await api.getKPIStats(filterStart, filterEnd);
                          const dash = await api.getManagerAnalytics(filterStart, filterEnd);
                          setKpiStats(kpis);
                          setDashboardData(dash);
                        } catch (e) { console.error(e); }
                        setIsLoading(false);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? "Đang tải…" : "Lọc dữ liệu"}
                    </button>
                  </div>
                  <button type="button" className="mgr-btn mgr-btn--primary" onClick={() => setShowCreateReport(true)}>
                    <Plus size={16} /> Xuất báo cáo
                  </button>
                </div>
              </div>

              <div className="mgr-stat-grid">
                {kpiStats.length > 0 ? (
                  kpiStats.map((stat, idx) => (
                    <div key={idx} className={`mgr-stat-card mgr-stat-card--${idx % 4}`}>
                      <div className="mgr-stat-card__label">{stat.label}</div>
                      <div className="mgr-stat-card__value">{stat.value}</div>
                      <div className="mgr-stat-card__foot">
                        <span className={`mgr-delta ${stat.isUp ? "mgr-delta--up" : "mgr-delta--down"}`}>
                          {stat.isUp ? "↗ Tăng" : "↘ Giảm"} {stat.change}
                        </span>
                        <span className="mgr-delta-hint">so với kỳ trước</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mgr-empty" style={{ gridColumn: "1 / -1" }}>
                    <div className="mgr-empty__icon">📊</div>
                    <p className="mgr-empty__title">Đang tải dữ liệu KPI</p>
                  </div>
                )}
              </div>

              <div className="mgr-kpi-layout">
                <div className="mgr-panel" style={{ minHeight: 360 }}>
                  <div className="mgr-panel__head">
                    <div>
                      <h3 className="mgr-panel__title">Giá trị xuất kho theo thời gian</h3>
                    </div>
                  </div>
                  <div className="mgr-panel__body">
                    <div className="mgr-chart ck-flex ck-items-end ck-justify-between ck-w-full ck-px-2" style={{ minHeight: 280, paddingTop: 20 }}>
                      {chartData.length > 0 ? (
                        chartData.map((item, i) => {
                          const maxVal = Math.max(...chartData.map((d) => d.val)) || 1;
                          const heightPercent = item.val > 0 ? (item.val / maxVal) * 100 : 1;
                          return (
                            <div key={i} className="ck-flex ck-flex-col ck-items-center ck-justify-end ck-h-full" style={{ flex: 1, padding: "0 4px" }}>
                              <div className="ck-flex ck-flex-col ck-items-center ck-mb-3" style={{ opacity: item.val > 0 ? 1 : 0.4 }}>
                                <span className="ck-text-xs ck-font-bold ck-text-green-400">
                                  {item.val > 0 ? `${(item.val / 1000).toLocaleString()}k` : "0đ"}
                                </span>
                                <span className="ck-text-[10px] ck-text-gray-400">{item.count} đơn</span>
                              </div>
                              <div className="ck-w-full ck-max-w-[48px] ck-flex ck-items-end ck-justify-center" style={{ height: '160px' }}>
                                <div
                                  className="ck-w-full ck-rounded-t-lg ck-transition-all ck-duration-700"
                                  style={{
                                    height: `${heightPercent}%`,
                                    background: item.val > 0 ? "linear-gradient(to top, #0f766e, #2dd4bf)" : "#374151",
                                    boxShadow: item.val > 0 ? "0 -4px 12px rgba(45, 212, 191, 0.2)" : "none"
                                  }}
                                />
                              </div>
                              <div className="ck-text-[10px] ck-text-gray-400 ck-mt-3 ck-pt-3 ck-w-full ck-text-center ck-border-t ck-border-gray-700/50" title={item.tooltipTitle || item.label}>
                                {item.label}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="mgr-empty" style={{ margin: "auto", border: "none", background: "transparent" }}>
                          <div className="mgr-empty__icon">📉</div>
                          <p className="mgr-empty__title">Chưa có dữ liệu biểu đồ</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ck-flex ck-flex-col ck-gap-5">
                  <div className="mgr-mini-panel">
                    <h3 className="mgr-mini-panel__title">Top xuất kho <span className="mgr-mini-panel__title-badge">Theo giá trị</span></h3>
                    <div className="mgr-mini-panel__scroll ck-scrollbar">
                      {dashboardData?.topExportedProducts?.length > 0 ? (
                        dashboardData.topExportedProducts.map((p, i) => (
                          <div key={i} className="mgr-row">
                            <div>
                              <p className="mgr-row__name">{p.productName}</p>
                              <p className="mgr-row__meta">Đã xuất: {p.totalQuantity} · #{i + 1}</p>
                            </div>
                            <span className="mgr-row__val">{Number(p.totalValue || 0).toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))
                      ) : (
                        <p className="mgr-empty__sub" style={{ textAlign: "center", padding: "1rem 0" }}>Chưa có dữ liệu xếp hạng.</p>
                      )}
                    </div>
                  </div>

                  <div className="mgr-mini-panel">
                    <h3 className="mgr-mini-panel__title">Cảnh báo sự cố <span className="mgr-mini-panel__title-badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>Top</span></h3>
                    <div className="mgr-mini-panel__scroll ck-scrollbar">
                      {dashboardData?.topIssueProducts?.length > 0 ? (
                        dashboardData.topIssueProducts.map((w, i) => (
                          <div key={i} className="mgr-row mgr-row--alert">
                            <div>
                              <p className="mgr-row__name">{w.productName}</p>
                              <p className="mgr-row__meta">Số ca ghi nhận: {w.totalQuantity}</p>
                            </div>
                            <span className="mgr-row__val">{Number(w.totalValue || 0).toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))
                      ) : (
                        <p className="mgr-empty__sub" style={{ textAlign: "center", padding: "1rem 0", color: "#86efac" }}>Không có sự cố.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== 2. TAB QUẢN LÝ SẢN PHẨM & DANH MỤC ================== */}
          {activeManagementTab === "Quản lý sản phẩm" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full mgr-section ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center">
                <div>
                  <div className="mgr-section-head__eyebrow" style={{ marginBottom: "4px" }}>Thực đơn & Công thức</div>
                  <h2 className="mgr-section-head__title" style={{ margin: 0 }}>Quản lý sản phẩm</h2>
                </div>
                <div className="ck-flex ck-gap-3">
                  <button
                    type="button"
                    className="mgr-btn mgr-btn--ghost"
                    onClick={() => {
                      setShowAddCategory(true);
                      setShowAddProduct(false); 
                      setEditingProduct(null);
                      setNewCategoryName("");
                      setNewCategoryDescription("");
                    }}
                  >
                    <Plus size={16} />
                    Thêm danh mục
                  </button>
                  <button
                    type="button"
                    className="mgr-btn mgr-btn--primary"
                    onClick={() => {
                      setShowAddProduct(true);
                      setShowAddCategory(false); 
                      setEditingProduct(null);
                      setNewProduct({
                        productId: "",
                        productName: "",
                        categoryId: categoriesList[0]?.id ?? "",
                        sellingPrice: "",
                        baseUnit: "PHAN",
                        isActive: true,
                        ingredients: [],
                      });
                    }}
                  >
                    <Plus size={16} />
                    Thêm sản phẩm
                  </button>
                </div>
              </div>
              <div className="tabs sub-tabs" style={{ marginBottom: 24 }}>
                <button
                  type="button"
                  className={`tab ${productSubTab === "products" ? "active" : ""}`}
                  onClick={() => { setProductSubTab("products"); setShowAddCategory(false); }}
                >
                  Sản phẩm
                </button>
                <button
                  type="button"
                  className={`tab ${productSubTab === "categories" ? "active" : ""}`}
                  onClick={() => { setProductSubTab("categories"); setShowAddProduct(false); }}
                >
                  Danh mục
                </button>
              </div>
              <div className="mgr-stat-grid">
                <div className="mgr-stat-card mgr-stat-card--0">
                  <div className="mgr-stat-card__label">Tổng sản phẩm</div>
                  <div className="mgr-stat-card__value">{productStats.total}</div>
                  <div className="mgr-stat-card__foot">đang bán</div>
                </div>
                <div className="mgr-stat-card mgr-stat-card--1">
                  <div className="mgr-stat-card__label">Danh mục</div>
                  <div className="mgr-stat-card__value" style={{ color: "#a78bfa" }}>{productStats.categoriesCount}</div>
                  <div className="mgr-stat-card__foot">phân loại</div>
                </div>
                <div className="mgr-stat-card mgr-stat-card--2">
                  <div className="mgr-stat-card__label">Có công thức</div>
                  <div className="mgr-stat-card__value" style={{ color: "#2dd4bf" }}>{productStats.withFormula}</div>
                  <div className="mgr-stat-card__foot">đã cấu hình</div>
                </div>
                <div className="mgr-stat-card mgr-stat-card--3">
                  <div className="mgr-stat-card__label">Giá trung bình</div>
                  <div className="mgr-stat-card__value" style={{ color: "#4ade80" }}>
                    {productStats.avgPrice >= 1000
                      ? `${(productStats.avgPrice / 1000).toFixed(0)}k`
                      : productStats.avgPrice}
                  </div>
                  <div className="mgr-stat-card__foot">mỗi món</div>
                </div>
              </div>

              {/* === SUBTAB SẢN PHẨM === */}
              {productSubTab === "products" && (
                <>
                  <div className="mgr-search-row">
                    <div className="mgr-search-bar mgr-search-bar--rose">
                      <input
                        type="text"
                        placeholder="Tìm theo mã sản phẩm hoặc tên sản phẩm…"
                        defaultValue={productSearchText}
                        onChange={(e) => setProductSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setProductAppliedSearch(productSearchText);
                        }}
                      />
                      <button type="button" onClick={() => setProductAppliedSearch(productSearchText)}>Tìm</button>
                    </div>
                    <select
                      value={filterProductCategory}
                      onChange={(e) => setFilterProductCategory(e.target.value)}
                      className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
                    >
                      <option value="Tất cả danh mục">Tất cả danh mục</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mgr-split">
                    <div
                      className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300"
                      style={{
                        flexBasis: showAddProduct ? "64%" : "100%",
                        maxWidth: showAddProduct ? "64%" : "100%",
                      }}
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>Mã món</th>
                            <th>Sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá franchise</th>
                            <th style={{ textAlign: "center" }}>Trạng thái</th>
                            <th style={{ textAlign: "center" }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows = masterProducts.filter((prod) => {
                              let matchText = true;
                              if (productAppliedSearch)
                                matchText =
                                  (prod.product_id || prod.productId || "").toLowerCase().includes(productAppliedSearch.toLowerCase()) ||
                                  (prod.product_name || prod.name || "").toLowerCase().includes(productAppliedSearch.toLowerCase());
                              const matchCat = filterProductCategory === "Tất cả danh mục" || prod.category === filterProductCategory;
                              return matchText && matchCat;
                            });
                            if (rows.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} style={{ padding: 0, border: "none" }}>
                                    <div className="mgr-empty" style={{ margin: 16 }}>
                                      <div className="mgr-empty__icon">🍽️</div>
                                      <p className="mgr-empty__title">Không có sản phẩm phù hợp</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return rows.map((prod, idx) => {
                              const isSelling =
                                prod.isActive === true || prod.active === true || prod.is_active === true || prod.is_active === 1 || String(prod.is_active) === "true";
                              return (
                                <tr key={idx}>
                                  <td className="mgr-mono-muted">{prod.product_id || prod.productId}</td>
                                  <td className="mgr-cell-strong">{prod.product_name || prod.name}</td>
                                  <td style={{ color: "var(--text2, #d1d5db)" }}>{prod.category}</td>
                                  <td className="mgr-mono-muted" style={{ color: "#86efac" }}>
                                    {Number(prod.selling_price || prod.sellingPrice || prod.price || 0).toLocaleString("vi-VN")} ₫
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span className={`mgr-pill ${isSelling ? "mgr-pill--ok" : "mgr-pill--danger"}`}>
                                      {isSelling ? "Đang bán" : "Ngừng bán"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      type="button" title="Chỉnh sửa"
                                      onClick={() => {
                                        let catId = prod.categoryId;
                                        if (!catId) {
                                          const foundCat = categoriesList.find(c => c.name === prod.category);
                                          catId = foundCat ? foundCat.id : (categoriesList[0]?.id ?? "");
                                        }

                                        setEditingProduct(prod);
                                        setNewProduct({
                                          productId: prod.product_id || prod.productId || "",
                                          productName: prod.product_name || prod.name || "",
                                          categoryId: catId,
                                          sellingPrice: prod.selling_price || prod.sellingPrice || prod.price || "",
                                          baseUnit: "PHAN", // Mặc định cứng
                                          isActive: isSelling,
                                          ingredients: prod.ingredients || [],
                                        });
                                        setShowAddProduct(true);
                                      }}
                                      className="mgr-icon-btn" style={{ marginRight: 8 }}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button" title={isSelling ? "Ngừng bán" : "Mở bán lại"}
                                      onClick={() => handleToggleMasterProductStatus(prod)}
                                      className="mgr-icon-btn"
                                      style={{ color: isSelling ? "#ef4444" : "#4ade80", fontWeight: "bold", fontSize: "16px" }}
                                    >
                                      {isSelling ? "➖" : "✅"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {showAddProduct && (
                      <div className="mgr-aside ck-animate-fade-in" style={{ flex: "0 0 32%", minWidth: 280 }}>
                        <div className="mgr-aside__head">
                          <div>
                            <h3 className="mgr-aside__title">{editingProduct ? "Chi tiết sản phẩm" : "Thêm sản phẩm mới"}</h3>
                          </div>
                          <button type="button" onClick={() => setShowAddProduct(false)} className="mgr-icon-btn">✕</button>
                        </div>
                        <div className="ck-space-y-4 ck-text-sm">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Mã Sản Phẩm</label>
                            <input
                              type="text" readOnly={!!editingProduct}
                              value={newProduct.productId}
                              onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}
                              className={`ck-w-full ck-bg-gray-800 ${editingProduct ? 'ck-text-gray-500' : 'ck-text-white'} ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none`}
                              placeholder={editingProduct ? "" : "Tự động tạo hoặc nhập mã"}
                            />
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Tên sản phẩm *</label>
                            <input
                              type="text" value={newProduct.productName}
                              onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                              className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                            />
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Danh mục</label>
                            <select
                              value={newProduct.categoryId}
                              onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                              className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                            >
                              <option value="">-- Chọn danh mục --</option>
                              {categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="ck-mt-4">
                            <label className="ck-block ck-text-gray-400 ck-mb-1">Giá Bán (₫)</label>
                            <input
                              type="number" value={newProduct.sellingPrice}
                              onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                              className="ck-w-full ck-bg-gray-800 ck-text-green-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-green-400 ck-outline-none"
                            />
                          </div>
                          <div className="ck-mt-4 ck-flex ck-items-center ck-gap-2">
                            <input 
                              type="checkbox" 
                              checked={newProduct.isActive}
                              onChange={(e) => setNewProduct({ ...newProduct, isActive: e.target.checked })}
                              id="product-active-checkbox"
                              className="ck-w-4 ck-h-4 ck-cursor-pointer"
                            />
                            <label htmlFor="product-active-checkbox" className="ck-text-gray-300 ck-cursor-pointer">Cho phép bán ngay</label>
                          </div>
                        </div>
                        <div className="ck-mt-6">
                          <button type="button" onClick={handleSaveProduct} className="mgr-btn mgr-btn--primary ck-w-full" style={{ justifyContent: "center" }}>
                            {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* === SUBTAB DANH MỤC === */}
              {productSubTab === "categories" && (
                <div className="ck-flex ck-gap-6 ck-items-start">
                  
                  {/* DANH SÁCH DANH MỤC (GIỐNG ADMIN) */}
                  <div 
                    className="cat-grid ck-transition-all ck-duration-300"
                    style={{
                      flexBasis: showAddCategory ? "64%" : "100%",
                      maxWidth: showAddCategory ? "64%" : "100%",
                    }}
                  >
                    {categoriesList.length === 0 ? (
                      <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                        Chưa có danh mục. Bấm "Thêm danh mục" để tạo.
                      </div>
                    ) : (
                      categoriesList.map((cat) => {
                        const count = masterProducts.filter((p) => p.category === cat.name || String(p.categoryId) === String(cat.id)).length;
                        return (
                          <div key={cat.id} className="cat-card">
                            <div className="cat-icon">
                              {cat.name &&
                                (cat.name.toLowerCase().includes("cơm")
                                  ? "🍚"
                                  : cat.name.toLowerCase().includes("nước") ||
                                    cat.name.toLowerCase().includes("nuoc")
                                  ? "🍜"
                                  : cat.name.toLowerCase().includes("uống") ||
                                    cat.name.toLowerCase().includes("uong")
                                  ? "🧋"
                                  : cat.name.toLowerCase().includes("tráng") ||
                                    cat.name.toLowerCase().includes("trang")
                                  ? "🍮"
                                  : "🍽")}
                            </div>
                            <div className="cat-name">{cat.name}</div>
                            <div className="cat-desc">
                              {cat.description || "Chưa có mô tả"}
                            </div>
                            <div className="cat-meta">
                              <span className="cat-id">ID: {cat.id}</span>
                              <span className="cat-count">{count} món</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Sidebar Thêm Danh mục */}
                  {showAddCategory && (
                    <div className="mgr-aside ck-animate-fade-in" style={{ flex: "0 0 32%", minWidth: 280 }}>
                      <div className="mgr-aside__head">
                        <div>
                          <h3 className="mgr-aside__title">Thêm danh mục mới</h3>
                        </div>
                        <button type="button" onClick={() => setShowAddCategory(false)} className="mgr-icon-btn">✕</button>
                      </div>
                      <div className="ck-space-y-4 ck-text-sm">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Tên danh mục *</label>
                          <input
                            type="text" value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                            placeholder="VD: Đồ uống"
                          />
                        </div>
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Mô tả</label>
                          <textarea
                            value={newCategoryDescription}
                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none ck-resize-none"
                            rows={3} placeholder="Mô tả về nhóm sản phẩm này..."
                          />
                        </div>
                      </div>
                      <div className="ck-mt-6">
                        <button type="button" onClick={handleSaveCategory} className="mgr-btn mgr-btn--primary ck-w-full" style={{ justifyContent: "center" }}>
                          Lưu danh mục
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================== 3. TAB TỔNG QUAN TỒN KHO ================== */}
          {activeManagementTab === "Tổng quan tồn kho" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full mgr-section">
              <div className="mgr-section-head">
                <div>
                  <div className="mgr-section-head__eyebrow">Kho trung tâm</div>
                  <h2 className="mgr-section-head__title">Tồn kho nguyên liệu</h2>
                  <p className="mgr-section-head__sub">Bảng dưới lọc theo ô tìm kiếm. Dùng <strong>Nhập kho</strong> để tạo phiếu.</p>
                </div>
              </div>

              <div className="mgr-strip">
                <div className="mgr-strip-item"><div className="mgr-strip-item__label">Đang hiển thị</div><div className="mgr-strip-item__val">{inventorySummary.shown}</div></div>
                <div className="mgr-strip-item mgr-strip-item--teal"><div className="mgr-strip-item__label">Mức an toàn</div><div className="mgr-strip-item__val">{inventorySummary.safe}</div></div>
                <div className="mgr-strip-item mgr-strip-item--amber"><div className="mgr-strip-item__label">Sắp hết</div><div className="mgr-strip-item__val">{inventorySummary.low}</div></div>
                <div className="mgr-strip-item mgr-strip-item--red"><div className="mgr-strip-item__label">Hết hàng</div><div className="mgr-strip-item__val">{inventorySummary.out}</div></div>
              </div>

              <div className="mgr-search-row">
                <div className="mgr-search-bar mgr-search-bar--amber">
                  <input type="text" placeholder="Tìm kiếm..." defaultValue={inventorySearchText} onChange={(e) => setInventorySearchText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setInventoryAppliedSearch(inventorySearchText); }} />
                  <button type="button" onClick={() => setInventoryAppliedSearch(inventorySearchText)}>Tìm</button>
                </div>
                <button type="button" onClick={() => { setImportForm({ note: "", items: [{ ingredientId: "", quantity: "", importPrice: "" }]}); setShowImportModal(true); }} className="mgr-btn mgr-btn--green">
                  📦 Nhập kho
                </button>
              </div>

              <div className="mgr-split">
                <div className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300" style={{ flexBasis: selectedInventoryItem ? "64%" : "100%", maxWidth: selectedInventoryItem ? "64%" : "100%" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mã hàng</th>
                        <th>Nguyên liệu</th>
                        <th style={{ textAlign: "right" }}>Tồn</th>
                        <th style={{ textAlign: "center" }}>Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length > 0 ? (
                        filteredInventory.map((item, idx) => {
                          const isOutOfStock = item.stock <= 0;
                          const minTh = Number(item.minThreshold ?? item.min ?? 10);
                          const isLowStock = !isOutOfStock && item.stock <= minTh;
                          const isActive = selectedInventoryItem && (selectedInventoryItem.ingredientId || selectedInventoryItem.sku) === (item.ingredientId || item.sku);
                          return (
                            <tr key={idx} role="button" onClick={() => setSelectedInventoryItem(item)} className={`ck-cursor-pointer ${isActive ? "mgr-tr--active" : ""}`}>
                              <td className="mgr-mono-muted">{item.ingredientId || item.sku}</td>
                              <td className="mgr-cell-strong">{item.ingredientName || item.name}</td>
                              <td className="mgr-mono-muted" style={{ textAlign: "right", color: isOutOfStock ? "#f87171" : isLowStock ? "#fcd34d" : "#fff" }}>
                                {Number(item.stock || 0).toLocaleString("vi-VN")} <span style={{ opacity: 0.75 }}>{item.unit}</span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {isOutOfStock ? <span className="mgr-pill mgr-pill--danger">Hết hàng</span> : isLowStock ? <span className="mgr-pill mgr-pill--warn">Sắp hết</span> : <span className="mgr-pill mgr-pill--ok">An toàn</span>}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={4}><div className="mgr-empty"><p className="mgr-empty__title">Không có dòng phù hợp</p></div></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedInventoryItem && (
                  <div className="mgr-aside ck-animate-fade-in" style={{ flex: "0 0 32%", minWidth: 280 }}>
                    <div className="mgr-aside__head">
                      <div><h3 className="mgr-aside__title">Chi tiết tồn kho</h3></div>
                      <button type="button" onClick={() => setSelectedInventoryItem(null)} className="mgr-icon-btn">✕</button>
                    </div>
                    <div className="ck-space-y-5 ck-text-sm">
                      <div className="ck-p-4 ck-rounded-xl" style={{ background: "rgba(20, 184, 166, 0.08)", border: "1px solid rgba(45, 212, 191, 0.25)" }}>
                        <p className="mgr-mono-muted ck-mb-1">{selectedInventoryItem.ingredientId || selectedInventoryItem.sku}</p>
                        <p className="ck-text-lg ck-text-white ck-font-bold ck-mb-1">{selectedInventoryItem.ingredientName || selectedInventoryItem.name}</p>
                        <p className="ck-text-xs ck-font-bold ck-mb-3" style={{ color: "#c4b5fd" }}>Đơn vị gốc: {selectedInventoryItem.unit}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL NHẬP KHO */}
              {showImportModal && (
                <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-animate-fade-in ck-backdrop-blur-sm" style={{ zIndex: 9999 }}>
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-w-full ck-max-w-2xl shadow-2xl">
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Nhập kho</h3>
                      <button type="button" onClick={() => setShowImportModal(false)} className="ck-text-gray-400 hover:ck-text-white ck-text-xl">✕</button>
                    </div>
                    <form onSubmit={handleSubmitImport}>
                       <div className="ck-mb-4">
                        <textarea className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700" placeholder="Ghi chú..." value={importForm.note} onChange={(e) => setImportForm({ ...importForm, note: e.target.value })} />
                       </div>
                       <div className="ck-mb-4">
                        {importForm.items.map((row, index) => (
                           <div key={index} className="ck-flex ck-gap-2 ck-mb-2">
                             <select className="ck-flex-1 ck-bg-gray-800 ck-text-white ck-p-2 ck-rounded" value={row.ingredientId} onChange={(e) => handleImportRowChange(index, "ingredientId", e.target.value)}>
                               <option value="">-- Chọn --</option>
                               {inventory.map((ing) => <option key={ing.id} value={ing.ingredientId ?? ing.id}>{ing.name ?? ing.ingredientName}</option>)}
                             </select>
                             <input type="number" className="ck-w-24 ck-bg-gray-800 ck-text-white ck-p-2 ck-rounded" placeholder="SL" value={row.quantity} onChange={(e) => handleImportRowChange(index, "quantity", e.target.value)} />
                             <input type="number" className="ck-w-24 ck-bg-gray-800 ck-text-white ck-p-2 ck-rounded" placeholder="Giá" value={row.importPrice} onChange={(e) => handleImportRowChange(index, "importPrice", e.target.value)} />
                             <button type="button" onClick={() => handleRemoveImportRow(index)} className="ck-text-red-500 ck-p-2">🗑</button>
                           </div>
                        ))}
                        <button type="button" onClick={handleAddImportRow} className="ck-text-green-400 ck-mt-2">+ Thêm dòng</button>
                       </div>
                       <div className="ck-flex ck-gap-3">
                         <button type="submit" className="ck-bg-green-600 ck-text-white ck-py-2 ck-px-4 ck-rounded" disabled={importSubmitting}>{importSubmitting ? "Đang tạo..." : "Lưu"}</button>
                       </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================== KIỂM KÊ KHO ================== */}
          {activeManagementTab === "Kiểm kê kho" && (() => {
            const hasValidationError = Object.entries(stocktakeForm).some(([id, data]) => {
              if (data.actualQty === "" || data.actualQty === undefined) return false;
              const item = inventory.find(i => (i.ingredientId || i.id || i.sku) === id);
              if (!item) return false;
              const sysStock = Number(item.stock || 0);
              const actual = Number(data.actualQty);
              if (sysStock === 0) return actual > 0; 
              return (Math.abs(actual - sysStock) / sysStock) > 0.5;
            });

            return (
              <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in mgr-section">
                <div className="mgr-hero">
                  <div>
                    <h2 className="mgr-hero__title">Kiểm kê định kỳ</h2>
                    <p className="mgr-hero__sub">Nhập <strong>đếm thực tế</strong> cho từng dòng cần đối soát.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitStocktake}
                    disabled={isSubmittingStocktake || hasValidationError}
                    className={`mgr-btn ${hasValidationError && !isSubmittingStocktake ? "mgr-btn--ghost" : "mgr-btn--primary"}`}
                  >
                    {isSubmittingStocktake ? "Đang xử lý…" : hasValidationError ? "Sửa dòng lệch > 50%" : "Xác nhận kiểm kê"}
                  </button>
                </div>

                <div className="mgr-table-wrap">
                  <div className="ck-max-h-[600px] ck-overflow-y-auto ck-scrollbar">
                    <table>
                      <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>
                          <th>Tên nguyên liệu</th>
                          <th style={{ textAlign: "center" }}>Tồn sổ</th>
                          <th>Đếm thực tế</th>
                          <th>Ghi chú hiện trường</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item, idx) => {
                          const ingId = item.ingredientId || item.id || item.sku;
                          const sysStock = Number(item.stock || 0);
                          const actualInput = stocktakeForm[ingId]?.actualQty;
                          
                          let isOverLimit = false;
                          let diff = 0;

                          if (actualInput !== undefined && actualInput !== "") {
                            const actual = Number(actualInput);
                            diff = actual - sysStock;
                            const diffPercent = sysStock > 0 ? (Math.abs(diff) / sysStock) * 100 : (actual > 0 ? 100 : 0);
                            isOverLimit = diffPercent > 50; 
                          }

                          return (
                            <tr key={idx} className={`ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors ${isOverLimit ? "ck-bg-red-500/5" : ""}`}>
                              <td className="ck-py-4 ck-px-4 ck-font-bold">{item.ingredientName || item.name}</td>
                              <td className="ck-py-4 ck-px-4 ck-text-center ck-font-mono ck-text-gray-400">{sysStock} <span className="ck-text-xs">{item.unit}</span></td>
                              <td className="ck-py-3 ck-px-4">
                                <div className="ck-flex ck-flex-col ck-items-start">
                                  <input
                                    type="number" min="0" step="0.01" placeholder="Nhập SL..."
                                    value={stocktakeForm[ingId]?.actualQty ?? ""}
                                    onChange={(e) => handleStocktakeChange(ingId, "actualQty", e.target.value)}
                                    className={`ck-w-full ck-max-w-[150px] ck-bg-gray-900 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-outline-none ck-font-bold ck-transition-colors ${
                                      isOverLimit ? "ck-text-red-400 ck-border-red-500" : "ck-text-white ck-border-gray-600"
                                    }`}
                                  />
                                  {actualInput !== undefined && actualInput !== "" && (
                                    <div className="ck-mt-1.5 ck-text-xs ck-font-medium ck-animate-fade-in">
                                      {diff === 0 ? <span className="ck-text-green-400">✅ Khớp</span> : diff > 0 ? <span className="ck-text-blue-400">↗ Dư {diff}</span> : <span className="ck-text-red-400">↘ Hao hụt {Math.abs(diff)}</span>}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="ck-py-3 ck-px-4">
                                <input type="text" placeholder="VD: Đổ vỡ..." value={stocktakeForm[ingId]?.note ?? ""} onChange={(e) => handleStocktakeChange(ingId, "note", e.target.value)} className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-600 ck-outline-none" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================== 6. TAB QUẢN LÝ CÔNG THỨC ================== */}
          {activeManagementTab === "Quản lý công thức" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in mgr-section">
              <div className="mgr-section-head">
                <div>
                  <div className="mgr-section-head__eyebrow">Định mức BOM</div>
                  <h2 className="mgr-section-head__title">Công thức theo sản phẩm</h2>
                </div>
              </div>
              <div className="mgr-search-row">
                <div className="mgr-search-bar mgr-search-bar--orange">
                  <input type="text" placeholder="Tìm theo mã sản phẩm hoặc tên món…" defaultValue={recipeSearchText} onChange={(e) => setRecipeSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setRecipeAppliedSearch(recipeSearchText); }} />
                  <button type="button" onClick={() => setRecipeAppliedSearch(recipeSearchText)}>Tìm</button>
                </div>
              </div>
              <div className="mgr-split">
                <div className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300" style={{ flexBasis: selectedRecipe ? "56%" : "100%", maxWidth: selectedRecipe ? "56%" : "100%", maxHeight: 600, overflowY: "auto" }}>
                  <table>
                    <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>
                        <th>Mã món</th>
                        <th>Sản phẩm</th>
                        <th style={{ textAlign: "center" }}>Công thức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterProducts
                        .filter((prod) => {
                          let matchText = true;
                          if (recipeAppliedSearch) {
                            matchText =
                              (prod.product_id || prod.productId || "").toLowerCase().includes(recipeAppliedSearch.toLowerCase()) ||
                              (prod.product_name || prod.name || "").toLowerCase().includes(recipeAppliedSearch.toLowerCase());
                          }
                          return matchText;
                        })
                        .map((prod, idx) => {
                          const pId = prod.product_id || prod.productId || prod.id;
                          const isSelected = selectedRecipe?.productId === pId || selectedRecipe?.product_id === pId;
                          return (
                            <tr key={idx} onClick={async () => {
                              setSelectedRecipe(prod);
                              try {
                                const res = await api.getRecipeOfProduct(pId);
                                if (res && res.ingredients) {
                                  setEditingRecipeIngredients(res.ingredients.map(ing => ({
                                    ingredientId: ing.ingredientId || ing.id,
                                    name: ing.name || ing.ingredientName,
                                    amountNeeded: Number(ing.qty || ing.amountNeeded || 0),
                                    unit: ing.unit || "N/A"
                                  })));
                                }
                              } catch (e) { setEditingRecipeIngredients([]); }
                            }} className={`ck-cursor-pointer ${isSelected ? "mgr-tr--active-orange" : ""}`}>
                              <td className="mgr-mono-muted">{pId}</td>
                              <td className="mgr-cell-strong">{prod.product_name || prod.name}</td>
                              <td style={{ textAlign: "center" }}><span className="mgr-pill mgr-pill--warn" style={{ cursor: "inherit" }}>Mở BOM →</span></td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedRecipe && (
                  <div className="mgr-aside ck-flex ck-flex-col ck-animate-fade-in" style={{ flex: "0 0 40%", minWidth: 280, maxHeight: 600 }}>
                    <div className="mgr-aside__head" style={{ borderBottom: "1px solid var(--border, #4b5563)" }}>
                      <div>
                        <h3 className="mgr-aside__title">Định mức nguyên liệu</h3>
                        <p className="mgr-panel__hint" style={{ marginTop: 6, color: "#fb923c" }}>{selectedRecipe.product_name || selectedRecipe.name}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedRecipe(null)} className="mgr-icon-btn">✕</button>
                    </div>
                    <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                      {editingRecipeIngredients.map((ing, i) => (
                        <div key={i} className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between ck-mb-2">
                          <div className="ck-flex-1"><p className="ck-text-white">{ing.name}</p></div>
                          <div className="ck-flex ck-items-center ck-gap-2">
                            <input type="number" value={ing.amountNeeded} onChange={(e) => { const arr = [...editingRecipeIngredients]; arr[i].amountNeeded = Number(e.target.value); setEditingRecipeIngredients(arr); }} className="ck-w-20 ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1 ck-rounded" />
                            <span className="ck-text-gray-400">{ing.unit}</span>
                          </div>
                          <button onClick={() => setEditingRecipeIngredients(editingRecipeIngredients.filter((_, idx) => idx !== i))} className="ck-text-red-500 ck-ml-2">🗑</button>
                        </div>
                      ))}
                      <select className="ck-w-full ck-bg-gray-800 ck-text-white ck-p-2 ck-rounded ck-mt-4" onChange={(e) => {
                        const val = e.target.value; if(!val) return;
                        const found = inventory.find(i => (i.ingredientId || i.id) === val);
                        if(found) {
                          setEditingRecipeIngredients([...editingRecipeIngredients, { ingredientId: val, name: found.ingredientName || found.name, amountNeeded: 1, unit: found.unit }]);
                          e.target.value = "";
                        }
                      }}>
                        <option value="">+ Chọn thêm nguyên liệu...</option>
                        {inventory.map(i => <option key={i.id} value={i.ingredientId || i.id}>{i.ingredientName || i.name}</option>)}
                      </select>
                    </div>
                    <div className="ck-p-5 ck-border-t ck-border-gray-700">
                      <button onClick={async () => {
                         try {
                           await api.saveRecipe({ productId: selectedRecipe.product_id || selectedRecipe.id, ingredients: editingRecipeIngredients });
                           alert("Lưu thành công!");
                         } catch (e) { alert("Lỗi: " + e.message); }
                      }} className="mgr-btn mgr-btn--amber ck-w-full" style={{ justifyContent: "center" }}>Lưu công thức</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 8. TAB CỬA HÀNG FRANCHISE ================== */}
          {activeManagementTab === "Cửa hàng Franchise" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in mgr-section">
              {!selectedStore ? (
                <>
                  <div className="mgr-section-head">
                    <div>
                      <div className="mgr-section-head__eyebrow">Mạng lưới</div>
                      <h2 className="mgr-section-head__title">Cửa hàng franchise</h2>
                      <p className="mgr-section-head__sub">
                        Chọn chi nhánh để xem lịch sử giao dịch. Trạng thái hiển thị theo dữ liệu cửa hàng trên hệ thống.
                      </p>
                    </div>
                  </div>
                  <div className="mgr-store-grid">
                    {stores.length === 0 ? (
                      <div className="mgr-empty" style={{ gridColumn: "1 / -1" }}>
                        <div className="mgr-empty__icon">🏪</div>
                        <p className="mgr-empty__title">Chưa có cửa hàng</p>
                        <p className="mgr-empty__sub">Dữ liệu chi nhánh sẽ hiện khi Admin tạo cửa hàng và đồng bộ quyền xem.</p>
                      </div>
                    ) : (
                      stores.map((store) => {
                        const isStoreActive = store.isActive === true || store.active === true || store.is_active === true || store.status === 'ACTIVE';
                        return (
                          <div
                            key={store.id || store.storeId}
                            onClick={async () => {
                              setSelectedStore(store); 
                              try {
                                const res = await api.getStoreHistoryForManager(store.id || store.storeId);
                                setAllOrders(Array.isArray(res) ? res : (res?.data || res?.items || [])); 
                              } catch(e) {
                                setAllOrders([]); 
                              }
                            }}
                            className="mgr-store-card"
                          >
                            <div className="ck-flex ck-justify-between ck-mb-2 ck-items-start">
                              <div className="mgr-store-card__icon">
                                <Store className="ck-text-red-400" size={28} />
                              </div>
                              <span className={`mgr-pill ${isStoreActive ? "mgr-pill--ok" : "mgr-pill--danger"}`}>
                                {isStoreActive ? "Đang chạy" : "Tạm dừng"}
                              </span>
                            </div>
                            <h3 className="mgr-store-card__name">{store.name}</h3>
                            <p className="mgr-store-card__addr">{store.address || "—"}</p>
                            <div className="mgr-store-card__foot">
                              <span className="mgr-mono-muted" style={{ fontSize: 10 }}>{store.id || store.storeId}</span>
                              <span className="mgr-store-card__cta">Chi tiết →</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="ck-flex ck-flex-col ck-gap-6 relative">
                  <div className="mgr-hero" style={{ marginBottom: 0 }}>
                    <div className="ck-flex ck-items-center ck-gap-4 ck-flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedStore(null)}
                        className="mgr-icon-btn"
                        style={{ width: 42, height: 42, borderRadius: "50%" }}
                        aria-label="Quay lại danh sách"
                      >
                        ←
                      </button>
                      <div>
                        <h2 className="mgr-hero__title" style={{ marginBottom: 4 }}>
                          {selectedStore.name}
                        </h2>
                        <p className="mgr-panel__hint" style={{ margin: 0 }}>
                          Mã: {selectedStore.id || selectedStore.storeId}
                          {selectedStore.address ? ` · ${selectedStore.address}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-overflow-hidden shadow-2xl">
                    <div className="ck-p-6 ck-bg-gray-800/50 ck-border-b ck-border-gray-700 ck-flex ck-justify-between items-center">
                      <h3 className="ck-font-black ck-text-gray-300 ck-uppercase tracking-widest text-sm">Lịch sử giao dịch chi nhánh</h3>
                    </div>
                    <table className="ck-w-full ck-text-left ck-border-collapse">
                      <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-[10px] uppercase tracking-tighter">
                        <tr>
                          <th className="ck-p-5">Mã đơn hàng</th>
                          <th className="ck-p-5">Thời gian đặt</th>
                          <th className="ck-p-5">Ngày giao dự kiến</th>
                          <th className="ck-p-5 ck-text-right">Tổng giá trị</th>
                          <th className="ck-p-5 ck-text-center">Trạng thái</th>
                          <th className="ck-p-5 ck-text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="ck-text-sm">
                        {(Array.isArray(allOrders) ? allOrders : []).map((order, idx) => {
                          const canCancel = !["Hoàn thành", "completed", "DELIVERED", "Đã hủy", "cancelled", "CANCELLED"].includes(order.status);
                          const safeOrderId = order.orderId || order.id || order._id;
                          const safeTotal = order.totalAmount || order.totalPrice || order.total || 0;

                          return (
                            <tr key={safeOrderId || idx} className="ck-border-t ck-border-gray-800 hover:ck-bg-gray-800/50 ck-transition-colors">
                              <td className="ck-p-5 ck-mono ck-text-blue-400 ck-font-bold">
                                {safeOrderId || <span className="ck-text-gray-600">Đang cập nhật</span>}
                                {order.orderType === "URGENT" && <span className="text-red-500 text-xs ml-1">🔥</span>}
                              </td>
                              <td className="ck-p-5 ck-text-gray-400">
                                {order.createdAt 
                                  ? new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : order.date || "Chưa rõ"
                                } 
                              </td>
                              <td className="ck-p-5 ck-text-white ck-font-medium">{order.deliveryDate || "Chưa cập nhật"}</td>
                              <td className="ck-p-5 ck-text-right ck-font-black ck-text-orange-400">
                                {Number(safeTotal).toLocaleString()}đ
                              </td>
                              <td className="ck-p-5 ck-text-center">
                                <span className={`ck-badge ${
                                    order.status === "Hoàn thành" || order.status === "completed" || order.status === "DELIVERED" ? "ck-badge-green"
                                  : order.status === "Đã hủy" || order.status === "cancelled" || order.status === "CANCELLED" ? "ck-badge-red"
                                  : "ck-badge-blue"
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="ck-p-5 ck-text-center">
                                <button 
                                  onClick={async () => {
                                    try {
                                      const detail = await api.getOrderDetails(safeOrderId); 
                                      setSelectedOrderDetails(detail);
                                      setShowOrderDetailsModal(true);
                                    } catch(e) { alert("Lỗi lấy chi tiết: " + e.message); }
                                  }}
                                  className="ck-text-blue-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer ck-px-2" title="Xem chi tiết"
                                >
                                  👁️
                                </button>
                                {canCancel && (
                                  <button 
                                    onClick={async () => {
                                      if(window.confirm("⚠️ Bạn có chắc chắn muốn HỦY đơn hàng này?")) {
                                        try {
                                          await api.cancelManagerOrder(safeOrderId);
                                          alert("✅ Đã hủy đơn hàng thành công!");
                                          const res = await api.getStoreHistoryForManager(selectedStore.id || selectedStore.storeId);
                                          setAllOrders(Array.isArray(res) ? res : (res?.data || []));
                                        } catch(e) { alert("Lỗi hủy đơn: " + e.message); }
                                      }
                                    }}
                                    className="ck-text-red-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-cursor-pointer ck-px-2" title="Hủy đơn"
                                  >
                                    🛑
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {(Array.isArray(allOrders) ? allOrders : []).length === 0 && (
                          <tr><td colSpan="6" className="ck-p-10 ck-text-center ck-text-gray-500 italic">Cửa hàng này chưa có dữ liệu giao dịch.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================== 9. TAB CÀI ĐẶT HỆ THỐNG ================== */}
          {activeManagementTab === "Cài đặt hệ thống" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in mgr-section">
              <div className="mgr-settings-hero">
                <h3>⚙️ Cấu hình vận hành trung tâm</h3>
                <p>Tham số toàn hệ thống (bếp, cửa hàng, quy tắc nghiệp vụ).</p>
              </div>
              <div className="ck-grid ck-grid-cols-1 md:ck-grid-cols-2 ck-gap-6">
                {Object.keys(systemConfigs).length > 0 ? (
                  Object.entries(systemConfigs).map(([key, val]) => (
                    <div key={key} className="mgr-config-card">
                      <span className="mgr-config-card__tag">Tham số hệ thống</span>
                      <div className="mgr-config-card__key">{key}</div>
                      <h4 className="mgr-config-card__title">{key.replace(/_/g, " ")}</h4>
                      <div className="ck-flex ck-gap-3 ck-items-stretch ck-flex-wrap">
                        <input
                          type="text" defaultValue={val} id={`input-cfg-${key}`}
                          className="ck-flex-1 ck-min-w-[160px] ck-bg-gray-900 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const inputDom = document.getElementById(`input-cfg-${key}`);
                            if (!inputDom.value.trim()) return alert("Vui lòng không để trống!");
                            try {
                              await api.updateSystemConfig(key.trim(), { configValue: String(inputDom.value.trim()), description: "Cập nhật từ Manager" });
                              alert("✅ Đã cập nhật thành công!");
                            } catch (e) { alert("❌ Lỗi: " + e.message); }
                          }}
                          className="mgr-btn mgr-btn--amber"
                        >Lưu</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mgr-empty" style={{ gridColumn: "1 / -1" }}><p className="mgr-empty__title">Chưa có cấu hình</p></div>
                )}
              </div>
            </div>
          )}

          </div>
        </div>
      </main>

      {/* CHI TIẾT ĐƠN HÀNG MODAL */}
      {showOrderDetailsModal && selectedOrderDetails && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-[100] ck-animate-fade-in ck-backdrop-blur-sm">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-8 ck-rounded-3xl ck-w-[600px] ck-max-h-[85vh] ck-overflow-y-auto ck-scrollbar shadow-2xl">
            <div className="ck-flex ck-justify-between ck-items-start ck-mb-6 ck-border-b ck-border-gray-800 ck-pb-4">
              <div>
                <h3 className="ck-text-2xl ck-font-black ck-text-white ck-mb-1">Chi tiết đơn hàng</h3>
                <p className="ck-text-blue-400 ck-font-mono ck-text-sm">#{selectedOrderDetails.id || selectedOrderDetails.orderId}</p>
              </div>
              <button onClick={() => setShowOrderDetailsModal(false)} className="ck-text-gray-500 hover:ck-text-red-400 ck-bg-gray-800 ck-w-8 ck-h-8 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-border-none ck-cursor-pointer">✕</button>
            </div>
            
            <div className="ck-space-y-4">
              <div className="ck-bg-gray-800 ck-p-4 ck-rounded-xl ck-flex ck-justify-between ck-items-center">
                  <span className="ck-text-gray-400 ck-text-sm">Trạng thái:</span>
                  <span className="ck-badge ck-badge-blue">{selectedOrderDetails.status}</span>
              </div>
              {(selectedOrderDetails.note || selectedOrderDetails.notes) && (
                <div className="ck-bg-orange-500/10 ck-border ck-border-orange-500/30 ck-p-4 ck-rounded-xl">
                  <span className="ck-text-orange-400 ck-text-xs ck-font-bold ck-uppercase ck-block ck-mb-1">Ghi chú:</span>
                  <p className="ck-text-gray-300 ck-text-sm">{selectedOrderDetails.note || selectedOrderDetails.notes}</p>
                </div>
              )}
              <h4 className="ck-text-white ck-font-bold ck-mt-6 ck-mb-2">Danh sách món ({ (selectedOrderDetails.items || selectedOrderDetails.details || []).length })</h4>
              <div className="ck-space-y-2">
                {(selectedOrderDetails.items || selectedOrderDetails.details || []).map((item, idx) => (
                  <div key={idx} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800/50 ck-border ck-border-gray-800 ck-p-3 ck-rounded-xl">
                      <div>
                        <p className="ck-text-white ck-font-bold ck-text-sm">{item.productName || item.name || item.productId}</p>
                        <p className="ck-text-xs ck-text-gray-500">SL: {item.quantity}</p>
                      </div>
                      <p className="ck-text-orange-400 ck-font-mono ck-font-bold">
                        {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}đ
                      </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateReport && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-animate-fade-in ck-backdrop-blur-sm" style={{ zIndex: 9999 }}>
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-p-8 ck-w-[450px] shadow-2xl">
            <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
              <h3 className="ck-text-xl ck-font-black ck-text-white">Tạo Báo Cáo</h3>
              <button onClick={() => setShowCreateReport(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl">✕</button>
            </div>
            <div className="ck-space-y-5 ck-text-sm">
              <input type="text" value={newReport.name} onChange={(e) => setNewReport({ ...newReport, name: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700" placeholder="Tên báo cáo..." />
              <div className="ck-grid ck-grid-cols-2 ck-gap-4">
                <input type="date" value={newReport.fromDate} onChange={(e) => setNewReport({ ...newReport, fromDate: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700" />
                <input type="date" value={newReport.toDate} onChange={(e) => setNewReport({ ...newReport, toDate: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700" />
              </div>
            </div>
            <div className="ck-mt-8">
              <button onClick={handleCreateReport} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-black">Tạo & Xuất file</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPage;