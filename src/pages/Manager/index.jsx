import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  Search,
  Plus,
  Store,
  ShoppingCart,
  Trash2,
  X,
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

/** Tab ngang — cùng pattern `.tabs` / `.tab` với trang Admin */
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
  const [, setCategoriesList] = useState([]);
  const [, setReports] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [kpiStats, setKpiStats] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isOrderingForStore, setIsOrderingForStore] = useState(false);
  const [stores, setStores] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState("");

  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [searchTermHộ, setSearchTermHộ] = useState("");
  const [systemConfigs, setSystemConfigs] = useState({});

  // --- BỔ SUNG STATE CHO BỘ LỌC DATE PICKER KPI ---
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // --- BỔ SUNG STATE CHO ĐƠN HÀNG HỘ ---
  const [isUrgentOrder, setIsUrgentOrder] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  // --- STATE CHO KIỂM KÊ KHO (STOCKTAKE) ---
  const [stocktakeForm, setStocktakeForm] = useState({}); 
  const [isSubmittingStocktake, setIsSubmittingStocktake] = useState(false);
  
  // --- STATE CHO QUY ĐỔI ĐƠN VỊ ---
  const [conversions, setConversions] = useState([]);
  const [showAddConversion, setShowAddConversion] = useState(false);
  const [newConversion, setNewConversion] = useState({ unitName: "", conversionFactor: "" });
  const [testData, setTestData] = useState({ unit: "", qty: "" });
  const [testResult, setTestResult] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // --- STATE CHO NHẬP KHO (TỪ ADMIN) ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    note: "",
    items: [{ ingredientId: "", quantity: "", importPrice: "" }],
  });
  const [importSubmitting, setImportSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, reps, invs, kpis, sts, cfgs, dashFull] =
        await Promise.all([
          api.getMasterProducts().catch(() => []),    // 1
          api.getReports().catch(() => []),           // 2
          api.getManagerInventory().catch(() => []),  // 3
          api.getKPIStats().catch(() => []),          // 4
          api.getStoresAll?.().catch(() => []),       // 5
          api.getSystemConfigs?.().catch(() => ({})), // 6
          api.getManagerAnalytics().catch(() => null),// 7
        ]);

      setMasterProducts(prods);
      setCategoriesList([]);
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
  // CÁC HÀM XỬ LÝ CHUNG
  // ==========================================
  const addToCart = (product) => {
    const skuToUse = product.product_id || product.sku || product.id;
    const existing = cart.find((i) => (i.product_id || i.sku || i.id) === skuToUse);
    if (existing)
      setCart(
        cart.map((i) =>
          (i.product_id || i.sku || i.id) === skuToUse ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    else setCart([...cart, { ...product, quantity: 1 }]);
  };

  const handleCreateOrderHộ = async () => {
    if (!cart.length || !deliveryDate) return alert("Vui lòng chọn món và ngày giao!");
    const orderBody = {
      storeId: selectedStore.id || selectedStore.storeId,
      deliveryDate: deliveryDate,
      note: `[MANAGER ĐẶT HỘ${isUrgentOrder ? " - KHẨN CẤP" : ""}] ${orderNote}`,
      items: cart.map((i) => ({
        productId: i.product_id || i.productId || i.id || i.sku,
        quantity: Number(i.quantity),
      })),
    };
    try {
      if (isUrgentOrder) {
        await api.addOrderUrgent(orderBody);
      } else {
        await api.placeOrderForStore(orderBody);
      }
      
      alert(`✅ Đã tạo đơn đặt hàng hộ ${isUrgentOrder ? "(Khẩn cấp)" : "(Tiêu chuẩn)"} thành công!`);
      
      setCart([]);
      setIsOrderingForStore(false);
      setIsUrgentOrder(false); 
      setOrderNote("");
      
      const res = await api.getStoreHistoryForManager(selectedStore.id || selectedStore.storeId);
      setAllOrders(Array.isArray(res) ? res : (res?.data || res?.items || []));
    } catch (e) {
      alert("Lỗi đặt hàng hộ: " + e.message);
    }
  };
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
    // 1. Lọc ra những món có nhập actualQty
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
        
        // Reset form và load lại data kho
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
  // HÀM XỬ LÝ SẢN PHẨM MASTER
  // ==========================================
  const [showAddMasterProduct, setShowAddMasterProduct] = useState(false);
  const [editingMasterProduct, setEditingMasterProduct] = useState(null);
  const [newMasterProduct, setNewMasterProduct] = useState({
    productId: "", 
    name: "",
    category: "Gà rán",
    cogs: "",
    price: "",
    status: "Đang bán",
    emoji: "🍽️",
  });
  const [productSearchText, setProductSearchText] = useState("");
  const [productAppliedSearch, setProductAppliedSearch] = useState("");
  const [filterProductCategory, setFilterProductCategory] =
    useState("Tất cả danh mục");

  const handleSaveMasterProduct = async () => {
    if (!newMasterProduct.name || !newMasterProduct.price)
      return alert("Vui lòng điền Tên và Giá bán!");

    let mappedCategoryId = 1; 
    if (newMasterProduct.category === "Burger") mappedCategoryId = 2;
    else if (newMasterProduct.category === "Thức uống") mappedCategoryId = 3;
    else if (newMasterProduct.category === "Ăn vặt") mappedCategoryId = 4;

    const payload = {
      productId: newMasterProduct.productId || undefined, 
      productName: newMasterProduct.name,              
      categoryId: mappedCategoryId,                  
      sellingPrice: Number(newMasterProduct.price), 
      baseUnit: "PHAN",
      isActive: newMasterProduct.status !== "Ngừng bán", 
      ingredients: []                                  
    };

    try {
      if (editingMasterProduct) {
        await api.updateProduct(editingMasterProduct.product_id, payload);
        alert("Cập nhật sản phẩm thành công!");
      } else {
        await api.createProduct(payload);
        alert("Thêm sản phẩm thành công!");
      }
      setShowAddMasterProduct(false);
      loadData();
    } catch (error) {
      alert("Lỗi lưu sản phẩm: " + error.message);
    }
  };

  const handleDeleteMasterProduct = async (productId) => {
    if (window.confirm("Bạn có chắc muốn chuyển SP này sang trạng thái Ngừng Bán?")) {
      try {
        await api.updateProductStatus(productId, false); 
        loadData();
      } catch (error) {
        alert("Lỗi cập nhật trạng thái!");
      }
    }
  };

  // ==========================================
  // HÀM XỬ LÝ KHÁC
  // ==========================================
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "",
    type: "EXCEL",
    fromDate: "",
    toDate: "",
  });

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
    let safe = 0;
    let low = 0;
    let out = 0;
    for (const item of filteredInventory) {
      const stock = Number(item.stock) || 0;
      const min = Number(item.minThreshold ?? item.min ?? 10);
      if (stock <= 0) out += 1;
      else if (stock <= min) low += 1;
      else safe += 1;
    }
    return {
      shown: filteredInventory.length,
      safe,
      low,
      out,
      totalInSystem: inventory.length,
    };
  }, [filteredInventory, inventory]);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");
  const [editingRecipeIngredients, setEditingRecipeIngredients] = useState([]);

  useEffect(() => {
    if (selectedInventoryItem) {
      const ingId = selectedInventoryItem.ingredientId || selectedInventoryItem.id || selectedInventoryItem.sku;
      api.getConversionsByIngredient(ingId)
        .then(res => setConversions(Array.isArray(res) ? res : (res?.data || [])))
        .catch(() => setConversions([]));
    } else {
      setConversions([]);
    }
    setTestResult(null);
    setTestData({ unit: "", qty: "" });
    setShowAddConversion(false);
  }, [selectedInventoryItem]);

  // ==========================================
  // HÀM XỬ LÝ NHẬP KHO
  // ==========================================
  const handleAddImportRow = () => {
    setImportForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { ingredientId: "", quantity: "", importPrice: "" },
      ],
    }));
  };

  const handleRemoveImportRow = (index) => {
    setImportForm((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? [{ ingredientId: "", quantity: "", importPrice: "" }]
          : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleImportRowChange = (index, field, value) => {
    setImportForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSubmitImport = async (e) => {
    e.preventDefault();
    const validItems = importForm.items.filter(
      (i) => i.ingredientId && (Number(i.quantity) || 0) > 0,
    );
    if (validItems.length === 0) return;
    setImportSubmitting(true);
    try {
      await api.importInventory({
        note: importForm.note.trim(),
        items: validItems.map((i) => {
          const ing = inventory.find(
            (x) => (x.ingredientId ?? x.id) === i.ingredientId,
          );
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
      console.error("Import inventory:", err);
      alert("❌ Lỗi nhập kho: " + err.message);
    } finally {
      setImportSubmitting(false);
    }
  };
  // --- BỔ SUNG LOGIC GOM CỤM DỮ LIỆU BIỂU ĐỒ ---
  const chartData = React.useMemo(() => {
    const raw = dashboardData?.exportTrend || [];
    if (raw.length === 0) return [];

    // Chuẩn hóa dữ liệu thô
    const normalized = raw.map(d => ({
      date: d.date || d.timeLabel || "",
      val: Number(d.revenue || d.exportValue || d.totalValue || 0),
      count: Number(d.orderCount || d.totalOrders || 0)
    }));

    const len = normalized.length;

    // 1. Khoảng thời gian <= 14 ngày: Hiện theo từng ngày
    if (len <= 14) {
      return normalized.map(d => ({
        label: d.date.split('-').slice(1).reverse().join('/'), // VD: 27/03
        val: d.val,
        count: d.count,
        tooltipTitle: `Ngày: ${d.date.split('-').reverse().join('/')}`
      }));
    } 
    // 2. Khoảng thời gian từ 15 -> 60 ngày: Nhóm theo Tuần (7 ngày 1 cột)
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
    // 3. Khoảng thời gian > 60 ngày: Nhóm theo Tháng
    else {
      const monthMap = {};
      normalized.forEach(d => {
        const parts = d.date.split('-'); 
        let monthKey = "Khác";
        if (parts.length >= 2) monthKey = `${parts[1]}/${parts[0]}`; // MM/YYYY

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { label: `T${parts[1]}`, val: 0, count: 0, tooltipTitle: `Tháng ${monthKey}` };
        }
        monthMap[monthKey].val += d.val;
        monthMap[monthKey].count += d.count;
      });
      return Object.values(monthMap);
    }
  }, [dashboardData?.exportTrend]);


  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg">
            <LayoutDashboard className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">
              Phân hệ quản lý
            </h1>
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
              onLogout ??
              (() => {
                api.logout();
                window.location.reload();
              })
            }
          />
        </div>
      </header>

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

      <main className="ck-p-8">
        <div
          className="ck-max-w-7xl ingredient-polished manager-shell"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
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
                      setEditingMasterProduct(null);
                      setShowAddMasterProduct(false);
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
                    Theo dõi chỉ số KPI theo khoảng thời gian, giá trị xuất kho và các món cần lưu ý. Chọn kỳ
                    rồi bấm <strong>Lọc dữ liệu</strong> để đồng bộ biểu đồ và danh sách bên dưới.
                  </p>
                </div>
                <div className="mgr-toolbar">
                  <div className="mgr-toolbar__grow">
                    <input
                      type="date"
                      value={filterStart}
                      onChange={(e) => setFilterStart(e.target.value)}
                      className="mgr-input-date"
                      aria-label="Từ ngày"
                    />
                    <span className="mgr-toolbar-sep">đến</span>
                    <input
                      type="date"
                      value={filterEnd}
                      onChange={(e) => setFilterEnd(e.target.value)}
                      className="mgr-input-date"
                      aria-label="Đến ngày"
                    />
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
                        } catch (e) {
                          console.error(e);
                        }
                        setIsLoading(false);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? "Đang tải…" : "Lọc dữ liệu"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mgr-btn mgr-btn--primary"
                    onClick={() => setShowCreateReport(true)}
                  >
                    <Plus size={16} /> Xuất báo cáo
                  </button>
                </div>
              </div>

              <div className="mgr-stat-grid">
                {kpiStats.length > 0 ? (
                  kpiStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className={`mgr-stat-card mgr-stat-card--${idx % 4}`}
                    >
                      <div className="mgr-stat-card__label">{stat.label}</div>
                      <div className="mgr-stat-card__value">{stat.value}</div>
                      <div className="mgr-stat-card__foot">
                        <span
                          className={`mgr-delta ${stat.isUp ? "mgr-delta--up" : "mgr-delta--down"}`}
                        >
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
                    <p className="mgr-empty__sub">
                      Nếu lâu không hiện, hãy kiểm tra khoảng ngày đã chọn và thử lọc lại.
                    </p>
                  </div>
                )}
              </div>

              <div className="mgr-kpi-layout">
                <div className="mgr-panel" style={{ minHeight: 360 }}>
                  <div className="mgr-panel__head">
                    <div>
                      <h3 className="mgr-panel__title">Giá trị xuất kho theo thời gian</h3>
                      <span className="mgr-panel__hint">
                        Cột cao = giá trị lớn hơn trong kỳ · số đơn hiển thị trên mỗi cột
                      </span>
                    </div>
                  </div>
                  <div className="mgr-panel__body">
                    <div className="mgr-chart" style={{ minHeight: 280 }}>
                      {chartData.length > 0 ? (
                        chartData.map((item, i) => {
                          const maxVal =
                            Math.max(...chartData.map((d) => d.val)) || 1;
                          const heightPercent =
                            item.val > 0
                              ? Math.max((item.val / maxVal) * 100, 5)
                              : 0;
                          return (
                            <div key={i} className="mgr-chart__col">
                              <div className="mgr-chart__bubble">
                                <span className="mgr-chart__bubble-val">
                                  {item.val > 0
                                    ? `${(item.val / 1000).toLocaleString()}k`
                                    : "0đ"}
                                </span>
                                <span className="mgr-chart__bubble-sub">
                                  {item.count} đơn
                                </span>
                              </div>
                              <div className="mgr-chart__bar-wrap">
                                <div
                                  className="mgr-chart__bar"
                                  style={{
                                    height: `${heightPercent}%`,
                                    minHeight: item.val > 0 ? 4 : 0,
                                    opacity: item.val > 0 ? 1 : 0,
                                  }}
                                />
                              </div>
                              <div className="mgr-chart__axis">
                                <span
                                  className="mgr-chart__axis-label"
                                  title={item.tooltipTitle || item.label}
                                  style={{
                                    fontSize:
                                      item.label.length > 5 ? 9 : 11,
                                  }}
                                >
                                  {item.label}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="mgr-empty" style={{ margin: "auto", border: "none", background: "transparent" }}>
                          <div className="mgr-empty__icon">📉</div>
                          <p className="mgr-empty__title">Chưa có dữ liệu biểu đồ</p>
                          <p className="mgr-empty__sub">Chọn kỳ khác hoặc lọc lại sau khi có phát sinh xuất kho.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ck-flex ck-flex-col ck-gap-5">
                  <div className="mgr-mini-panel">
                    <h3 className="mgr-mini-panel__title">
                      Top xuất kho
                      <span className="mgr-mini-panel__title-badge">Theo giá trị</span>
                    </h3>
                    <div className="mgr-mini-panel__scroll ck-scrollbar">
                      {dashboardData?.topExportedProducts?.length > 0 ? (
                        dashboardData.topExportedProducts.map((p, i) => (
                          <div key={i} className="mgr-row">
                            <div>
                              <p className="mgr-row__name">{p.productName}</p>
                              <p className="mgr-row__meta">
                                Đã xuất: {p.totalQuantity} · #{i + 1}
                              </p>
                            </div>
                            <span className="mgr-row__val">
                              {Number(p.totalValue || 0).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="mgr-empty__sub" style={{ textAlign: "center", padding: "1rem 0" }}>
                          Chưa có dữ liệu xếp hạng.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mgr-mini-panel">
                    <h3 className="mgr-mini-panel__title">
                      Cảnh báo giao thiếu
                      <span
                        className="mgr-mini-panel__title-badge"
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#fca5a5",
                        }}
                      >
                        Top sự cố
                      </span>
                    </h3>
                    <div className="mgr-mini-panel__scroll ck-scrollbar">
                      {dashboardData?.topIssueProducts?.length > 0 ? (
                        dashboardData.topIssueProducts.map((w, i) => (
                          <div key={i} className="mgr-row mgr-row--alert">
                            <div>
                              <p className="mgr-row__name">{w.productName}</p>
                              <p className="mgr-row__meta">
                                Số ca ghi nhận: {w.totalQuantity}
                              </p>
                            </div>
                            <span className="mgr-row__val">
                              {Number(w.totalValue || 0).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="mgr-empty__sub" style={{ textAlign: "center", padding: "1rem 0", color: "#86efac" }}>
                          Không có sự cố trong dữ liệu hiện tại.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================== 2. TAB QUẢN LÝ SẢN PHẨM ================== */}
          {activeManagementTab === "Quản lý sản phẩm" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full mgr-section">
              <div className="mgr-section-head">
                <div>
                  <div className="mgr-section-head__eyebrow">Danh mục master</div>
                  <h2 className="mgr-section-head__title">Sản phẩm &amp; giá franchise</h2>
                  <p className="mgr-section-head__sub">
                    Tra cứu theo mã hoặc tên, lọc theo danh mục. Bấm chỉnh sửa để mở bảng chi tiết bên phải — kiểm tra giá
                    vốn, giá bán và trạng thái niêm yết trước khi lưu.
                  </p>
                </div>
              </div>
              <div className="mgr-search-row">
                <div className="mgr-search-bar mgr-search-bar--rose">
                  <input
                    type="text"
                    placeholder="Tìm theo mã SKU hoặc tên sản phẩm…"
                    defaultValue={productSearchText}
                    onChange={(e) => setProductSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setProductAppliedSearch(productSearchText);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setProductAppliedSearch(productSearchText)}
                  >
                    Tìm
                  </button>
                </div>
                <select
                  value={filterProductCategory}
                  onChange={(e) => setFilterProductCategory(e.target.value)}
                  className="mgr-select"
                >
                  <option value="Tất cả danh mục">Tất cả danh mục</option>
                  <option value="Gà rán">Gà rán</option>
                  <option value="Burger">Burger</option>
                  <option value="Thức uống">Thức uống</option>
                  <option value="Ăn vặt">Ăn vặt</option>
                </select>
              </div>

              <div className="mgr-split">
                <div
                  className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300"
                  style={{
                    flexBasis: showAddMasterProduct ? "64%" : "100%",
                    maxWidth: showAddMasterProduct ? "64%" : "100%",
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
                              (prod.product_id || prod.productId || "")
                                .toLowerCase()
                                .includes(productAppliedSearch.toLowerCase()) ||
                              (prod.product_name || prod.name || "")
                                .toLowerCase()
                                .includes(productAppliedSearch.toLowerCase());
                          const matchCat =
                            filterProductCategory === "Tất cả danh mục" ||
                            prod.category === filterProductCategory;
                          return matchText && matchCat;
                        });
                        if (rows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ padding: 0, border: "none" }}>
                                <div className="mgr-empty" style={{ margin: 16 }}>
                                  <div className="mgr-empty__icon">🍽️</div>
                                  <p className="mgr-empty__title">Không có sản phẩm phù hợp</p>
                                  <p className="mgr-empty__sub">
                                    Đổi danh mục hoặc xóa từ khóa tìm kiếm. Tổng trong hệ thống:{" "}
                                    {masterProducts.length} SKU.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return rows.map((prod, idx) => {
                          const isSelling =
                            prod.isActive === true ||
                            prod.active === true ||
                            prod.is_active === true ||
                            prod.is_active === 1 ||
                            String(prod.is_active) === "true";

                          return (
                            <tr key={idx}>
                              <td className="mgr-mono-muted">
                                {prod.product_id || prod.productId}
                              </td>
                              <td className="mgr-cell-strong">
                                <span style={{ marginRight: 6 }}>{prod.emoji || "🍴"}</span>
                                {prod.product_name || prod.name}
                              </td>
                              <td style={{ color: "var(--text2, #d1d5db)" }}>{prod.category}</td>
                              <td className="mgr-mono-muted" style={{ color: "#86efac" }}>
                                {Number(prod.selling_price || prod.sellingPrice || prod.price || 0).toLocaleString("vi-VN")} ₫
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span
                                  className={`mgr-pill ${isSelling ? "mgr-pill--ok" : "mgr-pill--danger"}`}
                                >
                                  {isSelling ? "Đang bán" : "Ngừng bán"}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  title="Chỉnh sửa"
                                  onClick={() => {
                                    setEditingMasterProduct(prod);
                                    setNewMasterProduct({
                                      ...prod,
                                      name: prod.product_name || prod.name,
                                      productId: prod.product_id || prod.productId,
                                      price: prod.selling_price || prod.sellingPrice || prod.price,
                                      status: isSelling ? "Đang bán" : "Ngừng bán",
                                      emoji: prod.emoji || "🍴"
                                    });
                                    setShowAddMasterProduct(true);
                                  }}
                                  className="mgr-icon-btn"
                                  style={{ marginRight: 8 }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  title="Ngừng bán"
                                  onClick={() => handleDeleteMasterProduct(prod.product_id || prod.productId)}
                                  className="mgr-icon-btn"
                                  style={{ color: "#f87171" }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {showAddMasterProduct && (
                  <div
                    className="mgr-aside ck-animate-fade-in"
                    style={{ flex: "0 0 32%", minWidth: 280 }}
                  >
                    <div className="mgr-aside__head">
                      <div>
                        <h3 className="mgr-aside__title">
                          {editingMasterProduct ? "Chi tiết sản phẩm" : "Thêm sản phẩm mới"}
                        </h3>
                        <span className="mgr-panel__hint" style={{ marginTop: 6 }}>
                          {editingMasterProduct
                            ? "Cập nhật giá và trạng thái niêm yết cho chuỗi franchise."
                            : "Nhập mã duy nhất (SKU) và thông tin niêm yết."}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddMasterProduct(false)}
                        className="mgr-icon-btn"
                        aria-label="Đóng"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Mã Sản Phẩm</label>
                        <input
                          type="text"
                          readOnly={!!editingMasterProduct}
                          value={newMasterProduct.productId}
                          onChange={(e) => setNewMasterProduct({ ...newMasterProduct, productId: e.target.value })}
                          className={`ck-w-full ck-bg-gray-800 ${editingMasterProduct ? 'ck-text-gray-500' : 'ck-text-white'} ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none`}
                          placeholder={editingMasterProduct ? "" : "VD: GA01 (Chữ hoa)"}
                        />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Tên sản phẩm *</label>
                        <div className="ck-flex ck-gap-2">
                          <input
                            type="text"
                            value={newMasterProduct.emoji}
                            onChange={(e) => setNewMasterProduct({ ...newMasterProduct, emoji: e.target.value })}
                            className="ck-w-12 ck-bg-gray-800 ck-text-white ck-px-2 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-text-center ck-outline-none"
                          />
                          <input
                            type="text"
                            value={newMasterProduct.name}
                            onChange={(e) => setNewMasterProduct({ ...newMasterProduct, name: e.target.value })}
                            className="ck-flex-1 ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">Danh mục</label>
                        <select
                          value={newMasterProduct.category}
                          onChange={(e) => setNewMasterProduct({ ...newMasterProduct, category: e.target.value })}
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                        >
                          <option>Gà rán</option>
                          <option>Burger</option>
                          <option>Thức uống</option>
                          <option>Ăn vặt</option>
                        </select>
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">Giá vốn</label>
                          <input
                            type="number"
                            value={newMasterProduct.cogs}
                            onChange={(e) => setNewMasterProduct({ ...newMasterProduct, cogs: e.target.value })}
                            className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-blue-400 ck-outline-none"
                          />
                        </div>
                        <div className="ck-mt-4">
    <label className="ck-block ck-text-gray-400 ck-mb-1">Giá Franchise</label>
    <input
      type="number"
      value={newMasterProduct.price}
      onChange={(e) => setNewMasterProduct({ ...newMasterProduct, price: e.target.value })}
      className="ck-w-full ck-bg-gray-800 ck-text-green-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-green-400 ck-outline-none"
    />
  </div>
                      </div>
                    </div>
                    <div className="ck-mt-6">
                      <button
                        type="button"
                        onClick={handleSaveMasterProduct}
                        className="mgr-btn mgr-btn--primary ck-w-full"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {editingMasterProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 3. TAB TỔNG QUAN TỒN KHO ================== */}
          {activeManagementTab === "Tổng quan tồn kho" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full mgr-section">
              <div className="mgr-section-head">
                <div>
                  <div className="mgr-section-head__eyebrow">Kho trung tâm</div>
                  <h2 className="mgr-section-head__title">Tồn kho nguyên liệu</h2>
                  <p className="mgr-section-head__sub">
                    Bảng dưới lọc theo ô tìm kiếm. Bấm một dòng để xem chi tiết, quy đổi đơn vị và kiểm thử công thức.
                    Dùng <strong>Nhập kho</strong> để tạo phiếu nhập nhiều dòng.
                  </p>
                </div>
              </div>

              <div className="mgr-strip">
                <div className="mgr-strip-item">
                  <div className="mgr-strip-item__label">Đang hiển thị</div>
                  <div className="mgr-strip-item__val">{inventorySummary.shown}</div>
                </div>
                <div className="mgr-strip-item mgr-strip-item--teal">
                  <div className="mgr-strip-item__label">Mức an toàn</div>
                  <div className="mgr-strip-item__val">{inventorySummary.safe}</div>
                </div>
                <div className="mgr-strip-item mgr-strip-item--amber">
                  <div className="mgr-strip-item__label">Sắp hết (≤ ngưỡng)</div>
                  <div className="mgr-strip-item__val">{inventorySummary.low}</div>
                </div>
                <div className="mgr-strip-item mgr-strip-item--red">
                  <div className="mgr-strip-item__label">Hết hàng</div>
                  <div className="mgr-strip-item__val">{inventorySummary.out}</div>
                </div>
              </div>
              <p className="mgr-panel__hint" style={{ marginTop: -8, marginBottom: 4 }}>
                Tổng SKU trong hệ thống: {inventorySummary.totalInSystem} · Ngưỡng mặc định khi thiếu: min / minThreshold hoặc 10.
              </p>

              <div className="mgr-search-row">
                <div className="mgr-search-bar mgr-search-bar--amber">
                  <input
                    type="text"
                    placeholder="Tìm theo mã nguyên liệu hoặc tên…"
                    defaultValue={inventorySearchText}
                    onChange={(e) => setInventorySearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setInventoryAppliedSearch(inventorySearchText);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setInventoryAppliedSearch(inventorySearchText)
                    }
                  >
                    Tìm
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportForm({
                      note: "",
                      items: [{ ingredientId: "", quantity: "", importPrice: "" }],
                    });
                    setShowImportModal(true);
                  }}
                  className="mgr-btn mgr-btn--green"
                >
                  📦 Nhập kho
                </button>
              </div>

              <div className="mgr-split">
                <div
                  className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300"
                  style={{
                    flexBasis: selectedInventoryItem ? "64%" : "100%",
                    maxWidth: selectedInventoryItem ? "64%" : "100%",
                  }}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Mã hàng</th>
                        <th>Nguyên liệu / vật tư</th>
                        <th style={{ textAlign: "right" }}>Tồn hiện tại</th>
                        <th style={{ textAlign: "center" }}>Tình trạng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length > 0 ? (
                        filteredInventory.map((item, idx) => {
                          const isOutOfStock = item.stock <= 0;
                          const minTh = Number(item.minThreshold ?? item.min ?? 10);
                          const isLowStock =
                            !isOutOfStock && item.stock <= minTh;
                          const selId =
                            selectedInventoryItem?.ingredientId ||
                            selectedInventoryItem?.sku;
                          const rowId = item.ingredientId || item.sku;
                          const isActive = selId && rowId && String(selId) === String(rowId);
                          return (
                            <tr
                              key={idx}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedInventoryItem(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setSelectedInventoryItem(item);
                              }}
                              className={`ck-cursor-pointer ${isActive ? "mgr-tr--active" : ""}`}
                            >
                              <td className="mgr-mono-muted">
                                {item.ingredientId || item.sku}
                              </td>
                              <td className="mgr-cell-strong">
                                {item.ingredientName || item.name}
                              </td>
                              <td
                                className="mgr-mono-muted"
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: isOutOfStock
                                    ? "#f87171"
                                    : isLowStock
                                      ? "#fcd34d"
                                      : "var(--text, #fff)",
                                }}
                              >
                                {Number(item.stock || 0).toLocaleString("vi-VN")}{" "}
                                <span style={{ fontWeight: 500, opacity: 0.75 }}>
                                  {item.unit}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {isOutOfStock ? (
                                  <span className="mgr-pill mgr-pill--danger">Hết hàng</span>
                                ) : isLowStock ? (
                                  <span className="mgr-pill mgr-pill--warn">Sắp hết</span>
                                ) : (
                                  <span className="mgr-pill mgr-pill--ok">An toàn</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ padding: 0, border: "none" }}>
                            <div className="mgr-empty" style={{ margin: 16 }}>
                              <div className="mgr-empty__icon">📭</div>
                              <p className="mgr-empty__title">Không có dòng phù hợp</p>
                              <p className="mgr-empty__sub">
                                Thử bỏ bớt từ khóa tìm kiếm hoặc kiểm tra dữ liệu đồng bộ từ bếp.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedInventoryItem && (
                  <div
                    className="mgr-aside ck-animate-fade-in"
                    style={{ flex: "0 0 32%", minWidth: 280 }}
                  >
                    <div className="mgr-aside__head">
                      <div>
                        <h3 className="mgr-aside__title">Chi tiết tồn kho</h3>
                        <span className="mgr-panel__hint" style={{ marginTop: 6 }}>
                          Quy đổi đơn vị và kiểm tra tính toán theo SKU đã chọn.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInventoryItem(null)}
                        className="mgr-icon-btn"
                        aria-label="Đóng"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-space-y-5 ck-text-sm">
                      <div
                        className="ck-p-4 ck-rounded-xl"
                        style={{
                          background: "rgba(20, 184, 166, 0.08)",
                          border: "1px solid rgba(45, 212, 191, 0.25)",
                        }}
                      >
                        <p className="mgr-mono-muted ck-mb-1">
                          {selectedInventoryItem.ingredientId || selectedInventoryItem.sku}
                        </p>
                        <p className="ck-text-lg ck-text-white ck-font-bold ck-mb-1">
                          {selectedInventoryItem.ingredientName || selectedInventoryItem.name}
                        </p>
                        <p className="ck-text-xs ck-font-bold ck-mb-3" style={{ color: "#c4b5fd" }}>
                          Kho tổng · Đơn vị gốc: {selectedInventoryItem.unit || "—"}
                        </p>
                        <div className="ck-flex ck-justify-between ck-items-end mt-4">
                          <div>
                            <p className="ck-text-xs ck-text-gray-400 ck-mb-1">
                              Số lượng tồn
                            </p>
                            <p className="ck-text-2xl ck-font-black ck-text-white">
                              {Number(selectedInventoryItem.stock || 0).toLocaleString("vi-VN")}{" "}
                              <span className="ck-text-sm ck-text-gray-500 ck-font-normal">
                                {selectedInventoryItem.unit}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* BẮT ĐẦU KHỐI QUY ĐỔI ĐƠN VỊ */}
                      <div className="ck-mt-6 ck-pt-6 ck-border-t ck-border-gray-700">
                        <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                          <h4 className="ck-text-sm ck-font-bold ck-text-white">
                            Quy đổi đơn vị (Gốc: {selectedInventoryItem.unit})
                          </h4>
                          <button
                            onClick={() => setShowAddConversion(!showAddConversion)}
                            className="ck-text-xs ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-blue-400 ck-px-3 ck-py-1 ck-rounded-lg ck-font-bold ck-border ck-border-gray-600 ck-transition-colors"
                          >
                            {showAddConversion ? "Đóng" : "+ Thêm Đơn Vị"}
                          </button>
                        </div>

                        {showAddConversion && (
                          <div className="ck-bg-gray-800 ck-p-3 ck-rounded-xl ck-mb-4 ck-border ck-border-blue-500/30 ck-animate-fade-in">
                            <div className="ck-flex ck-gap-2">
                              <input
                                type="text"
                                placeholder="Tên (VD: BOX)"
                                value={newConversion.unitName}
                                onChange={(e) => setNewConversion({ ...newConversion, unitName: e.target.value.toUpperCase() })}
                                className="ck-w-1/2 ck-bg-gray-900 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none ck-text-xs"
                              />
                              <input
                                type="number"
                                placeholder="Tỉ lệ (VD: 20)"
                                value={newConversion.conversionFactor}
                                onChange={(e) => setNewConversion({ ...newConversion, conversionFactor: e.target.value })}
                                className="ck-w-1/2 ck-bg-gray-900 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none ck-text-xs"
                              />
                            </div>
                            <button
                              className="ck-w-full ck-mt-2 ck-bg-orange-500 hover:ck-bg-blue-600 ck-text-white ck-text-xs ck-font-bold ck-py-2 ck-rounded-lg ck-transition-colors"
                              onClick={async () => {
                                if (!newConversion.unitName || !newConversion.conversionFactor) return alert("Vui lòng nhập đủ thông tin!");
                                try {
                                  const ingId = selectedInventoryItem.ingredientId || selectedInventoryItem.id || selectedInventoryItem.sku;
                                  await api.createUnitConversion({
                                    ingredientId: ingId,
                                    unitName: newConversion.unitName,
                                    conversionFactor: Number(newConversion.conversionFactor)
                                  });
                                  const res = await api.getConversionsByIngredient(ingId);
                                  setConversions(Array.isArray(res) ? res : (res?.data || []));
                                  setShowAddConversion(false);
                                  setNewConversion({ unitName: "", conversionFactor: "" });
                                } catch (e) { alert("❌ Lỗi thêm quy đổi: " + e.message); }
                              }}
                            >
                              Lưu quy đổi
                            </button>
                          </div>
                        )}

                        <div className="ck-space-y-2 ck-max-h-40 ck-overflow-y-auto ck-scrollbar pr-1">
                          {conversions.length > 0 ? conversions.map((conv, idx) => (
                            <div key={idx} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800 ck-p-2 ck-rounded-lg ck-border ck-border-gray-700">
                              <div className="ck-text-xs ck-text-gray-300">
                                <strong className="ck-text-white ck-font-mono">{conv.unitName || conv.unit_name}</strong> = {conv.conversionFactor || conv.conversion_factor} {selectedInventoryItem.unit}
                              </div>
                              
                              <div className="ck-flex ck-gap-1">
                                <button 
                                  onClick={async () => {
                                    const currentFactor = conv.conversionFactor || conv.conversion_factor;
                                    const unit = conv.unitName || conv.unit_name;
                                    const newFactor = window.prompt(`Nhập tỉ lệ quy đổi mới cho ${unit} (Gốc: ${selectedInventoryItem.unit}):`, currentFactor);
                                    
                                    if (newFactor && newFactor !== String(currentFactor) && !isNaN(newFactor)) {
                                      try {
                                        await api.updateUnitConversion(conv.id, Number(newFactor));
                                        setConversions(conversions.map(c => 
                                          c.id === conv.id 
                                            ? { ...c, conversionFactor: Number(newFactor), conversion_factor: Number(newFactor) } 
                                            : c
                                        ));
                                        alert(`✅ Đã cập nhật tỉ lệ ${unit} = ${newFactor} ${selectedInventoryItem.unit}`);
                                      } catch (e) { 
                                        alert("❌ Lỗi cập nhật: " + e.message); 
                                      }
                                    }
                                  }}
                                  className="ck-text-gray-500 hover:ck-text-blue-400 ck-bg-transparent ck-border-none ck-cursor-pointer ck-px-1"
                                  title="Sửa tỉ lệ"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (window.confirm(`Bạn muốn xóa quy đổi ${conv.unitName || conv.unit_name}?`)) {
                                      try {
                                        await api.deleteUnitConversion(conv.id);
                                        setConversions(conversions.filter(c => c.id !== conv.id));
                                      } catch (e) { alert("Lỗi xóa: " + e.message); }
                                    }
                                  }}
                                  className="ck-text-gray-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-cursor-pointer ck-px-1"
                                  title="Xóa quy đổi"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )) : (
                            <p className="ck-text-xs ck-text-gray-500 ck-italic ck-text-center ck-py-2">Chưa có quy đổi nào được thiết lập.</p>
                          )}
                        </div>

                        {conversions.length > 0 && (
                          <div className="ck-mt-4 ck-pt-4 ck-border-t ck-border-gray-700 border-dashed">
                            <p className="ck-text-xs ck-text-gray-400 ck-mb-2">🧪 Test công thức quy đổi</p>
                            <div className="ck-flex ck-gap-2 ck-items-center">
                              <input 
                                type="number" placeholder="SL..." value={testData.qty}
                                onChange={(e) => setTestData({...testData, qty: e.target.value})}
                                className="ck-w-16 ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-md ck-border ck-border-gray-700 ck-outline-none ck-text-xs"
                              />
                              <select 
                                value={testData.unit}
                                onChange={(e) => setTestData({...testData, unit: e.target.value})}
                                className="ck-flex-1 ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-md ck-border ck-border-gray-700 ck-outline-none ck-text-xs"
                              >
                                <option value="" disabled>Chọn ĐV</option>
                                {conversions.map((c, i) => {
                                  const unitLabel = typeof c === 'string' ? c : (c.unitName || c.unit_name || c.name || c.unit || c.unit_type || "Lỗi_Tên");
                                  return (
                                    <option key={i} value={unitLabel}>
                                      {unitLabel}
                                    </option>
                                  );
                                })}
                              </select>
                              <button 
                                onClick={async () => {
                                  if (!testData.qty || !testData.unit) return;
                                  try {
                                    const ingId = selectedInventoryItem.ingredientId || selectedInventoryItem.id || selectedInventoryItem.sku;
                                    const res = await api.calculateConversion(ingId, testData.unit, testData.qty);
                                    setTestResult(res.calculatedQuantity || res.result || res.data || res);
                                  } catch (e) { alert("Lỗi tính toán: " + e.message); }
                                }}
                                className="ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-px-3 ck-py-1.5 ck-rounded-md ck-text-xs ck-font-bold ck-border-none"
                              >
                                Tính
                              </button>
                            </div>
                            {testResult !== null && typeof testResult !== "object" && (
                              <p className="ck-text-xs ck-mt-2 ck-text-green-400 ck-font-bold ck-text-right">
                                = {testResult} {selectedInventoryItem.unit}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL NHẬP KHO */}
              {showImportModal && (
                <div
                  className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-animate-fade-in ck-backdrop-blur-sm"
                  style={{ zIndex: 9999 }}
                  onClick={() => !importSubmitting && setShowImportModal(false)}
                  role="presentation"
                >
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-w-full ck-max-w-2xl shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">Tạo phiếu nhập kho</h3>
                      <button
                        type="button"
                        disabled={importSubmitting}
                        onClick={() => setShowImportModal(false)}
                        className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitImport}>
                      <div className="ck-mb-4">
                        <label className="ck-block ck-text-sm ck-text-gray-400 ck-mb-1">Ghi chú phiếu nhập</label>
                        <textarea
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-green-500 ck-outline-none ck-resize-none"
                          placeholder="VD: Nhập hàng thịt đợt 1..."
                          rows={2}
                          value={importForm.note}
                          onChange={(e) =>
                            setImportForm((prev) => ({ ...prev, note: e.target.value }))
                          }
                        />
                      </div>

                      <div className="ck-mb-4">
                        <label className="ck-block ck-text-sm ck-text-gray-400 ck-mb-2">
                          Danh sách nguyên liệu nhập ({importForm.items.length} dòng)
                        </label>
                        <div className="ck-rounded-xl ck-border ck-border-gray-700 ck-overflow-hidden ck-bg-gray-900/40">
                          <div
                            className="ck-grid ck-gap-2 ck-p-2 ck-items-center ck-text-xs ck-font-medium ck-text-gray-500 ck-border-b ck-border-gray-700"
                            style={{ gridTemplateColumns: "1fr 80px 100px 36px" }}
                          >
                            <span>Nguyên liệu</span>
                            <span>Số lượng</span>
                            <span>Đơn giá (đ)</span>
                            <span />
                          </div>
                          <div className="ck-max-h-64 ck-overflow-y-auto ck-scrollbar">
                            {importForm.items.map((row, index) => (
                              <div
                                key={index}
                                className="ck-grid ck-gap-2 ck-p-2 ck-items-center ck-border-b ck-border-gray-700/50 last:ck-border-b-0 hover:ck-bg-gray-800/40 ck-transition-colors"
                                style={{ gridTemplateColumns: "1fr 80px 100px 36px" }}
                              >
                                <select
                                  className="ck-w-full ck-px-2 ck-py-1.5 ck-bg-gray-800 ck-border ck-border-gray-600 ck-text-white ck-rounded-md ck-text-xs ck-outline-none"
                                  value={row.ingredientId}
                                  onChange={(e) =>
                                    handleImportRowChange(
                                      index,
                                      "ingredientId",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">-- Chọn --</option>
                                  {inventory.map((ing) => (
                                    <option
                                      key={ing.ingredientId ?? ing.id}
                                      value={ing.ingredientId ?? ing.id}
                                    >
                                      {ing.name ?? ing.ingredientName} ({ing.unit ?? "KG"})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="ck-w-full ck-px-2 ck-py-1.5 ck-bg-gray-800 ck-border ck-border-gray-600 ck-text-white ck-rounded-md ck-text-xs ck-outline-none text-right"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleImportRowChange(
                                      index,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  className="ck-w-full ck-px-2 ck-py-1.5 ck-bg-gray-800 ck-border ck-border-gray-600 ck-text-white ck-rounded-md ck-text-xs ck-outline-none text-right"
                                  value={row.importPrice}
                                  onChange={(e) =>
                                    handleImportRowChange(
                                      index,
                                      "importPrice",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  className="ck-flex ck-items-center ck-justify-center ck-text-gray-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-cursor-pointer"
                                  onClick={() => handleRemoveImportRow(index)}
                                  title="Xóa dòng"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="ck-w-full ck-py-2.5 ck-px-3 ck-text-sm ck-text-green-400 hover:ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-gap-2 ck-transition-colors ck-border-t ck-border-gray-700 bg-transparent cursor-pointer font-bold"
                            onClick={handleAddImportRow}
                          >
                            <Plus size={14} />
                            Thêm dòng nguyên liệu
                          </button>
                        </div>
                      </div>

                      <div className="ck-flex ck-gap-3 ck-mt-6">
                        <button
                          type="button"
                          className="ck-flex-1 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-cursor-pointer"
                          onClick={() => !importSubmitting && setShowImportModal(false)}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="ck-flex-1 ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-cursor-pointer"
                          disabled={importSubmitting}
                        >
                          {importSubmitting ? "Đang tạo..." : "Tạo phiếu nhập"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ================== TAB MỚI: KIỂM KÊ KHO ================== */}
          {activeManagementTab === "Kiểm kê kho" && (() => {
            // 1. TÍNH TOÁN XEM CÓ DÒNG NÀO BỊ LỖI > 50% KHÔNG ĐỂ KHÓA NÚT SUBMIT
            const hasValidationError = Object.entries(stocktakeForm).some(([id, data]) => {
              if (data.actualQty === "" || data.actualQty === undefined) return false;
              const item = inventory.find(i => (i.ingredientId || i.id || i.sku) === id);
              if (!item) return false;
              const sysStock = Number(item.stock || 0);
              const actual = Number(data.actualQty);
              
              // Nếu hệ thống đang = 0 mà nhập vào > 0 thì coi như lệch vô cực (100%), tùy bạn có muốn chặn không
              // Ở đây mình xét công thức chuẩn: (Trị tuyệt đối (Thực tế - Hệ thống) / Hệ thống) > 0.5
              if (sysStock === 0) return actual > 0; 
              
              return (Math.abs(actual - sysStock) / sysStock) > 0.5;
            });

            return (
              <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in mgr-section">
                <div className="mgr-hero">
                  <div>
                    <h2 className="mgr-hero__title">Kiểm kê định kỳ</h2>
                    <p className="mgr-hero__sub">
                      Nhập <strong>đếm thực tế</strong> cho từng dòng cần đối soát; để trống nếu bỏ qua. Hệ thống cảnh báo
                      đỏ khi lệch quá <strong>50%</strong> so với tồn sổ — cần sửa trước khi gửi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitStocktake}
                    disabled={isSubmittingStocktake || hasValidationError}
                    className={`mgr-btn ${
                      hasValidationError && !isSubmittingStocktake
                        ? "mgr-btn--ghost"
                        : "mgr-btn--primary"
                    }`}
                  >
                    {isSubmittingStocktake
                      ? "Đang xử lý…"
                      : hasValidationError
                        ? "Sửa dòng lệch > 50%"
                        : "Xác nhận kiểm kê"}
                  </button>
                </div>

                <div className="mgr-table-wrap">
                  <div className="ck-max-h-[600px] ck-overflow-y-auto ck-scrollbar">
                    <table>
                      <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                        <tr>
                          <th>Mã hàng</th>
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
                          
                          // 2. TÍNH TOÁN ĐỘ LỆCH TỪNG DÒNG ĐỂ RENDER UI
                          let diffText = null;
                          let isOverLimit = false;

                          if (actualInput !== undefined && actualInput !== "") {
                            const actual = Number(actualInput);
                            const diff = actual - sysStock;
                            const diffPercent = sysStock > 0 ? (Math.abs(diff) / sysStock) * 100 : (actual > 0 ? 100 : 0);
                            
                            isOverLimit = diffPercent > 50; // Chốt chặn 50%

                            if (isOverLimit) {
                              diffText = <span className="ck-text-red-500 ck-text-xs ck-font-black ck-ml-2 ck-animate-pulse">🛑 Lệch {diffPercent.toFixed(1)}% (Khóa)</span>;
                            } else if (diff < 0) {
                              diffText = <span className="ck-text-orange-400 ck-text-xs ck-ml-2">(Hao hụt {Math.abs(diff)} {item.unit})</span>;
                            } else if (diff > 0) {
                              diffText = <span className="ck-text-green-400 ck-text-xs ck-ml-2">(Dư thừa {diff} {item.unit})</span>;
                            } else {
                              diffText = <span className="ck-text-gray-400 ck-text-xs ck-ml-2">(Khớp số liệu)</span>;
                            }
                          }

                          return (
                            <tr key={idx} className={`ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors ${isOverLimit ? "ck-bg-red-500/5" : ""}`}>
                              <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{ingId}</td>
                              <td className="ck-py-4 ck-px-4 ck-font-bold">{item.ingredientName || item.name}</td>
                              <td className="ck-py-4 ck-px-4 ck-text-center ck-font-mono ck-text-gray-400">
                                {sysStock} <span className="ck-text-xs">{item.unit}</span>
                              </td>
                              <td className="ck-py-3 ck-px-4">
                                <div className="ck-flex ck-items-center">
                                  <input
  type="number"
  min="0"
  step="0.01"
  placeholder="Nhập SL..."
  value={stocktakeForm[ingId]?.actualQty ?? ""}
  onChange={(e) => handleStocktakeChange(ingId, "actualQty", e.target.value)}
  className={`ck-w-32 ck-bg-gray-900 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-outline-none ck-font-bold ck-transition-colors ${
    isOverLimit 
      ? "ck-text-red-400 ck-border-red-500 focus:ck-border-red-400" 
      : "ck-text-white ck-border-gray-600 focus:ck-border-yellow-400"
  }`}
/>
                                  {diffText}
                                </div>
                              </td>
                              <td className="ck-py-3 ck-px-4">
                                <input
                                  type="text"
                                  placeholder="VD: Đổ vỡ..."
                                  value={stocktakeForm[ingId]?.note ?? ""}
                                  onChange={(e) => handleStocktakeChange(ingId, "note", e.target.value)}
                                  className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-600 focus:ck-border-yellow-400 ck-outline-none"
                                />
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
                  <p className="mgr-section-head__sub">
                    Chọn một món trong danh sách để xem và chỉnh nguyên liệu / định lượng. Lưu công thức sẽ đồng bộ xuống
                    bếp cho phần sản xuất và kế hoạch cấp hàng.
                  </p>
                </div>
              </div>
              <div className="mgr-search-row">
                <div className="mgr-search-bar mgr-search-bar--orange">
                  <input
                    type="text"
                    placeholder="Tìm theo mã SKU hoặc tên món…"
                    defaultValue={recipeSearchText}
                    onChange={(e) => setRecipeSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setRecipeAppliedSearch(recipeSearchText);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setRecipeAppliedSearch(recipeSearchText)}
                  >
                    Tìm
                  </button>
                </div>
              </div>
              <div className="mgr-split">
                <div
                  className="mgr-split__main mgr-table-wrap ck-transition-all ck-duration-300"
                  style={{
                    flexBasis: selectedRecipe ? "56%" : "100%",
                    maxWidth: selectedRecipe ? "56%" : "100%",
                    maxHeight: 600,
                    overflowY: "auto",
                  }}
                >
                  <table>
                    <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>
                        <th>Mã món</th>
                        <th>Sản phẩm</th>
                        <th style={{ textAlign: "center" }}>Đơn vị bán</th>
                        <th style={{ textAlign: "center" }}>Công thức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterProducts.length > 0 ? (
                        masterProducts
                          .filter((prod) => {
                            let matchText = true;
                            if (recipeAppliedSearch)
                              matchText =
                                (prod.product_id || prod.productId || "").toLowerCase().includes(recipeAppliedSearch.toLowerCase()) ||
                                (prod.product_name || prod.name || "").toLowerCase().includes(recipeAppliedSearch.toLowerCase());
                            return matchText;
                          })
                          .map((prod, idx) => {
                            const pId = prod.product_id || prod.productId || prod.id;
                            const isSelected = selectedRecipe?.productId === pId || selectedRecipe?.product_id === pId;

                            return (
                              <tr
                                key={idx}
                                onClick={async () => {
                                  setSelectedRecipe(prod);
                                  setEditingRecipeIngredients([]); 

                                  try {
                                    const res = await api.getRecipeOfProduct(pId);
                                    if (res && res.ingredients) {
                                      const mappedIngredients = res.ingredients.map(ing => {
                                        const ingId = ing.ingredientId || ing.id;
                                        const foundInKho = inventory.find(i => (i.ingredientId || i.id || i.sku) === ingId);
                                        
                                        return {
                                          ingredientId: ingId,
                                          name: ing.name || ing.ingredientName || (foundInKho ? (foundInKho.ingredientName || foundInKho.name) : "Nguyên liệu ẩn"),
                                          amountNeeded: Number(ing.qty || ing.amountNeeded || 0),
                                          unit: ing.unit || (foundInKho ? foundInKho.unit : "N/A")
                                        };
                                      });
                                      setEditingRecipeIngredients(mappedIngredients);
                                    }
                                  } catch (error) {
                                    setEditingRecipeIngredients([]);
                                  }
                                }}
                                className={`ck-cursor-pointer ${isSelected ? "mgr-tr--active-orange" : ""}`}
                              >
                                <td className="mgr-mono-muted">{pId}</td>
                                <td className="mgr-cell-strong">
                                  <span style={{ marginRight: 6 }}>{prod.emoji || "🍴"}</span>
                                  {prod.product_name || prod.name}
                                </td>
                                <td className="mgr-mono-muted" style={{ textAlign: "center" }}>
                                  {prod.baseUnit || prod.base_unit || "PHẦN"}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <span className="mgr-pill mgr-pill--warn" style={{ cursor: "inherit" }}>
                                    Mở BOM →
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ padding: 0, border: "none" }}>
                            <div className="mgr-empty" style={{ margin: 16 }}>
                              <div className="mgr-empty__icon">📝</div>
                              <p className="mgr-empty__title">Không có sản phẩm</p>
                              <p className="mgr-empty__sub">Thử tìm kiếm với từ khóa khác.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedRecipe && (
                  <div
                    className="mgr-aside ck-flex ck-flex-col ck-animate-fade-in"
                    style={{ flex: "0 0 40%", minWidth: 280, maxHeight: 600 }}
                  >
                    <div className="mgr-aside__head" style={{ borderBottom: "1px solid var(--border, #4b5563)" }}>
                      <div>
                        <h3 className="mgr-aside__title">Định mức nguyên liệu</h3>
                        <p className="mgr-panel__hint" style={{ marginTop: 6, color: "#fb923c" }}>
                          {selectedRecipe.emoji || "🍴"} {selectedRecipe.product_name || selectedRecipe.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipe(null)}
                        className="mgr-icon-btn"
                        aria-label="Đóng"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                      {editingRecipeIngredients.length === 0 ? (
                        <div className="mgr-empty" style={{ padding: "2rem 1rem" }}>
                          <div className="mgr-empty__icon">🫙</div>
                          <p className="mgr-empty__title">Chưa có dòng BOM</p>
                          <p className="mgr-empty__sub">
                            Thêm nguyên liệu từ kho bằng ô chọn phía dưới, rồi nhập định lượng cho từng dòng.
                          </p>
                        </div>
                      ) : (
                        <div className="ck-space-y-3">
                          {editingRecipeIngredients.map((ing, i) => (
                            <div
                              key={ing.ingredientId || i}
                              className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between ck-group"
                            >
                              <div className="ck-flex-1">
                                <p className="ck-text-white ck-font-semibold">
                                  {ing.name}
                                </p>
                                <p className="ck-text-xs ck-font-mono ck-text-gray-400">
                                  {ing.ingredientId}
                                </p>
                              </div>
                              <div className="ck-flex ck-items-center ck-gap-2 ck-w-1/3">
                                <input
                                  type="number"
                                  value={ing.amountNeeded}
                                  step="0.01"
                                  min="0"
                                  onChange={(e) => {
                                    const newIngredients = [...editingRecipeIngredients];
                                    newIngredients[i].amountNeeded = Number(e.target.value);
                                    setEditingRecipeIngredients(newIngredients);
                                  }}
                                  className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-lg ck-border ck-border-gray-600 focus:ck-border-orange-400 ck-outline-none ck-text-right ck-font-mono"
                                />
                                <span className="ck-text-sm ck-text-gray-400 ck-w-8">
                                  {ing.unit}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  const newIngredients = editingRecipeIngredients.filter((_, index) => index !== i);
                                  setEditingRecipeIngredients(newIngredients);
                                }}
                                className="ck-ml-2 ck-text-gray-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-opacity-0 group-hover:ck-opacity-100 ck-transition-opacity ck-cursor-pointer"
                                title="Bỏ nguyên liệu này"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="ck-mt-4 ck-pt-4 ck-border-t ck-border-gray-700 ck-border-dashed">
                        <select 
                          className="ck-w-full ck-bg-gray-800 ck-text-gray-300 ck-px-3 ck-py-2 ck-rounded-xl ck-border ck-border-gray-600 ck-outline-none ck-cursor-pointer ck-mb-2"
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if(!selectedId) return;
                            
                            const foundItem = inventory.find(item => (item.ingredientId || item.id || item.sku) === selectedId);
                            if(foundItem) {
                              if(editingRecipeIngredients.some(ing => ing.ingredientId === selectedId)) {
                                alert("Nguyên liệu này đã có trong công thức!");
                                e.target.value = ""; 
                                return;
                              }

                              setEditingRecipeIngredients([
                                ...editingRecipeIngredients, 
                                {
                                  ingredientId: selectedId,
                                  name: foundItem.ingredientName || foundItem.name,
                                  amountNeeded: 1,
                                  unit: foundItem.unit || "N/A"
                                }
                              ]);
                              e.target.value = ""; 
                            }
                          }}
                        >
                          <option value="">+ Chọn thêm nguyên liệu từ Kho...</option>
                          {inventory.map(item => (
                            <option key={item.ingredientId || item.id} value={item.ingredientId || item.id}>
                              {item.ingredientName || item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                    
                    <div className="ck-p-5 ck-border-t ck-border-gray-700 ck-bg-gray-800/50">
                       <button 
                          type="button"
                          onClick={async () => {
                            if(editingRecipeIngredients.length === 0) return alert("Vui lòng thêm ít nhất 1 nguyên liệu!");
                            
                            const pId = selectedRecipe.product_id || selectedRecipe.productId || selectedRecipe.id;

                            const payload = {
                              productId: pId,
                              ingredients: editingRecipeIngredients.map(ing => ({
                                ingredientId: ing.ingredientId,
                                amountNeeded: Number(ing.amountNeeded)
                              }))
                            };

                            try {
                              await api.saveRecipe(payload);
                              alert("✅ Đã lưu/cập nhật công thức thành công!");
                            } catch(e) {
                              alert("❌ Lỗi lưu công thức: " + e.message);
                            }
                          }}
                          className="mgr-btn mgr-btn--amber ck-w-full"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          💾 Lưu công thức
                        </button>
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
                        Chọn chi nhánh để xem lịch sử đơn và tạo đơn <strong>đặt hộ</strong> khi cửa hàng cần hỗ trợ. Trạng
                        thái hiển thị theo dữ liệu cửa hàng trên hệ thống.
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
                        onClick={() => {
                          setSelectedStore(null);
                          setIsOrderingForStore(false);
                          setIsUrgentOrder(false); 
                        }}
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
                    {!isOrderingForStore && (
                      <button
                        type="button"
                        onClick={() => setIsOrderingForStore(true)}
                        className="mgr-btn mgr-btn--primary"
                      >
                        <Plus size={18} /> Đặt hộ cửa hàng
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
                            <input
                              type="text" placeholder="Tìm tên món ăn..."
                              className="ck-input ck-pl-12 ck-w-64"
                              onChange={(e) => setSearchTermHộ(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="ck-grid ck-grid-cols-2 ck-gap-4 ck-max-h-[500px] ck-overflow-y-auto ck-scrollbar ck-pr-2">
                          {masterProducts
                            .filter((p) => (p.product_name || p.name || "").toLowerCase().includes(searchTermHộ.toLowerCase()))
                            .map((p) => {
                               const skuToUse = p.product_id || p.sku;
                               const priceToUse = p.selling_price || p.price || 0;
                               return (
                              <div key={skuToUse} className="ck-bg-gray-800 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center hover:ck-bg-gray-700 ck-transition-colors ck-border ck-border-transparent hover:ck-border-red-500/50">
                                <div className="ck-flex ck-gap-4">
                                  <span className="ck-text-4xl">{p.emoji}</span>
                                  <div>
                                    <p className="ck-font-bold ck-text-white text-sm">{p.product_name || p.name}</p>
                                    <p className="ck-text-xs ck-text-blue-400 ck-mono mt-1">{Number(priceToUse).toLocaleString()}đ</p>
                                  </div>
                                </div>
                                <button onClick={() => addToCart(p)} className="ck-w-10 ck-h-10 ck-bg-red-500 ck-rounded-xl border-none ck-text-white ck-font-black ck-cursor-pointer hover:ck-scale-110 ck-transition-transform">
                                  +
                                </button>
                              </div>
                            )})}
                        </div>
                      </div>

                      <div className="ck-bg-gray-900 ck-p-8 ck-rounded-3xl ck-border ck-border-red-500/20 shadow-2xl ck-flex ck-flex-col">
                        <h3 className="ck-text-xl ck-font-black ck-mb-6 ck-flex ck-items-center ck-gap-3">
                          <ShoppingCart className="ck-text-red-500" size={24} /> Giỏ hàng hộ
                        </h3>
                        <div className="ck-flex-1 ck-space-y-4 ck-mb-6 ck-max-h-64 ck-overflow-y-auto ck-scrollbar">
                          {cart.length === 0 ? (
                            <div className="ck-text-center ck-py-10 ck-text-gray-600">
                              <p className="ck-text-4xl ck-mb-2">📦</p>
                              <p className="ck-text-xs uppercase font-bold">Chưa chọn món nào</p>
                            </div>
                          ) : (
                            cart.map((item) => {
                               const itemPrice = item.selling_price || item.price || 0;
                               return (
                              <div key={item.product_id || item.sku || item.id} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800 ck-p-3 ck-rounded-xl">
                                <div className="ck-flex-1">
                                  <p className="ck-text-white ck-font-bold text-xs">{item.product_name || item.name}</p>
                                  <p className="ck-text-[10px] ck-text-gray-500">{item.quantity} x {Number(itemPrice).toLocaleString()}đ</p>
                                </div>
                                <span className="ck-text-red-400 ck-font-black ck-mono">{(itemPrice * item.quantity).toLocaleString()}đ</span>
                              </div>
                            )})
                          )}
                        </div>
                        <div className="ck-border-t ck-border-gray-800 ck-pt-6 ck-space-y-4">
                          <div>
                            <label className="ck-text-[10px] ck-text-gray-500 ck-font-bold uppercase mb-2 block">Ngày giao hàng dự kiến</label>
                            <input type="date" className="ck-input ck-w-full" onChange={(e) => setDeliveryDate(e.target.value)} />
                          </div>
                          
                          <div 
                            className={`ck-flex ck-justify-between ck-items-center ck-p-3 ck-rounded-xl ck-border ck-cursor-pointer ck-transition-colors ${isUrgentOrder ? "ck-bg-red-500/10 ck-border-red-500/50" : "ck-bg-gray-800 ck-border-gray-700"}`}
                            onClick={() => setIsUrgentOrder(!isUrgentOrder)}
                          >
                            <span className={`ck-text-sm ck-font-bold ${isUrgentOrder ? "ck-text-red-400" : "ck-text-gray-400"}`}>
                              🚨 Giao hàng Khẩn cấp
                            </span>
                            <div className={`ck-w-12 ck-h-6 ck-flex ck-items-center ck-rounded-full ck-p-1 ck-transition-colors ${isUrgentOrder ? 'ck-bg-red-500' : 'ck-bg-gray-600'}`}>
                               <div className={`ck-bg-white ck-w-4 ck-h-4 ck-rounded-full ck-shadow-md ck-transform ck-transition-transform ${isUrgentOrder ? 'ck-translate-x-6' : 'ck-translate-x-0'}`}></div>
                            </div>
                          </div>

                          <textarea placeholder="Ghi chú quan trọng cho Bếp..." className="ck-input ck-w-full ck-h-20" onChange={(e) => setOrderNote(e.target.value)} value={orderNote} />
                          <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                            <span className="ck-text-gray-400 ck-font-bold">TỔNG CỘNG:</span>
                            <span className="ck-text-2xl ck-font-black ck-text-orange-400">
                              {cart.reduce((s, i) => s + (i.selling_price || i.price || 0) * i.quantity, 0).toLocaleString()}đ
                            </span>
                          </div>
                         <button
                            onClick={handleCreateOrderHộ}
                            className="ck-w-full ck-py-4 ck-text-white ck-rounded-2xl ck-font-black ck-text-lg border-none ck-cursor-pointer ck-transition-all hover:ck-scale-[1.02] active:ck-scale-95"
                            style={{
                              backgroundColor: isUrgentOrder ? "#ef4444" : "#f97316",
                              boxShadow: isUrgentOrder 
                                ? "0 10px 25px -5px rgba(239, 68, 68, 0.5)" 
                                : "0 10px 25px -5px rgba(249, 115, 22, 0.5)" 
                            }}
                          >
                            {isUrgentOrder ? "🚨 GỬI ĐƠN KHẨN CẤP" : "GỬI ĐƠN ĐẶT HỘ"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-overflow-hidden shadow-2xl">
                      <div className="ck-p-6 ck-bg-gray-800/50 ck-border-b ck-border-gray-700 ck-flex ck-justify-between items-center">
                        <h3 className="ck-font-black ck-text-gray-300 ck-uppercase tracking-widest text-sm">Lịch sử giao dịch chi nhánh</h3>
                        {/* ĐÃ XÓA NÚT XUẤT BÁO CÁO STORE Ở ĐÂY */}
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
                                  ? new Date(order.createdAt).toLocaleString('vi-VN', {
                                      day: '2-digit', month: '2-digit', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })
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
                          )})}
                          {(Array.isArray(allOrders) ? allOrders : []).length === 0 && (
                            <tr><td colSpan="6" className="ck-p-10 ck-text-center ck-text-gray-500 italic">Cửa hàng này chưa có dữ liệu giao dịch.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {showOrderDetailsModal && selectedOrderDetails && (
                     <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-[100] ck-animate-fade-in ck-backdrop-blur-sm">
                       <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-8 ck-rounded-3xl ck-w-[600px] ck-max-h-[85vh] ck-overflow-y-auto ck-scrollbar shadow-2xl">
                         <div className="ck-flex ck-justify-between ck-items-start ck-mb-6 ck-border-b ck-border-gray-800 ck-pb-4">
                           <div>
                             <h3 className="ck-text-2xl ck-font-black ck-text-white ck-mb-1">Chi tiết đơn hàng</h3>
                             <p className="ck-text-blue-400 ck-font-mono ck-text-sm">#{selectedOrderDetails.id || selectedOrderDetails.orderId}</p>
                           </div>
                           <button onClick={() => setShowOrderDetailsModal(false)} className="ck-text-gray-500 hover:ck-text-red-400 ck-bg-gray-800 ck-w-8 ck-h-8 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-border-none ck-cursor-pointer ck-transition-colors">✕</button>
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

                </div>
              )}
            </div>
          )}

          {/* ================== 9. TAB CÀI ĐẶT HỆ THỐNG ================== */}
          {activeManagementTab === "Cài đặt hệ thống" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in mgr-section">
              <div className="mgr-settings-hero">
                <h3>⚙️ Cấu hình vận hành trung tâm</h3>
                <p>
                  Tham số toàn hệ thống (bếp, cửa hàng, quy tắc nghiệp vụ). Mỗi khóa có nhãn mô tả; sau khi <strong>Lưu</strong>,
                  giá trị áp dụng ngay — nên ghi chú rõ trong quy trình nội bộ.
                </p>
              </div>

                <div className="ck-grid ck-grid-cols-1 md:ck-grid-cols-2 ck-gap-6">
                  {Object.keys(systemConfigs).length > 0 ? (
                    Object.entries(systemConfigs).map(([key, val]) => (
                      <div key={key} className="mgr-config-card">
                        <span className="mgr-config-card__tag">Tham số hệ thống</span>
                        <div className="mgr-config-card__key">{key}</div>
                        <h4 className="mgr-config-card__title">
                          {key.replace(/_/g, " ")}
                        </h4>

                        <div className="ck-flex ck-gap-3 ck-items-stretch ck-flex-wrap">
                          <input
                            type="text"
                            defaultValue={val}
                            id={`input-cfg-${key}`}
                            placeholder="Nhập giá trị mới…"
                            className="ck-flex-1 ck-min-w-[160px] ck-bg-gray-900 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-blue-500 ck-outline-none ck-font-semibold"
                            style={{ minHeight: 48 }}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const inputDom = document.getElementById(`input-cfg-${key}`);
                              const newValue = inputDom.value;
                              
                              if (!newValue.trim()) return alert("Vui lòng không để trống!");
                              
                              try {
                                const cleanKey = key.trim();
                                await api.updateSystemConfig(cleanKey, {
                                  configValue: String(newValue.trim()),
                                  description: "Cập nhật từ Manager" 
                                });
                                
                                alert("✅ Đã cập nhật thành công: " + cleanKey);
                                loadData(); 
                              } catch (error) {
                                alert("❌ Lỗi: " + error.message);
                              }
                            }}
                            className="mgr-btn mgr-btn--amber"
                          >
                            Lưu
                          </button>
                        </div>
                        <p className="mgr-panel__hint" style={{ marginTop: 12, fontStyle: "italic" }}>
                          Áp dụng toàn hệ thống ngay sau khi API xác nhận thành công.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="mgr-empty" style={{ gridColumn: "1 / -1" }}>
                      <div className="mgr-empty__icon">📋</div>
                      <p className="mgr-empty__title">Chưa có cấu hình</p>
                      <p className="mgr-empty__sub">Backend chưa trả tham số hoặc tài khoản chưa có quyền xem.</p>
                    </div>
                  )}
                </div>
            </div>
          )}

          </div>
        </div>
      </main>

      {/* MODAL TẠO BÁO CÁO Ở ĐÂY ĐỂ ĐẢM BẢO KHÔNG BỊ COMPONENT NÀO ĐÈ LÊN */}
      {showCreateReport && (
        <div 
          className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-animate-fade-in ck-backdrop-blur-sm" 
          style={{ zIndex: 9999 }}
        >
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-p-8 ck-w-[450px] shadow-2xl">
            <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
              <h3 className="ck-text-xl ck-font-black ck-text-white">
                Tạo Báo Cáo Tùy Chỉnh
              </h3>
              <button
                onClick={() => setShowCreateReport(false)}
                className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
              >
                ✕
              </button>
            </div>
            <div className="ck-space-y-5 ck-text-sm">
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-2">
                  Tên báo cáo *
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                  placeholder="VD: Báo cáo tháng 3..."
                />
              </div>
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-2">
                  Định dạng file
                </label>
                <select
                  value={newReport.type}
                  onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                  className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none"
                >
                  <option>EXCEL</option>
                </select>
              </div>
              <div className="ck-grid ck-grid-cols-2 ck-gap-4">
                <div>
                  <label className="ck-block ck-text-gray-400 ck-mb-2">Từ ngày</label>
                  <input
                    type="date"
                    value={newReport.fromDate}
                    onChange={(e) => setNewReport({ ...newReport, fromDate: e.target.value })}
                    className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-gray-400 ck-mb-2">Đến ngày</label>
                  <input
                    type="date"
                    value={newReport.toDate}
                    onChange={(e) => setNewReport({ ...newReport, toDate: e.target.value })}
                    className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="ck-mt-8 ck-flex ck-gap-3">
              <button
                onClick={handleCreateReport}
                className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-black ck-border-none ck-transition-colors ck-cursor-pointer hover:ck-scale-105"
              >
                Tạo & Xuất file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPage;