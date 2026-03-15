import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Search,
  Plus,
  Store,
  ShoppingCart,
} from "../../components/icons/Icons";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";

const ManagerPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activeManagementTab, setActiveManagementTab] = useState("Bảng KPI");
  const [, setIsLoading] = useState(false);

  const [masterProducts, setMasterProducts] = useState([]);
  const [, setCategoriesList] = useState([]);
  const [reports, setReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
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

  // --- BỔ SUNG STATE CHO ĐƠN HÀNG HỘ ---
  const [isUrgentOrder, setIsUrgentOrder] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
// --- STATE CHO QUY ĐỔI ĐƠN VỊ ---
  const [conversions, setConversions] = useState([]);
  const [showAddConversion, setShowAddConversion] = useState(false);
  const [newConversion, setNewConversion] = useState({ unitName: "", conversionFactor: "" });
  const [testData, setTestData] = useState({ unit: "", qty: "" });
  const [testResult, setTestResult] = useState(null);
const [dashboardData, setDashboardData] = useState(null);
 const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // ĐÃ SỬA LỖI: Thêm chữ dashFull vào cuối mảng này
      const [prods, reps, exps, invs, kpis, sts, cfgs, dashFull] =
        await Promise.all([
          api.getMasterProducts().catch(() => []),    // 1
          api.getReports().catch(() => []),           // 2
          api.getExpenses().catch(() => []),          // 3
          api.getManagerInventory().catch(() => []),  // 4
          api.getKPIStats().catch(() => []),          // 5
          api.getStoresAll?.().catch(() => []),       // 6
          api.getSystemConfigs?.().catch(() => ({})), // 7
          api.getManagerAnalytics().catch(() => null),// 8
        ]);

      setMasterProducts(prods);
      setCategoriesList([]);
      setReports(reps);
      setExpenses(exps);
      setInventory(invs);
      setKpiStats(kpis);
      setStores(sts);
      setSystemConfigs(cfgs || {});
      // Lưu data vào state
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
  // LOGIC TÍNH TOÁN "MỀM" CHO CHI PHÍ
  // ==========================================
  const totalExpenseVal = expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  const ingredientExpenseVal = expenses
    .filter((e) => e.category === "Nhập nguyên liệu")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const operationExpenseVal = totalExpenseVal - ingredientExpenseVal;

  const costStructure = expenses.reduce((acc, cur) => {
    const category = cur.category || "Khác";
    acc[category] = (acc[category] || 0) + (Number(cur.amount) || 0);
    return acc;
  }, {});

  const costStructureArray = Object.entries(costStructure).map(
    ([name, value]) => ({ name, value }),
  );

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

 // --- HÀM TẠO ĐƠN CHUẨN CHỈ MỚI ---
  const handleCreateOrderHộ = async () => {
    if (!cart.length || !deliveryDate) return alert("Vui lòng chọn món và ngày giao!");
    const orderBody = {
      storeId: selectedStore.id || selectedStore.storeId,
      deliveryDate: deliveryDate, // <--- THÊM DÒNG NÀY VÀO NÈ!
      note: `[MANAGER ĐẶT HỘ${isUrgentOrder ? " - KHẨN CẤP" : ""}] ${orderNote}`,
      items: cart.map((i) => ({
        productId: i.product_id || i.productId || i.id || i.sku,
        quantity: Number(i.quantity),
      })),
    };
    try {
      // Dựa vào nút gạt để gọi đúng API Standard hoặc Urgent
      if (isUrgentOrder) {
        await api.addOrderUrgent(orderBody);
      } else {
        await api.placeOrderForStore(orderBody);
      }
      
      alert(`✅ Đã tạo đơn đặt hàng hộ ${isUrgentOrder ? "(Khẩn cấp)" : "(Tiêu chuẩn)"} thành công!`);
      
      // Reset form và lấy lại lịch sử mới nhất
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
      costPrice: Number(newMasterProduct.cogs || 0), 
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
        // Dùng API Update Status để "xóa mềm"
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
    type: "PDF",
    fromDate: "",
    toDate: "",
  });

  const handleCreateReport = async () => {
    // 1. Kiểm tra xem người dùng đã chọn ngày chưa
    if (!newReport.fromDate || !newReport.toDate) {
      return alert("Vui lòng chọn Từ ngày và Đến ngày để xuất báo cáo!");
    }

    try {
      // 2. Gọi hàm xuất file linh động từ file api.js
      api.exportAnalyticsCSV(newReport.fromDate, newReport.toDate);
      
      // 3. Đóng form lại sau khi tải
      setShowCreateReport(false);
      
      // Optional: Load lại danh sách báo cáo nếu backend có lưu lịch sử xuất file
      loadData(); 
    } catch (error) {
      alert("Lỗi tạo báo cáo: " + error.message);
    }
  };

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Nhập nguyên liệu",
    supplier: "",
    ref: "",
    amount: "",
    method: "Chuyển khoản",
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseSearchText, setExpenseSearchText] = useState("");
  const [expenseAppliedSearch, setExpenseAppliedSearch] = useState("");
  const [filterExpenseCategory, setFilterExpenseCategory] =
    useState("Hạng mục chi");
  const [filterExpenseDate, setFilterExpenseDate] = useState("");

  const handleSaveExpense = async () => {
    if (!newExpense.supplier || !newExpense.amount)
      return alert("Vui lòng nhập Nhà cung cấp và Số tiền!");
    try {
      await api.createExpense(newExpense);
      setShowAddExpense(false);
      loadData();
    } catch (error) {
      alert("Lỗi lưu phiếu chi!");
    }
  };

  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [inventoryAppliedSearch, setInventoryAppliedSearch] = useState("");
  const [filterInventoryLocation, setFilterInventoryLocation] =
    useState("Tất cả Kho");
  const [filterInventoryCategory, setFilterInventoryCategory] =
    useState("Tất cả danh mục");
  const [filterInventoryStatus] = useState("Cảnh báo tồn kho");

  const filteredInventory = inventory.filter((item) => {
    const name = item.ingredientName || item.name || "";
    const id = item.ingredientId || item.id || "";
    
    let matchText = true;
    if (inventoryAppliedSearch)
      matchText =
        id.toLowerCase().includes(inventoryAppliedSearch.toLowerCase()) ||
        name.toLowerCase().includes(inventoryAppliedSearch.toLowerCase());
        
    let matchLocation =
      filterInventoryLocation === "Tất cả Kho" ||
      item.location === filterInventoryLocation;
      
    let matchCat =
      filterInventoryCategory === "Tất cả danh mục" ||
      item.category === filterInventoryCategory;
      
    const isLowStock = item.stock <= (item.min || 10);
    let matchStat = true;
    if (filterInventoryStatus === "Sắp hết hàng") matchStat = isLowStock && item.stock > 0;
    if (filterInventoryStatus === "Đã hết hàng") matchStat = item.stock <= 0;
    
    return matchText && matchLocation && matchCat && matchStat;
  });

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");
  const [editingRecipeIngredients, setEditingRecipeIngredients] = useState([]);

  // Tự động fetch danh sách quy đổi khi chọn nguyên liệu
  useEffect(() => {
    if (selectedInventoryItem) {
      const ingId = selectedInventoryItem.ingredientId || selectedInventoryItem.id || selectedInventoryItem.sku;
      api.getConversionsByIngredient(ingId)
        .then(res => setConversions(Array.isArray(res) ? res : (res?.data || [])))
        .catch(() => setConversions([]));
    } else {
      setConversions([]);
    }
    // Reset lại form test khi đổi món
    setTestResult(null);
    setTestData({ unit: "", qty: "" });
    setShowAddConversion(false);
  }, [selectedInventoryItem]);

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER QUẢN LÝ */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-pb-4 ck-border-b ck-border-gray-800" style={{ zIndex: 50 }}>
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <LayoutDashboard className="ck-text-white" size={28} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight ck-mb-1">
              Phân hệ Quản Lý
            </h1>
            <p className="ck-text-xs ck-text-gray-400 ck-font-medium ck-tracking-wider ck-uppercase">
              Vận hành & Kế toán Bếp
            </p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
            <p className="ck-text-sm ck-font-bold ck-text-white">
              {userData?.name || "Quản Lý Cấp Cao"}
            </p>
            <p className="ck-text-xs ck-text-red-400">Ban Giám Đốc</p>
          </div>
          <HeaderSettingsMenu
            userData={userData}
            showProfile={true}
            onOpenProfile={() => setShowUpdateProfileModal(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onLogout={onLogout ?? (() => { api.logout(); window.location.reload(); })}
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

      {/* MAIN CONTENT */}
      <div
        className="ck-flex ck-gap-6 ck-w-full ck-relative ck-z-10 ck-animate-fade-in"
        style={{ minHeight: "800px" }}
      >
        {/* LEFT SIDEBAR */}
        <div
          className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col"
          style={{ width: "20%", flexShrink: 0 }}
        >
          <ul
            className="ck-space-y-2 ck-flex-1 ck-mt-2"
            style={{ listStyleType: "none", padding: 0, margin: 0 }}
          >
            {[
              "Bảng KPI",
              "Quản lý sản phẩm",
              "Tổng quan tồn kho",
              "Phân tích chi phí",
              "Báo cáo",
              "Quản lý công thức",
              "Chi phí nhập hàng",
              "Cửa hàng Franchise",
              "Cài đặt hệ thống"
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveManagementTab(item);
                    setEditingMasterProduct(null);
                    setShowAddMasterProduct(false);
                    setShowCreateReport(false);
                    setShowAddExpense(false);
                  }}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${
                    activeManagementTab === item
                      ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg"
                      : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
                  }`}
                  style={
                    activeManagementTab !== item
                      ? { border: "none", background: "transparent" }
                      : { border: "none" }
                  }
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex ck-flex-col ck-gap-6" style={{ width: "80%" }}>
          {/* ================== 1. TAB BẢNG KPI ================== */}
          {activeManagementTab === "Bảng KPI" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
              
              {/* 3 THẺ SUMMARY Ở TRÊN (GIỮ NGUYÊN UI) */}
              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                {kpiStats.length > 0 ? (
                  kpiStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl ck-flex ck-flex-col ck-justify-center hover:ck-border-red-500/50 ck-transition-colors shadow-lg"
                    >
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-3">
                        {stat.label}
                      </h4>
                      <p className={`ck-text-4xl ck-font-black ck-text-white ck-mb-3`}>
                        {stat.value}
                      </p>
                      <div className="ck-flex ck-items-center ck-gap-2">
                        <span 
                          className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ${
                            stat.isUp 
                              ? 'ck-bg-green-500/20 ck-text-green-400' 
                              : 'ck-bg-red-500/20 ck-text-red-400'
                          }`}
                        >
                          {stat.isUp ? "↗ Tăng" : "↘ Giảm"} {stat.change}
                        </span>
                        <span className="ck-text-xs ck-text-gray-500">so với kỳ trước</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ck-col-span-3 ck-text-center ck-py-10 ck-text-gray-500">
                    Đang tải dữ liệu KPI...
                  </div>
                )}
              </div>
              
              {/* KHU VỰC BIỂU ĐỒ VÀ TOP SẢN PHẨM (MỚI FIX CSS) */}
              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                
                {/* BIỂU ĐỒ (Cột Trái - Chiếm 2/3) */}
                <div
                  className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col"
                  style={{ minHeight: "350px" }}
                >
                  <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                    <h3 className="ck-text-xl ck-font-bold ck-text-white">
                      Biểu đồ Giá trị xuất kho
                    </h3>
                    <span className="ck-text-xs ck-text-gray-500 ck-font-mono">Xu hướng các ngày gần đây</span>
                  </div>
                  
                  {/* Khu vực chứa cột */}
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-end ck-justify-between ck-p-4 ck-gap-2 ck-h-[250px]">
                    {dashboardData?.exportTrend?.length > 0 ? (
                      dashboardData.exportTrend.map((day, i) => {
                        const maxVal = Math.max(...dashboardData.exportTrend.map(d => d.exportValue || 0)) || 1;
                        const heightPercent = day.exportValue ? Math.max(((day.exportValue) / maxVal) * 100, 5) : 0;
                        
                        return (
                          <div key={i} className="ck-flex ck-flex-col ck-items-center ck-flex-1 ck-h-full ck-justify-end ck-relative ck-group">
                            
                            {/* Tooltip hiện khi hover */}
                            <div className="ck-opacity-0 group-hover:ck-opacity-100 ck-transition-opacity ck-bg-gray-800 ck-text-white ck-text-xs ck-p-2 ck-rounded-lg ck-mb-2 ck-absolute ck--top-12 ck-whitespace-nowrap ck-z-10 ck-border ck-border-gray-700 ck-pointer-events-none ck-text-center shadow-lg">
                              <span className="ck-font-bold ck-text-blue-400">{Number(day.exportValue || 0).toLocaleString()}đ</span>
                              <br/>
                              <span className="ck-text-gray-400">{day.totalOrders || 0} đơn</span>
                            </div>
                            
                            {/* KHU VỰC CỘT MỌC LÊN */}
                            <div className="ck-w-full ck-flex-1 ck-flex ck-flex-col ck-justify-end ck-items-center">
                              {/* Số tiền (chỉ hiện khi > 0) */}
                              <span className="ck-text-[10px] ck-text-blue-400 ck-font-bold ck-mb-1 ck-text-center">
                                {day.exportValue > 0 ? `${(day.exportValue / 1000).toLocaleString()}k` : ""}
                              </span>
                              
                              {/* Thanh cột (Ép màu cứng bằng background linear-gradient) */}
                              <div 
                                className="ck-w-full ck-max-w-[40px] ck-rounded-t-md ck-cursor-pointer hover:ck-opacity-80 ck-transition-all"
                                style={{ 
                                  height: `${heightPercent}%`, 
                                  minHeight: day.exportValue > 0 ? '10px' : '0px',
                                  background: day.exportValue > 0 ? 'linear-gradient(to top, #2563eb, #60a5fa)' : 'transparent'
                                }}
                                title={`Ngày: ${day.timeLabel}\nDoanh thu: ${Number(day.exportValue || 0).toLocaleString()}đ`}
                              ></div>
                            </div>
                            
                            {/* KHU VỰC NGÀY THÁNG (Ép độ cao cố định để không bị trồi sụt) */}
                            <div className="ck-h-8 ck-w-full ck-flex ck-items-center ck-justify-center ck-border-t ck-border-gray-700 ck-mt-2">
                              <span className="ck-text-[10px] ck-text-gray-500 ck-font-mono">
                                {day.timeLabel ? day.timeLabel.split('-').slice(1).join('/') : ''}
                              </span>
                            </div>

                          </div>
                        )
                      })
                    ) : (
                      <span className="ck-text-gray-500 ck-m-auto">Chưa có dữ liệu biểu đồ...</span>
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI - CHIA 2 TẦNG (Top Xuất & Top Hao Hụt) */}
                <div className="ck-col-span-1 ck-flex ck-flex-col ck-gap-6">
                  
                  {/* TẦNG 1: TOP XUẤT KHO */}
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex-1 ck-flex ck-flex-col">
                    <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4 ck-flex ck-items-center ck-gap-2">
                      Top Sản Phẩm Xuất Kho
                    </h3>
                    <div className="ck-flex-1 ck-space-y-3 ck-overflow-y-auto ck-scrollbar ck-pr-2" style={{ maxHeight: "180px" }}>
                      {dashboardData?.topExportedProducts?.length > 0 ? (
                        dashboardData.topExportedProducts.map((p, i) => (
                          <div key={i} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800/50 ck-p-3 ck-rounded-xl ck-border ck-border-gray-800">
                            <div>
                              <p className="ck-text-white ck-font-bold ck-text-sm ck-line-clamp-1">{p.productName}</p>
                              <p className="ck-text-xs ck-text-blue-400 ck-font-mono mt-1">Đã xuất: {p.totalQuantity}</p>
                            </div>
                            <span className="ck-text-white ck-font-black ck-text-sm">{Number(p.totalValue || 0).toLocaleString()}đ</span>
                          </div>
                        ))
                      ) : (
                        <p className="ck-text-xs ck-text-gray-500">Chưa có dữ liệu.</p>
                      )}
                    </div>
                  </div>

                  {/* TẦNG 2: TOP HAO HỤT */}
                  <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex-1 ck-flex ck-flex-col">
                    <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4 ck-flex ck-items-center ck-gap-2">
                      Top Sản Phẩm Hao Hụt
                    </h3>
                    <div className="ck-flex-1 ck-space-y-3 ck-overflow-y-auto ck-scrollbar ck-pr-2" style={{ maxHeight: "180px" }}>
                      {dashboardData?.topWastedProducts?.length > 0 ? (
                        dashboardData.topWastedProducts.map((w, i) => (
                          <div key={i} className="ck-flex ck-justify-between ck-items-center ck-bg-red-500/5 ck-p-3 ck-rounded-xl ck-border ck-border-red-500/10">
                            <div>
                              <p className="ck-text-white ck-font-bold ck-text-sm ck-line-clamp-1">{w.productName}</p>
                              <p className="ck-text-xs ck-text-red-400 ck-font-mono mt-1">Hỏng/Hủy: {w.totalQuantity}</p>
                            </div>
                            <span className="ck-text-red-400 ck-font-black ck-text-sm">{Number(w.totalValue || 0).toLocaleString()}đ</span>
                          </div>
                        ))
                      ) : (
                        <p className="ck-text-xs ck-text-gray-500">Không có hao hụt. Quá tuyệt vời!</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
{/* ================== 2. TAB QUẢN LÝ SẢN PHẨM ================== */}
{activeManagementTab === "Quản lý sản phẩm" && (
  <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
    <div className="ck-flex ck-gap-4 ck-items-center">
      <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm mã ID, Tên sản phẩm..."
          className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
          style={{ backgroundColor: "#111827", color: "white" }}
          defaultValue={productSearchText}
          onChange={(e) => setProductSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              setProductAppliedSearch(e.target.value);
          }}
        />
        <button
          onClick={() => setProductAppliedSearch(productSearchText)}
          className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
        >
          Tìm kiếm
        </button>
      </div>
      <select
        value={filterProductCategory}
        onChange={(e) => setFilterProductCategory(e.target.value)}
        className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
      >
        <option value="Tất cả danh mục">Tất cả danh mục</option>
        <option value="Gà rán">Gà rán</option>
        <option value="Burger">Burger</option>
        <option value="Thức uống">Thức uống</option>
        <option value="Ăn vặt">Ăn vặt</option>
      </select>

      {/* ĐÃ XÓA NÚT THÊM SẢN PHẨM THEO YÊU CẦU */}
    </div>

    <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
      <div
        className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
        style={{ width: showAddMasterProduct ? "66.66%" : "100%" }}
      >
        <table className="ck-w-full ck-text-left ck-border-collapse">
          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
            <tr>
              <th className="ck-py-4 ck-px-4">Mã Món</th>
              <th className="ck-py-4 ck-px-4">Sản phẩm</th>
              <th className="ck-py-4 ck-px-4">Danh mục</th>
              <th className="ck-py-4 ck-px-4">Giá vốn</th>
              <th className="ck-py-4 ck-px-4">Giá Franchise</th>
              <th className="ck-py-4 ck-px-4 ck-text-center">Trạng thái</th>
              <th className="ck-py-4 ck-px-4 ck-text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="ck-text-white ck-text-sm">
            {masterProducts
              .filter((prod) => {
                let matchText = true;
                if (productAppliedSearch)
                  matchText =
                    (prod.product_id || prod.productId || "")
                      .toLowerCase()
                      .includes(productAppliedSearch.toLowerCase()) ||
                    (prod.product_name || prod.name || "")
                      .toLowerCase()
                      .includes(productAppliedSearch.toLowerCase());
                let matchCat =
                  filterProductCategory === "Tất cả danh mục" ||
                  prod.category === filterProductCategory;
                return matchText && matchCat;
              })
              .map((prod, idx) => {
                // Thay đoạn cũ bằng đoạn này:
const isSelling = 
  prod.isActive === true || 
  prod.active === true || 
  prod.is_active === true || 
  prod.is_active === 1 || 
  String(prod.is_active) === "true";

                return (
                  <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                    <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">
                      {prod.product_id || prod.productId}
                    </td>
                    <td className="ck-py-4 ck-px-4 ck-font-bold">
                      {prod.emoji || "🍴"} {prod.product_name || prod.name}
                    </td>
                    <td className="ck-py-4 ck-px-4">{prod.category}</td>
                    <td className="ck-py-4 ck-px-4 ck-text-blue-400 ck-font-mono">
                      {Number(prod.cost_price || prod.costPrice || 0).toLocaleString()} ₫
                    </td>
                    <td className="ck-py-4 ck-px-4 ck-text-green-400 ck-font-mono">
                      {Number(prod.selling_price || prod.sellingPrice || prod.price || 0).toLocaleString()} ₫
                    </td>
                    
                    {/* CỘT TRẠNG THÁI: ĐỒNG BỘ UI XANH/ĐỎ */}
                    <td className="ck-py-4 ck-px-4 ck-text-center">
                      <span
                        className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                          isSelling 
                            ? "ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50" 
                            : "ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50"
                        }`}
                      >
                        {isSelling ? "Đang bán" : "Ngừng bán"}
                      </span>
                    </td>
                    
                    <td className="ck-py-4 ck-px-4 ck-text-center">
                      <button
                        onClick={() => {
                          setEditingMasterProduct(prod);
                          setNewMasterProduct({
                            ...prod,
                            name: prod.product_name || prod.name,
                            productId: prod.product_id || prod.productId,
                            cogs: prod.cost_price || prod.costPrice,
                            price: prod.selling_price || prod.sellingPrice || prod.price,
                            status: isSelling ? "Đang bán" : "Ngừng bán",
                            emoji: prod.emoji || "🍴"
                          });
                          setShowAddMasterProduct(true);
                        }}
                        className="ck-mr-3 ck-text-gray-400 hover:ck-text-white bg-transparent border-none cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteMasterProduct(prod.product_id || prod.productId)}
                        className="ck-text-red-500 hover:ck-text-red-400 bg-transparent border-none cursor-pointer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showAddMasterProduct && (
        <div
          className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
          style={{ width: "33.33%" }}
        >
          <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
            <h3 className="ck-text-xl ck-font-bold ck-text-white">
              Chi tiết Sản Phẩm
            </h3>
            <button
              onClick={() => setShowAddMasterProduct(false)}
              className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
            >
              ✕
            </button>
          </div>
          <div className="ck-space-y-4 ck-text-sm">
            <div>
              <label className="ck-block ck-text-gray-400 ck-mb-1">Mã Sản Phẩm</label>
              <input
                type="text"
                readOnly
                value={newMasterProduct.productId}
                className="ck-w-full ck-bg-gray-800 ck-text-gray-400 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
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
              <div>
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
          <div className="ck-mt-6 ck-flex ck-gap-3">
            <button
              onClick={handleSaveMasterProduct}
              className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer"
            >
              Cập nhật dữ liệu
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
          {/* ================== 3. TAB TỔNG QUAN TỒN KHO ================== */}
          {activeManagementTab === "Tổng quan tồn kho" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-yellow-400 ck-transition-colors">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã hàng, tên nguyên liệu..."
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                    style={{ backgroundColor: "#111827", color: "white" }}
                    defaultValue={inventorySearchText}
                    onChange={(e) => setInventorySearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setInventoryAppliedSearch(e.target.value);
                    }}
                  />
                  <button
                    onClick={() =>
                      setInventoryAppliedSearch(inventorySearchText)
                    }
                    className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-yellow-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
                  >
                    Tìm kiếm
                  </button>
                </div>

                <select
                  value={filterInventoryLocation}
                  onChange={(e) => setFilterInventoryLocation(e.target.value)}
                  className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
                >
                  <option value="Tất cả Kho">Tất cả Kho</option>
                  <option value="Bếp Trung Tâm">Bếp Trung Tâm</option>
                  <option value="CN Quận 1">CN Quận 1</option>
                  <option value="CN Quận 3">CN Quận 3</option>
                </select>

                <select
                  value={filterInventoryCategory}
                  onChange={(e) => setFilterInventoryCategory(e.target.value)}
                  className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
                >
                  <option value="Tất cả danh mục">Tất cả danh mục</option>
                  <option value="Thịt / Cá">Thịt / Cá</option>
                  <option value="Rau củ">Rau củ</option>
                  <option value="Gia vị / Sốt">Gia vị / Sốt</option>
                  <option value="Bao bì">Bao bì</option>
                </select>
                <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex-shrink-0">
                  📥 Xuất File
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div
                  className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
                  style={{ width: selectedInventoryItem ? "66.66%" : "100%" }}
                >
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr>
                        <th className="ck-py-4 ck-px-4">Mã Hàng</th>
                        <th className="ck-py-4 ck-px-4">
                          Nguyên liệu / Vật tư
                        </th>
                        <th className="ck-py-4 ck-px-4">Kho</th>
                        <th className="ck-py-4 ck-px-4">Danh mục</th>
                        <th className="ck-py-4 ck-px-4 ck-text-right">
                          Tồn hiện tại
                        </th>
                        <th className="ck-py-4 ck-px-4 ck-text-center">
                          Tình trạng
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {filteredInventory.length > 0 ? (
                        filteredInventory.map((item, idx) => {
                          const isOutOfStock = item.stock <= 0;
                          const isLowStock = item.stock <= (item.min || 10);
                          return (
                            <tr
                              key={idx}
                              onClick={() => setSelectedInventoryItem(item)}
                              className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedInventoryItem?.ingredientId === item.ingredientId ? "ck-bg-gray-800 ck-border-l-4 ck-border-l-yellow-400" : ""}`}
                            >
                              <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">
                                {item.ingredientId || item.sku}
                              </td>
                              <td className="ck-py-4 ck-px-4 ck-font-bold">
                                {item.ingredientName || item.name}
                              </td>
                              <td className="ck-py-4 ck-px-4">
                                <span
                                  className={`ck-text-xs ck-font-bold ck-px-2 ck-py-1 ck-rounded-md ck-bg-purple-500-20 ck-text-purple-400`}
                                >
                                  Kho Tổng
                                </span>
                              </td>
                              <td className="ck-py-4 ck-px-4 ck-text-gray-400">
                                {item.category || "Nguyên liệu"}
                              </td>
                              <td
                                className={`ck-py-4 ck-px-4 ck-font-mono ck-font-bold ck-text-right ${isOutOfStock ? "ck-text-red-500" : isLowStock ? "ck-text-yellow-400" : "ck-text-white"}`}
                              >
                                {Number(item.stock || 0).toLocaleString()}{" "}
                                <span className="ck-text-xs ck-text-gray-500">
                                  {item.unit}
                                </span>
                              </td>
                              <td className="ck-py-4 ck-px-4 ck-text-center">
                                {isOutOfStock ? (
                                  <span className="ck-bg-red-500-20 ck-text-red-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">
                                    Hết hàng
                                  </span>
                                ) : isLowStock ? (
                                  <span className="ck-bg-yellow-500-20 ck-text-yellow-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">
                                    Sắp hết
                                  </span>
                                ) : (
                                  <span className="ck-bg-green-500-20 ck-text-green-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold">
                                    An toàn
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="ck-py-8 ck-text-center ck-text-gray-500"
                          >
                            Không tìm thấy nguyên liệu nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedInventoryItem && (
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                    style={{ width: "33.33%" }}
                  >
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">
                        Chi tiết Tồn kho
                      </h3>
                      <button
                        onClick={() => setSelectedInventoryItem(null)}
                        className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-space-y-5 ck-text-sm">
                      <div className="ck-bg-gray-800 ck-p-4 ck-rounded-xl ck-border ck-border-gray-700">
                        <p className="ck-text-xs ck-text-gray-400 ck-font-mono ck-mb-1">
                          {selectedInventoryItem.ingredientId || selectedInventoryItem.sku}
                        </p>
                        <p className="ck-text-lg ck-text-white ck-font-bold ck-mb-1">
                          {selectedInventoryItem.ingredientName || selectedInventoryItem.name}
                        </p>
                        <p className="ck-text-xs ck-text-purple-400 ck-font-bold ck-mb-3">
                          Kho: Kho Tổng
                        </p>
                        <div className="ck-flex ck-justify-between ck-items-end mt-4">
                          <div>
                            <p className="ck-text-xs ck-text-gray-400 ck-mb-1">
                              Tồn kho thực tế
                            </p>
                            <p className="ck-text-2xl ck-font-black ck-text-white">
                              {selectedInventoryItem.stock || 0}{" "}
                              <span className="ck-text-sm ck-text-gray-500 ck-font-normal">
                                {selectedInventoryItem.unit}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* --- BẮT ĐẦU KHỐI QUY ĐỔI ĐƠN VỊ --- */}
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

  {/* Form thêm mới */}
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
            // Reload list
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

  {/* Danh sách quy đổi hiện có */}
  <div className="ck-space-y-2 ck-max-h-40 ck-overflow-y-auto ck-scrollbar pr-1">
    {conversions.length > 0 ? conversions.map((conv, idx) => (
      <div key={idx} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-800 ck-p-2 ck-rounded-lg ck-border ck-border-gray-700">
        <div className="ck-text-xs ck-text-gray-300">
          <strong className="ck-text-white ck-font-mono">{conv.unitName || conv.unit_name}</strong> = {conv.conversionFactor || conv.conversion_factor} {selectedInventoryItem.unit}
        </div>
        
        <div className="ck-flex ck-gap-1">
          {/* NÚT SỬA (MỚI THÊM) */}
          <button 
            onClick={async () => {
              const currentFactor = conv.conversionFactor || conv.conversion_factor;
              const unit = conv.unitName || conv.unit_name;
              const newFactor = window.prompt(`Nhập tỉ lệ quy đổi mới cho ${unit} (Gốc: ${selectedInventoryItem.unit}):`, currentFactor);
              
              if (newFactor && newFactor !== String(currentFactor) && !isNaN(newFactor)) {
                try {
                  await api.updateUnitConversion(conv.id, Number(newFactor));
                  // Cập nhật lại UI ngay lập tức
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

          {/* NÚT XÓA (GIỮ NGUYÊN) */}
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

  {/* Công cụ Test tính toán */}
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
            // Lệnh nội gián: In ra F12 xem Backend thực sự trả về cái gì
            console.log(`Kiểm tra quy đổi dòng thứ ${i}:`, c);

            // Bọc thép mọi trường hợp: Nếu c là chữ thì lấy luôn, nếu là object thì tìm vét cạn các key
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
{/* --- KẾT THÚC KHỐI QUY ĐỔI ĐƠN VỊ --- */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 4. TAB PHÂN TÍCH CHI PHÍ ================== */}
          {activeManagementTab === "Phân tích chi phí" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center">
                <h2 className="ck-text-2xl ck-font-black ck-text-white">
                  Báo cáo Phân tích Chi phí
                </h2>
                <div className="ck-flex ck-gap-3">
                  <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600">
                    📥 Tải Báo Cáo ({expenses.length} phiếu chi)
                  </button>
                </div>
              </div>

              <div className="ck-grid ck-grid-cols-4 ck-gap-4">
                {kpiStats.length > 0 ? (
                  kpiStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-flex-col ck-justify-center"
                    >
                      <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">
                        {stat.label}
                      </h4>
                      <div className="ck-flex ck-items-end ck-gap-3">
                        <p className="ck-text-3xl ck-font-black ck-text-white">
                          {stat.value}
                        </p>
                        <span
                          className={`ck-text-sm ck-font-bold ck-mb-1 ${stat.isUp ? "ck-text-green-400" : "ck-text-red-400"}`}
                        >
                          {stat.isUp ? "↑" : "↓"} {stat.change}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ck-col-span-4 ck-text-center ck-text-gray-500 ck-py-4">
                    Đang tải chỉ số phân tích...
                  </div>
                )}
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                <div
                  className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col"
                  style={{ minHeight: "350px" }}
                >
                  <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">
                    Xu hướng chi phí giao dịch
                  </h3>
                  <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-bg-gray-800/50">
                    <span className="ck-text-gray-500">
                      Dữ liệu sẵn sàng từ {expenses.length} bản ghi thực tế
                    </span>
                  </div>
                </div>

                <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
                  <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">
                    Cơ cấu Chi phí (%)
                  </h3>
                  <div className="ck-flex-1 ck-overflow-y-auto ck-scrollbar ck-pr-2">
                    {costStructureArray.length > 0 && totalExpenseVal > 0 ? (
                      <div className="ck-space-y-4">
                        {costStructureArray.map((item, i) => {
                          const percent = (
                            (item.value / totalExpenseVal) *
                            100
                          ).toFixed(1);
                          return (
                            <div key={i}>
                              <div className="ck-flex ck-justify-between ck-text-xs ck-mb-1">
                                <span className="ck-text-gray-400">
                                  {item.name}
                                </span>
                                <span className="ck-text-white ck-font-bold">
                                  {percent}%
                                </span>
                              </div>
                              <div className="ck-w-full ck-bg-gray-800 ck-rounded-full ck-h-1.5">
                                <div
                                  className="ck-bg-blue-500 ck-h-1.5 ck-rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
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
          {activeManagementTab === "Báo cáo" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl">
                <div className="ck-flex ck-items-center ck-gap-4">
                  <h2 className="ck-text-xl ck-font-black ck-text-white ck-mr-4">
                    Trích xuất Báo cáo
                  </h2>
                </div>
                <button
                  className="ck-btn ck-px-5 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-shadow-lg"
                  onClick={() => setShowCreateReport(true)}
                >
                  + Tạo báo cáo tùy chỉnh
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start">
                <div
                  className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all"
                  style={{ width: showCreateReport ? "66.66%" : "100%" }}
                >
                  <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                    <h3 className="ck-text-lg ck-font-bold ck-text-white">
                      Lịch sử xuất báo cáo gần đây
                    </h3>
                  </div>
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr>
                        <th className="ck-py-4 ck-px-5">Mã File</th>
                        <th className="ck-py-4 ck-px-5">Tên báo cáo</th>
                        <th className="ck-py-4 ck-px-5">Thời gian</th>
                        <th className="ck-py-4 ck-px-5 ck-text-center">
                          Định dạng
                        </th>
                        <th className="ck-py-4 ck-px-5 ck-text-center">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {reports.map((report, idx) => (
                        <tr
                          key={idx}
                          className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors"
                        >
                          <td className="ck-py-4 ck-px-5 ck-font-mono ck-text-gray-400">
                            {report.id}
                          </td>
                          <td className="ck-py-4 ck-px-5 ck-font-bold">
                            {report.name}
                          </td>
                          <td className="ck-py-4 ck-px-5 ck-text-gray-400">
                            {report.date}
                          </td>
                          <td className="ck-py-4 ck-px-5 ck-text-center">
                            <span
                              className={`ck-px-3 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ck-border ${report.type === "PDF" ? "ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50" : "ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50"}`}
                            >
                              {report.type}
                            </span>
                          </td>
                          {/* Tìm đến đoạn map() danh sách báo cáo trong bảng của tab Báo cáo */}
<td className="ck-py-4 ck-px-5 ck-text-center">
  <button 
    // GỌI HÀM VÀ TRUYỀN NGÀY VÀO ĐÂY
    onClick={() => api.exportAnalyticsCSV(report.startDate, report.endDate)}
    className="ck-btn ck-px-4 ck-py-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-rounded-lg ck-font-bold ck-text-xs ck-border-none"
  >
    Tải xuống ⬇
  </button>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showCreateReport && (
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                    style={{ width: "33.33%" }}
                  >
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">
                        Tạo Báo Cáo Mới
                      </h3>
                      <button
                        onClick={() => setShowCreateReport(false)}
                        className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">
                          Tên báo cáo *
                        </label>
                        <input
                          type="text"
                          value={newReport.name}
                          onChange={(e) =>
                            setNewReport({ ...newReport, name: e.target.value })
                          }
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                          placeholder="VD: Báo cáo tháng 3..."
                        />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">
                          Định dạng file
                        </label>
                        <select
                          value={newReport.type}
                          onChange={(e) =>
                            setNewReport({ ...newReport, type: e.target.value })
                          }
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                        >
                          <option>PDF</option>
                          <option>Excel</option>
                        </select>
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={newReport.fromDate}
                            onChange={(e) =>
                              setNewReport({
                                ...newReport,
                                fromDate: e.target.value,
                              })
                            }
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                          />
                        </div>
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={newReport.toDate}
                            onChange={(e) =>
                              setNewReport({
                                ...newReport,
                                toDate: e.target.value,
                              })
                            }
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button
                        onClick={handleCreateReport}
                        className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer"
                      >
                        Tạo & Xuất file
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 6. TAB QUẢN LÝ CÔNG THỨC ================== */}
          {activeManagementTab === "Quản lý công thức" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã SKU, Tên sản phẩm..."
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                    style={{ backgroundColor: "#111827", color: "white" }}
                    defaultValue={recipeSearchText}
                    onChange={(e) => setRecipeSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setRecipeAppliedSearch(e.target.value);
                    }}
                  />
                  <button
                    onClick={() => setRecipeAppliedSearch(recipeSearchText)}
                    className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>
              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM (LẤY TỪ MASTER PRODUCTS) */}
                <div
                  className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
                  style={{ width: selectedRecipe ? "55%" : "100%", maxHeight: "600px", overflowY: "auto" }}
                >
                  <table className="ck-w-full ck-text-left ck-border-collapse relative">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase sticky top-0 z-10">
                      <tr>
                        <th className="ck-py-4 ck-px-4">Mã Món</th>
                        <th className="ck-py-4 ck-px-4">Sản phẩm</th>
                        <th className="ck-py-4 ck-px-4 ck-text-center">Đơn vị bán</th>
                        <th className="ck-py-4 ck-px-4 ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
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
                                  // 1. Gán selectedRecipe tạm thời để UI mở khung bên phải
                                  setSelectedRecipe(prod);
                                  setEditingRecipeIngredients([]); // Xóa trắng list tạm

                                  // 2. Gọi API GET /api/formulas/{productId} để lấy chi tiết
                                  try {
                                    const res = await api.getRecipeOfProduct(pId);
                                    if (res && res.ingredients) {
                                      // Map dữ liệu API trả về, dò tìm tên nguyên liệu trong inventory nếu Backend chỉ trả ID
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
                                    // Nếu lỗi (thường là 404 Not Found do chưa có công thức), để trống mảng để người dùng tạo mới
                                    setEditingRecipeIngredients([]);
                                  }
                                }}
                                className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${isSelected ? "ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500" : ""}`}
                              >
                                <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">
                                  {pId}
                                </td>
                                <td className="ck-py-4 ck-px-4 ck-font-bold">
                                  {prod.emoji || "🍴"} {prod.product_name || prod.name}
                                </td>
                                <td className="ck-py-4 ck-px-4 ck-text-center ck-font-mono ck-text-gray-300">
                                  {prod.baseUnit || prod.base_unit || "PHẦN"}
                                </td>
                                <td className="ck-py-4 ck-px-4 ck-text-center">
                                  <span className="ck-text-orange-400 ck-text-xs ck-font-bold group-hover:ck-underline">
                                    Thiết lập →
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan="4" className="ck-py-8 ck-text-center ck-text-gray-500">
                            Không tìm thấy sản phẩm nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CỘT PHẢI: FORM CHI TIẾT VÀ CHỈNH SỬA CÔNG THỨC */}
                {selectedRecipe && (
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-flex ck-flex-col ck-animate-fade-in"
                    style={{ width: "45%", maxHeight: "600px" }}
                  >
                    <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                      <div>
                        <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-1">
                          Định mức nguyên liệu (BOM)
                        </h3>
                        <p className="ck-text-sm ck-text-orange-400 ck-font-semibold">
                          {selectedRecipe.emoji || "🍴"} {selectedRecipe.product_name || selectedRecipe.name}
                        </p>
                      </div>
                      <div className="ck-flex ck-gap-2">
                        {/* Nút Xóa toàn bộ công thức */}
                        {editingRecipeIngredients.length > 0 && (
                          <button
                            onClick={async () => {
                              if(window.confirm("Bạn có chắc muốn XÓA TOÀN BỘ công thức của món này?")) {
                                try {
                                  const pId = selectedRecipe.product_id || selectedRecipe.productId || selectedRecipe.id;
                                  await api.deleteRecipe(pId);
                                  alert("✅ Đã xóa công thức!");
                                  setEditingRecipeIngredients([]); // Làm trống UI ngay lập tức
                                } catch(e) { alert("Lỗi xóa: " + e.message); }
                              }
                            }}
                            className="ck-text-red-400 hover:ck-text-white hover:ck-bg-red-500 ck-bg-gray-800 ck-px-3 ck-py-1 ck-rounded-lg ck-text-xs ck-font-bold ck-border-none ck-cursor-pointer ck-transition-colors"
                          >
                            Xóa BOM
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRecipe(null)}
                          className="ck-text-gray-500 hover:ck-text-red-400 ck-bg-gray-800 ck-w-8 ck-h-8 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-border-none ck-cursor-pointer ck-transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                      {editingRecipeIngredients.length === 0 ? (
                        <div className="ck-text-center ck-py-10 ck-text-gray-500">
                          <p className="ck-mb-2 ck-text-3xl">🫙</p>
                          <p>Sản phẩm này chưa có công thức.</p>
                          <p className="ck-text-xs mt-1">Hãy thêm nguyên liệu bên dưới.</p>
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
                                    // Cập nhật số lượng của nguyên liệu đang sửa
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
                                  // Xóa dòng nguyên liệu
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
                      
                      {/* KHU VỰC THÊM NGUYÊN LIỆU MỚI (Lấy từ Kho) */}
                      <div className="ck-mt-4 ck-pt-4 ck-border-t ck-border-gray-700 ck-border-dashed">
                        <select 
                          className="ck-w-full ck-bg-gray-800 ck-text-gray-300 ck-px-3 ck-py-2 ck-rounded-xl ck-border ck-border-gray-600 ck-outline-none ck-cursor-pointer ck-mb-2"
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if(!selectedId) return;
                            
                            // Tìm chi tiết nguyên liệu trong kho inventory
                            const foundItem = inventory.find(item => (item.ingredientId || item.id || item.sku) === selectedId);
                            if(foundItem) {
                              // Tránh thêm trùng
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
                                  amountNeeded: 1, // Mặc định gán là 1
                                  unit: foundItem.unit || "N/A"
                                }
                              ]);
                              e.target.value = ""; // reset dropdown
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
                    
                    {/* NÚT LƯU CÔNG THỨC */}
                    <div className="ck-p-5 ck-border-t ck-border-gray-700 ck-bg-gray-800/50">
                       <button 
                          onClick={async () => {
                            if(editingRecipeIngredients.length === 0) return alert("Vui lòng thêm ít nhất 1 nguyên liệu!");
                            
                            const pId = selectedRecipe.product_id || selectedRecipe.productId || selectedRecipe.id;

                            // Chuẩn bị Payload ĐÚNG CHUẨN JSON Backend yêu cầu
                            const payload = {
                              productId: pId,
                              ingredients: editingRecipeIngredients.map(ing => ({
                                ingredientId: ing.ingredientId,
                                amountNeeded: Number(ing.amountNeeded)
                              }))
                            };

                            try {
                              // GỌI POST /api/formulas
                              await api.saveRecipe(payload);
                              alert("✅ Đã lưu/cập nhật công thức thành công!");
                            } catch(e) {
                              alert("❌ Lỗi lưu công thức: " + e.message);
                            }
                          }}
                          className="ck-w-full ck-py-3 ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-rounded-xl ck-font-black ck-border-none ck-cursor-pointer ck-shadow-lg shadow-orange-500/20 ck-transition-all"
                        >
                          💾 LƯU CÔNG THỨC
                        </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================== 7. TAB CHI PHÍ NHẬP HÀNG ================== */}
          {activeManagementTab === "Chi phí nhập hàng" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-grid ck-grid-cols-3 ck-gap-4">
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">
                      Tổng Chi (Thực tế)
                    </h4>
                    <p className="ck-text-2xl ck-font-black ck-text-red-400">
                      {totalExpenseVal.toLocaleString()} ₫
                    </p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-red-500-20 ck-flex ck-items-center ck-justify-center ck-text-2xl">
                    💸
                  </div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">
                      Chi phí Nguyên vật liệu
                    </h4>
                    <p className="ck-text-2xl ck-font-black ck-text-white">
                      {ingredientExpenseVal.toLocaleString()} ₫
                    </p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">
                    🥩
                  </div>
                </div>
                <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
                  <div>
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">
                      Chi phí Vận hành
                    </h4>
                    <p className="ck-text-2xl ck-font-black ck-text-white">
                      {operationExpenseVal.toLocaleString()} ₫
                    </p>
                  </div>
                  <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-gray-800 ck-flex ck-items-center ck-justify-center ck-text-2xl">
                    ⚡
                  </div>
                </div>
              </div>

              <div className="ck-flex ck-gap-4 ck-items-center">
                <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã phiếu chi, nhà cung cấp..."
                    className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                    style={{ backgroundColor: "#111827", color: "white" }}
                    defaultValue={expenseSearchText}
                    onChange={(e) => setExpenseSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setExpenseAppliedSearch(e.target.value);
                    }}
                  />
                  <button
                    onClick={() => setExpenseAppliedSearch(expenseSearchText)}
                    className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
                  >
                    Tìm kiếm
                  </button>
                </div>
                <select
                  value={filterExpenseCategory}
                  onChange={(e) => setFilterExpenseCategory(e.target.value)}
                  className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
                >
                  <option value="Hạng mục chi">Tất cả Hạng mục</option>
                  <option value="Nhập nguyên liệu">Nhập nguyên liệu</option>
                  <option value="Chi phí bao bì">Chi phí bao bì</option>
                  <option value="Vận hành / Điện nước">
                    Vận hành / Điện nước
                  </option>
                </select>
                <input
                  type="date"
                  value={filterExpenseDate}
                  onChange={(e) => setFilterExpenseDate(e.target.value)}
                  className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
                />
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-flex-shrink-0"
                >
                  + Tạo Phiếu Chi
                </button>
              </div>

              <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
                <div
                  className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
                  style={{
                    width:
                      selectedExpense || showAddExpense ? "66.66%" : "100%",
                  }}
                >
                  <table className="ck-w-full ck-text-left ck-border-collapse">
                    <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                      <tr>
                        <th className="ck-py-4 ck-px-4">Mã Phiếu</th>
                        <th className="ck-py-4 ck-px-4">Thời gian</th>
                        <th className="ck-py-4 ck-px-4">Nhà cung cấp</th>
                        <th className="ck-py-4 ck-px-4">
                          Hạng mục & Tham chiếu
                        </th>
                        <th className="ck-py-4 ck-px-4 ck-text-right">
                          Số tiền (VNĐ)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ck-text-white ck-text-sm">
                      {expenses
                        .filter((tx) => {
                          let matchText = expenseAppliedSearch
                            ? tx.id
                                .toLowerCase()
                                .includes(expenseAppliedSearch.toLowerCase()) ||
                              tx.supplier
                                .toLowerCase()
                                .includes(expenseAppliedSearch.toLowerCase())
                            : true;
                          let matchCategory =
                            filterExpenseCategory === "Hạng mục chi" ||
                            tx.category === filterExpenseCategory;
                          let matchDate =
                            filterExpenseDate === "" ||
                            tx.date === filterExpenseDate;
                          return matchText && matchCategory && matchDate;
                        })
                        .map((tx, idx) => (
                          <tr
                            key={idx}
                            onClick={() => {
                              setSelectedExpense(tx);
                              setShowAddExpense(false);
                            }}
                            className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedExpense?.id === tx.id ? "ck-bg-gray-800 ck-border-l-4 ck-border-l-red-500" : ""}`}
                          >
                            <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">
                              {tx.id}
                            </td>
                            <td className="ck-py-4 ck-px-4 ck-text-gray-400">
                              {tx.date}
                            </td>
                            <td className="ck-py-4 ck-px-4 ck-font-bold">
                              {tx.supplier}
                            </td>
                            <td className="ck-py-4 ck-px-4">
                              <span className="ck-block ck-text-gray-300">
                                {tx.category}
                              </span>
                              <span className="ck-text-xs ck-text-gray-500">
                                {tx.ref}
                              </span>
                            </td>
                            <td className="ck-py-4 ck-px-4 ck-text-right ck-font-mono ck-font-bold ck-text-red-400">
                              -{tx.amount.toLocaleString()} ₫
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* FORM TẠO PHIẾU CHI MỚI */}
                {showAddExpense && (
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                    style={{ width: "33.33%" }}
                  >
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">
                        Tạo Phiếu Chi
                      </h3>
                      <button
                        onClick={() => setShowAddExpense(false)}
                        className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-space-y-4 ck-text-sm">
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">
                          Nhà cung cấp / Đối tác *
                        </label>
                        <input
                          type="text"
                          value={newExpense.supplier}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              supplier: e.target.value,
                            })
                          }
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                          placeholder="VD: CP Foods, Bao Bì Xanh..."
                        />
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">
                          Hạng mục chi *
                        </label>
                        <select
                          value={newExpense.category}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              category: e.target.value,
                            })
                          }
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                        >
                          <option>Nhập nguyên liệu</option>
                          <option>Chi phí bao bì</option>
                          <option>Vận hành / Điện nước</option>
                          <option>Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="ck-block ck-text-gray-400 ck-mb-1">
                          Số tiền (VNĐ) *
                        </label>
                        <input
                          type="number"
                          value={newExpense.amount}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              amount: e.target.value,
                            })
                          }
                          className="ck-w-full ck-bg-gray-800 ck-text-white ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-red-500 ck-outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">
                            Mã tham chiếu (Đơn hàng)
                          </label>
                          <input
                            type="text"
                            value={newExpense.ref}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                ref: e.target.value,
                              })
                            }
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                            placeholder="Mã PO..."
                          />
                        </div>
                        <div>
                          <label className="ck-block ck-text-gray-400 ck-mb-1">
                            Phương thức
                          </label>
                          <select
                            value={newExpense.method}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                method: e.target.value,
                              })
                            }
                            className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none"
                          >
                            <option>Chuyển khoản</option>
                            <option>Tiền mặt</option>
                            <option>Công nợ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button
                        onClick={handleSaveExpense}
                        className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer"
                      >
                        Lưu Phiếu Chi
                      </button>
                    </div>
                  </div>
                )}

                {/* XEM CHI TIẾT PHIẾU CHI */}
                {selectedExpense && !showAddExpense && (
                  <div
                    className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                    style={{ width: "33.33%" }}
                  >
                    <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                      <h3 className="ck-text-xl ck-font-bold ck-text-white">
                        Chi tiết Phiếu Chi
                      </h3>
                      <button
                        onClick={() => setSelectedExpense(null)}
                        className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-xl ck-p-5 ck-relative ck-overflow-hidden">
                      <div className="ck-absolute ck-top-0 ck-left-0 ck-w-full ck-h-2 ck-bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+')] ck-bg-repeat-x ck-transform ck--translate-y-1"></div>
                      <div className="ck-text-center ck-mb-6 ck-mt-2">
                        <p className="ck-text-sm ck-text-gray-400 ck-mb-1">
                          Mã Phiếu
                        </p>
                        <p className="ck-text-xl ck-font-mono ck-font-bold ck-text-white">
                          {selectedExpense.id}
                        </p>
                        <p className="ck-text-xs ck-text-gray-500 ck-mt-1">
                          {selectedExpense.date}
                        </p>
                      </div>
                      <div className="ck-space-y-3 ck-text-sm ck-border-t ck-border-b ck-border-dashed ck-border-gray-600 ck-py-4 ck-mb-4">
                        <div className="ck-flex ck-justify-between">
                          <span className="ck-text-gray-400">
                            Nhà cung cấp:
                          </span>
                          <span className="ck-text-white ck-font-semibold">
                            {selectedExpense.supplier}
                          </span>
                        </div>
                        <div className="ck-flex ck-justify-between">
                          <span className="ck-text-gray-400">Hạng mục:</span>
                          <span className="ck-text-gray-300">
                            {selectedExpense.category}
                          </span>
                        </div>
                        <div className="ck-flex ck-justify-between">
                          <span className="ck-text-gray-400">Mã PO/HĐ:</span>
                          <span className="ck-text-blue-400 ck-font-medium ck-underline ck-cursor-pointer">
                            {selectedExpense.ref || "Không có"}
                          </span>
                        </div>
                        <div className="ck-flex ck-justify-between">
                          <span className="ck-text-gray-400">Hình thức:</span>
                          <span className="ck-text-white">
                            {selectedExpense.method}
                          </span>
                        </div>
                      </div>
                      <div className="ck-flex ck-justify-between ck-items-end">
                        <span className="ck-text-base ck-text-gray-300 ck-font-bold">
                          Tổng chi:
                        </span>
                        <span className="ck-text-3xl ck-font-black ck-text-red-400">
                          -{selectedExpense.amount.toLocaleString()} ₫
                        </span>
                      </div>
                    </div>
                    <div className="ck-mt-6 ck-flex ck-gap-3">
                      <button className="ck-flex-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                        🖨️ In Phiếu Chi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ================== 8. TAB CỬA HÀNG FRANCHISE ================== */}
          {activeManagementTab === "Cửa hàng Franchise" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
              {!selectedStore ? (
                /* VIEW 1: DANH SÁCH CỬA HÀNG */
                <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                  {stores.map((store) => {
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
                      className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-6 ck-rounded-2xl hover:ck-border-red-500 ck-transition-all ck-cursor-pointer group shadow-xl"
                    >
                      <div className="ck-flex ck-justify-between ck-mb-4">
                        <div className="ck-p-3 ck-bg-gray-800 ck-rounded-xl">
                          <Store className="ck-text-red-400" size={32} />
                        </div>
                        <span className={`ck-badge ${isStoreActive ? "ck-badge-green" : "ck-badge-red"} ck-h-fit`}>
                          {isStoreActive ? "Đang chạy" : "Tạm dừng"}
                        </span>
                      </div>
                      <h3 className="ck-text-xl ck-font-black ck-text-white ck-mb-1">{store.name}</h3>
                      <p className="ck-text-sm ck-text-gray-500 ck-mb-4 ck-line-clamp-1">{store.address}</p>
                      <div className="ck-flex ck-justify-between ck-items-center ck-pt-4 ck-border-t ck-border-gray-800">
                        <span className="ck-text-xs ck-font-mono ck-text-gray-600">{store.id || store.storeId}</span>
                        <span className="ck-text-red-400 ck-font-bold group-hover:ck-translate-x-1 ck-transition-transform">Chi tiết →</span>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                /* VIEW 2 & 3: CHI TIẾT & ĐẶT HÀNG HỘ */
                <div className="ck-flex ck-flex-col ck-gap-6 relative">
                  <div className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900 ck-p-4 ck-rounded-2xl ck-border ck-border-gray-700">
                    <div className="ck-flex ck-items-center ck-gap-4">
                      <button
                        onClick={() => {
                          setSelectedStore(null);
                          setIsOrderingForStore(false);
                          setIsUrgentOrder(false); // Reset cờ khẩn cấp khi back
                        }}
                        className="ck-w-10 ck-h-10 ck-flex ck-items-center ck-justify-center ck-bg-gray-800 ck-rounded-full ck-text-gray-400 hover:ck-text-white border-none ck-cursor-pointer"
                      >
                        ←
                      </button>
                      <div>
                        <h2 className="ck-text-2xl ck-font-black ck-text-white">Cửa hàng: {selectedStore.name}</h2>
                        <p className="ck-text-xs ck-text-gray-500 ck-mono">{selectedStore.id || selectedStore.storeId} | {selectedStore.address}</p>
                      </div>
                    </div>
                    {!isOrderingForStore && (
                      <button
                        onClick={() => setIsOrderingForStore(true)}
                        className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold border-none shadow-lg shadow-red-500/20 ck-flex ck-items-center ck-gap-2"
                      >
                        <Plus size={20} /> Tạo đơn đặt hộ
                      </button>
                    )}
                  </div>

                  {isOrderingForStore ? (
                    /* VIEW 3: GIAO DIỆN ĐẶT HÀNG HỘ */
                    <div className="ck-grid ck-grid-cols-3 ck-gap-6 ck-animate-slide-up">
                      {/* Bảng chọn món (Giữ nguyên) */}
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

                      {/* GIỎ HÀNG HỘ (Có nâng cấp nút Khẩn cấp) */}
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
                          
                          {/* NÚT GẠT: ĐẶT ĐƠN KHẨN CẤP */}
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
                    /* VIEW 2: LỊCH SỬ ĐƠN HÀNG (Có cột Thao tác mới) */
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-3xl ck-overflow-hidden shadow-2xl">
                      <div className="ck-p-6 ck-bg-gray-800/50 ck-border-b ck-border-gray-700 ck-flex ck-justify-between items-center">
                        <h3 className="ck-font-black ck-text-gray-300 ck-uppercase tracking-widest text-sm">Lịch sử giao dịch chi nhánh</h3>
                        <button className="ck-text-blue-400 ck-font-bold text-xs bg-transparent border-none ck-cursor-pointer hover:underline">
                          Xuất báo cáo Store
                        </button>
                      </div>
                      <table className="ck-w-full ck-text-left ck-border-collapse">
                        <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-[10px] uppercase tracking-tighter">
  <tr>
    <th className="ck-p-5">Mã đơn hàng</th>
    <th className="ck-p-5">Thời gian đặt</th>
    <th className="ck-p-5">Ngày giao dự kiến</th>
    <th className="ck-p-5 ck-text-right">Tổng giá trị</th>
    <th className="ck-p-5 ck-text-center">Trạng thái</th>
    {/* CỘT MỚI */}
    <th className="ck-p-5 ck-text-center">Thao tác</th>
  </tr>
</thead>
                        <tbody className="ck-text-sm">
                          {(Array.isArray(allOrders) ? allOrders : []).map((order, idx) => {
    const canCancel = !["Hoàn thành", "completed", "DELIVERED", "Đã hủy", "cancelled", "CANCELLED"].includes(order.status);
    
    // Tìm ID an toàn (Đã khớp với orderId của Backend)
    const safeOrderId = order.orderId || order.id || order._id;

    // Tìm Tổng tiền an toàn (Bắt thêm chữ totalAmount của Backend)
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
        {/* Đưa biến safeTotal vào đây */}
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
      
                              {/* CỘT THAO TÁC MỚI */}
                              <td className="ck-p-5 ck-text-center">
                               {/* NÚT XEM CHI TIẾT (CON MẮT) */}
  <button 
    onClick={async () => {
      try {
        // SỬA Ở ĐÂY: Truyền safeOrderId vào hàm getOrderDetails
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
            // SỬA Ở ĐÂY NỮA: Truyền safeOrderId vào hàm cancelManagerOrder
            await api.cancelManagerOrder(safeOrderId);
            alert("✅ Đã hủy đơn hàng thành công!");
            
            // Refetch lại danh sách đơn để cập nhật trạng thái
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

                  {/* MODAL CHI TIẾT ĐƠN HÀNG CỰC XỊN */}
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

         {/* ================== 9. TAB CÀI ĐẶT HỆ THỐNG (CHỈNH SỬA XỊN XÒ) ================== */}
{activeManagementTab === "Cài đặt hệ thống" && (
  <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-8 ck-rounded-3xl shadow-2xl">
      <div className="ck-flex ck-justify-between ck-items-center ck-mb-8">
        <div>
          <h3 className="ck-text-2xl ck-font-black ck-text-white ck-mb-2">
            ⚙️ Cấu hình vận hành trung tâm
          </h3>
          <p className="ck-text-sm ck-text-gray-400">
            Thiết lập các tham số hệ thống cho toàn bộ mạng lưới Bếp & Cửa hàng
          </p>
        </div>
        <button 
          onClick={loadData}
          className="ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-gray-300 ck-rounded-xl ck-text-xs ck-font-bold hover:ck-bg-gray-700 ck-transition-colors ck-border ck-border-gray-600"
        >
          🔄 Làm mới dữ liệu
        </button>
      </div>

      <div className="ck-grid ck-grid-cols-1 md:ck-grid-cols-2 ck-gap-6">
        {Object.keys(systemConfigs).length > 0 ? (
          Object.entries(systemConfigs).map(([key, val]) => (
            <div 
              key={key} 
              className="ck-bg-gray-800/50 ck-p-6 ck-rounded-2xl ck-border ck-border-gray-700 hover:ck-border-blue-500/50 ck-transition-all ck-group"
            >
              <div className="ck-flex ck-justify-between ck-items-start ck-mb-4">
                <span className="ck-px-3 ck-py-1 ck-bg-blue-500/10 ck-text-blue-400 ck-rounded-lg ck-text-[10px] ck-font-black ck-uppercase ck-tracking-widest">
                  System Param
                </span>
                <span className="ck-text-[10px] ck-text-gray-500 ck-font-mono">{key}</span>
              </div>
              
              <h4 className="ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-4 ck-min-h-[20px]">
                {/* Ở đây nếu Backend trả về description thì hiện, không thì hiện key cho đẹp */}
                {key.replace(/_/g, ' ')}
              </h4>

              <div className="ck-flex ck-gap-3 ck-items-center">
                <input
                  type="text"
                  defaultValue={val}
                  id={`input-cfg-${key}`}
                  placeholder="Nhập giá trị..."
                  className="ck-flex-1 ck-bg-gray-900 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-blue-500 ck-outline-none ck-font-bold ck-text-lg"
                />
                <button
                  onClick={async () => {
                    const inputDom = document.getElementById(`input-cfg-${key}`);
                    const newValue = inputDom.value;
                    
                    if (!newValue.trim()) return alert("Vui lòng không để trống!");
                    
                    try {
                      // Xóa sạch khoảng trắng thừa thãi 2 đầu của cái key (nếu có)
                      const cleanKey = key.trim();
                      
                      // Gửi Body chuẩn y chang tài liệu API của bạn
                      await api.updateSystemConfig(cleanKey, {
                        configValue: String(newValue.trim()),
                        description: "Cập nhật từ Manager" // Truyền 1 chuỗi mặc định đề phòng Backend cấm rỗng
                      });
                      
                      alert("✅ Đã cập nhật thành công: " + cleanKey);
                      loadData(); // Tải lại Map mới từ Server
                    } catch (error) {
                      alert("❌ Lỗi: " + error.message);
                    }
                  }}
                 className="ck-px-6 ck-py-3 ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-rounded-xl ck-font-bold ck-transition-all shadow-lg shadow-orange-500/20 ck-border-none ck-cursor-pointer"
                >
                  Lưu
                </button>
              </div>
              <p className="ck-text-[10px] ck-text-gray-500 ck-mt-3 ck-italic">
                * Thay đổi sẽ có hiệu lực ngay lập tức với toàn hệ thống.
              </p>
            </div>
          ))
        ) : (
          <div className="ck-col-span-2 ck-bg-gray-800/30 ck-border ck-border-dashed ck-border-gray-700 ck-rounded-3xl ck-py-20 ck-text-center">
            <p className="ck-text-4xl ck-mb-4">📋</p>
            <p className="ck-text-gray-500 ck-font-medium">Chưa có dữ liệu cấu hình hệ thống</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default ManagerPage; 