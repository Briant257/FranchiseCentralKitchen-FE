import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Store,
  Shield,
  LogOut,
  Plus,
  XCircle,
  UserPlus,
  X,
  Eye,
  Trash2,
} from "../../components/icons/Icons";
import api from "../../services/api";
import StatCard from "../../components/common/StatCard";
import { ADMIN_TABS, ROLE_LABELS } from "../../constants";

const AdminPage = ({ onLogout, userData }) => {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories"); // 'categories' | 
  
  // Long Làm: Đơn
  const [activeKitchenTab, setActiveKitchenTab] = useState("Tổng Quan");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const mockOrders = [
    { id: '#1001', store: 'CN Quận 1', timeIn: '09:30 AM', timeOut: '10:15 AM', qty: 150, status: 'Đang chế biến', driver: 'Nguyễn Văn A', note: 'Chia khoai tây làm 2 thùng xốp giúp mình nhé.' },
    { id: '#1002', store: 'CN Quận 3', timeIn: '09:35 AM', timeOut: '10:25 AM', qty: 80, status: 'Đã đóng gói', driver: 'Trần Văn B', note: 'Lấy thêm 5 tương cà.' },
    { id: '#1003', store: 'CN Gò Vấp', timeIn: '09:40 AM', timeOut: '10:30 AM', qty: 200, status: 'Chờ xử lý', driver: 'Chưa gán', note: '' },
    { id: '#1004', store: 'CN Quận 1', timeIn: '09:45 AM', timeOut: '10:00 AM', qty: 50, status: 'Đang chế biến', driver: 'Lê Văn C', note: 'Gấp nha bếp ơi.' },
    { id: '#1005', store: 'CN Quận 5', timeIn: '09:50 AM', timeOut: '10:45 AM', qty: 120, status: 'Chờ xử lý', driver: 'Chưa gán', note: '' },
  ];

 // STATE TÌM KIẾM & LỌC ĐƠN HÀNG
  const [orderSearchText, setOrderSearchText] = useState("");
  const [orderAppliedSearch, setOrderAppliedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Trạng thái");
  const [filterStore, setFilterStore] = useState("Cửa hàng");
  const [filterTime, setFilterTime] = useState("Thời gian");

  // Logic lọc "Siêu cấp": Kết hợp Text Search + 3 cái Dropdown
  const filteredOrders = mockOrders.filter((order) => {
    // 1. Lọc theo chữ (Từ khóa tìm kiếm)
    let matchText = true;
    if (orderAppliedSearch) {
      const lowerKeyword = orderAppliedSearch.toLowerCase();
      matchText = order.id.toLowerCase().includes(lowerKeyword) || 
                  order.store.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Trạng thái
    let matchStatus = true;
    if (filterStatus !== "Trạng thái") {
      matchStatus = order.status === filterStatus;
    }

    // 3. Lọc theo Cửa hàng
    let matchStore = true;
    if (filterStore !== "Cửa hàng") {
      matchStore = order.store === filterStore;
    }

    // 4. Lọc theo Thời gian (Phân biệt AM/PM)
    let matchTime = true;
    if (filterTime === "Ca sáng") {
      matchTime = order.timeIn.includes("AM");
    } else if (filterTime === "Ca chiều") {
      matchTime = order.timeIn.includes("PM");
    }

    // Trả về đơn hàng nào thỏa mãn TẤT CẢ các điều kiện trên
    return matchText && matchStatus && matchStore && matchTime;
  });

// Long Làm : Lịch giao
  const [selectedTrip, setSelectedTrip] = useState(null);
  const mockTrips = [
    { id: 'TR-001', driver: 'Nguyễn Văn A', phone: '0901234567', plate: '59A-123.45', store: 'CN Quận 1', orders: '#1001, #1004', startTime: '10:00 AM', eta: '10:30 AM', status: 'Đang giao' },
    { id: 'TR-002', driver: 'Trần Văn B', phone: '0912345678', plate: '59B-678.90', store: 'CN Quận 3', orders: '#1002', startTime: '10:15 AM', eta: '10:45 AM', status: 'Đang giao' },
    { id: 'TR-003', driver: 'Lê Văn C', phone: '0923456789', plate: '59C-111.22', store: 'CN Gò Vấp', orders: '#1003', startTime: '-', eta: '-', status: 'Chờ xuất phát' },
    { id: 'TR-004', driver: 'Phạm Văn D', phone: '0934567890', plate: '59D-333.44', store: 'CN Quận 5', orders: '#1005', startTime: '09:00 AM', eta: '09:40 AM', status: 'Hoàn thành' },
    { id: 'TR-005', driver: 'Hoàng Văn E', phone: '0945678901', plate: '59E-555.66', store: 'CN Quận 1', orders: '#1006', startTime: '09:30 AM', eta: '10:00 AM', status: 'Trễ giờ' },
  ];

  // STATE TÌM KIẾM & LỌC CHUYẾN XE (LỊCH GIAO)
  const [tripSearchText, setTripSearchText] = useState("");
  const [tripAppliedSearch, setTripAppliedSearch] = useState("");
  const [tripFilterStatus, setTripFilterStatus] = useState("Trạng thái chuyến");
  const [tripFilterStore, setTripFilterStore] = useState("Cửa hàng đến");

  // Logic lọc Chuyến xe
  const filteredTrips = mockTrips.filter((trip) => {
    // 1. Lọc theo chữ (Tìm theo Mã chuyến, Tên tài xế, hoặc Biển số xe)
    let matchText = true;
    if (tripAppliedSearch) {
      const lowerKeyword = tripAppliedSearch.toLowerCase();
      matchText = trip.id.toLowerCase().includes(lowerKeyword) || 
                  trip.driver.toLowerCase().includes(lowerKeyword) ||
                  trip.plate.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Trạng thái chuyến
    let matchStatus = true;
    if (tripFilterStatus !== "Trạng thái chuyến") {
      matchStatus = trip.status === tripFilterStatus;
    }

    // 3. Lọc theo Cửa hàng đến
    let matchStore = true;
    if (tripFilterStore !== "Cửa hàng đến") {
      matchStore = trip.store === tripFilterStore;
    }

    return matchText && matchStatus && matchStore;
  });

  // Long làm : xử lí sự cố
  const [selectedIncident, setSelectedIncident] = useState(null);
  const mockIncidents = [
    { id: '#INC-001', time: '10:15 AM - Hôm nay', type: 'Thiết bị', priority: 'Khẩn cấp', title: 'Lò chiên khu A không lên nhiệt', reporter: 'Bếp trưởng Tuấn', status: 'Mới' },
    { id: '#INC-002', time: '09:30 AM - Hôm nay', type: 'Nguyên liệu', priority: 'Cao', title: 'Lô cà chua nhập kho bị dập 5kg', reporter: 'Thủ kho', status: 'Đang xử lý' },
    { id: '#INC-003', time: '08:45 AM - Hôm nay', type: 'Hệ thống', priority: 'Khẩn cấp', title: 'Mất kết nối API với cửa hàng Q3', reporter: 'Hệ thống tự động', status: 'Mới' },
    { id: '#INC-004', time: '08:00 AM - Hôm nay', type: 'Vận chuyển', priority: 'Trung bình', title: 'Tài xế báo xe lủng lốp giữa đường', reporter: 'Điều phối viên', status: 'Đã giải quyết' },
    { id: '#INC-005', time: 'Hôm qua', type: 'Thiết bị', priority: 'Trung bình', title: 'Bóng đèn khu đóng gói bị nhấp nháy', reporter: 'NV Đóng gói', status: 'Mới' },
  ];

  // STATE TÌM KIẾM & LỌC SỰ CỐ
  const [incidentSearchText, setIncidentSearchText] = useState("");
  const [incidentAppliedSearch, setIncidentAppliedSearch] = useState("");
  const [filterIncidentType, setFilterIncidentType] = useState("Loại sự cố");
  const [filterIncidentPriority, setFilterIncidentPriority] = useState("Mức độ ưu tiên");

  // Logic lọc Sự cố (Incident)
  const filteredIncidents = mockIncidents.filter((inc) => {
    // 1. Lọc theo chữ (Tìm theo Mã SC, Người báo cáo, hoặc Tiêu đề)
    let matchText = true;
    if (incidentAppliedSearch) {
      const lowerKeyword = incidentAppliedSearch.toLowerCase();
      matchText = inc.id.toLowerCase().includes(lowerKeyword) || 
                  inc.reporter.toLowerCase().includes(lowerKeyword) ||
                  inc.title.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Loại sự cố
    let matchType = true;
    if (filterIncidentType !== "Loại sự cố") {
      matchType = inc.type === filterIncidentType;
    }

    // 3. Lọc theo Mức độ ưu tiên
    let matchPriority = true;
    if (filterIncidentPriority !== "Mức độ ưu tiên") {
      matchPriority = inc.priority === filterIncidentPriority;
    }

    return matchText && matchType && matchPriority;
  });
  // Long làm : Quản lí sản phẩm
  const [activeManagementTab, setActiveManagementTab] = useState("Bảng KPI");
  const [selectedMasterProduct, setSelectedMasterProduct] = useState(null);
  const mockMasterProducts = [
    { sku: 'KFC-GA-001', name: 'Gà rán miếng lớn', category: 'Gà rán', cogs: 15000, price: 25000, status: 'Đang bán', emoji: '🍗' },
    { sku: 'KFC-BU-001', name: 'Burger Zinger', category: 'Burger', cogs: 20000, price: 35000, status: 'Đang bán', emoji: '🍔' },
    { sku: 'KFC-DR-001', name: 'Pepsi cỡ vừa', category: 'Thức uống', cogs: 4000, price: 10000, status: 'Đang bán', emoji: '🥤' },
    { sku: 'KFC-SD-001', name: 'Khoai tây chiên', category: 'Ăn vặt', cogs: 8000, price: 15000, status: 'Tạm ngưng', emoji: '🍟' },
    { sku: 'KFC-IC-001', name: 'Kem Vani', category: 'Tráng miệng', cogs: 3000, price: 7000, status: 'Đang bán', emoji: '🍦' },
  ];

  // STATE TÌM KIẾM & LỌC SẢN PHẨM (MASTER DATA)
  const [productSearchText, setProductSearchText] = useState("");
  const [productAppliedSearch, setProductAppliedSearch] = useState("");
  const [filterProductCategory, setFilterProductCategory] = useState("Tất cả danh mục");
  const [filterProductStatus, setFilterProductStatus] = useState("Trạng thái");

  // Logic lọc Sản phẩm
  const filteredMasterProducts = mockMasterProducts.filter((prod) => {
    // 1. Lọc theo chữ (Mã SKU hoặc Tên sản phẩm)
    let matchText = true;
    if (productAppliedSearch) {
      const lowerKeyword = productAppliedSearch.toLowerCase();
      matchText = prod.sku.toLowerCase().includes(lowerKeyword) || 
                  prod.name.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Danh mục
    let matchCategory = true;
    if (filterProductCategory !== "Tất cả danh mục") {
      matchCategory = prod.category === filterProductCategory;
    }

    // 3. Lọc theo Trạng thái
    let matchStatus = true;
    if (filterProductStatus !== "Trạng thái") {
      matchStatus = prod.status === filterProductStatus;
    }

    return matchText && matchCategory && matchStatus;
  });

  // Long làm: Tổng quan tồn kho
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const mockInventory = [
    { sku: 'NL-GA-001', name: 'Thịt gà tươi nguyên con', category: 'Thịt / Cá', stock: 120, min: 50, unit: 'kg', status: 'An toàn' },
    { sku: 'NL-BO-002', name: 'Thịt bò nhập khẩu', category: 'Thịt / Cá', stock: 15, min: 20, unit: 'kg', status: 'Sắp hết' },
    { sku: 'NL-RA-001', name: 'Xà lách Đà Lạt', category: 'Rau củ', stock: 0, min: 10, unit: 'kg', status: 'Hết hàng' },
    { sku: 'NL-SO-001', name: 'Tương cà chua vị cay', category: 'Gia vị / Sốt', stock: 45, min: 50, unit: 'lít', status: 'Sắp hết' },
    { sku: 'BB-PK-001', name: 'Hộp giấy Kraft size L', category: 'Bao bì', stock: 2500, min: 1000, unit: 'hộp', status: 'An toàn' },
  ];

  // STATE TÌM KIẾM & LỌC TỔNG QUAN TỒN KHO
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [inventoryAppliedSearch, setInventoryAppliedSearch] = useState("");
  const [filterInventoryCategory, setFilterInventoryCategory] = useState("Tất cả danh mục");
  const [filterInventoryStatus, setFilterInventoryStatus] = useState("Cảnh báo tồn kho");

  // Logic lọc Tồn kho
  const filteredInventory = mockInventory.filter((item) => {
    // 1. Lọc theo chữ (Mã hàng hoặc Tên nguyên liệu)
    let matchText = true;
    if (inventoryAppliedSearch) {
      const lowerKeyword = inventoryAppliedSearch.toLowerCase();
      matchText = item.sku.toLowerCase().includes(lowerKeyword) || 
                  item.name.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Danh mục
    let matchCategory = true;
    if (filterInventoryCategory !== "Tất cả danh mục") {
      matchCategory = item.category === filterInventoryCategory;
    }

    // 3. Lọc theo Cảnh báo tình trạng
    let matchStatus = true;
    if (filterInventoryStatus === "Sắp hết hàng") {
      matchStatus = item.status === "Sắp hết";
    } else if (filterInventoryStatus === "Đã hết hàng") {
      matchStatus = item.status === "Hết hàng";
    }

    return matchText && matchCategory && matchStatus;
  });

  // Long làm : phân tích chi phí
  const mockCostStats = [
    { label: 'Tổng giá trị xuất kho (Tháng)', value: '1.2 Tỷ', change: '+5.2%', isUp: true },
    { label: 'Tổng chi phí vốn (COGS)', value: '850 Triệu', change: '+2.1%', isUp: false }, // Chi phí tăng là màu đỏ/cam
    { label: 'Biên lợi nhuận gộp', value: '29.1%', change: '-1.5%', isUp: false },
    { label: 'Chi phí hao hụt (Wastage)', value: '12.5 Triệu', change: '-5.0%', isUp: true }, // Hao hụt giảm là tốt (màu xanh)
  ];

  const topCostItems = [
    { sku: 'KFC-GA-001', name: 'Gà rán miếng lớn', category: 'Thịt / Cá', cogs: 15000, margin: '40%', trend: 'up' },
    { sku: 'KFC-BU-001', name: 'Burger Zinger', category: 'Thành phẩm', cogs: 20000, margin: '42%', trend: 'down' },
    { sku: 'KFC-SD-001', name: 'Khoai tây chiên', category: 'Ăn vặt', cogs: 8000, margin: '46%', trend: 'stable' },
    { sku: 'NL-BO-002', name: 'Thịt bò nhập khẩu', category: 'Thịt / Cá', cogs: 120000, margin: 'N/A', trend: 'up' },
    { sku: 'BB-PK-001', name: 'Hộp giấy Kraft size L', category: 'Bao bì', cogs: 1200, margin: 'N/A', trend: 'stable' },
  ];
  
  // Long làm : Báo cáo 
  const mockRecentReports = [
    { id: 'REP-1029', name: 'Báo cáo Doanh thu & Chi phí T2/2026', date: '25/02/2026 09:30', type: 'PDF', size: '2.4 MB', status: 'Sẵn sàng' },
    { id: 'REP-1028', name: 'Thống kê Hao hụt nguyên liệu Tuần 3', date: '24/02/2026 16:45', type: 'Excel', size: '1.1 MB', status: 'Sẵn sàng' },
    { id: 'REP-1027', name: 'Bảng kê Xuất kho chi nhánh Quận 1', date: '24/02/2026 10:15', type: 'Excel', size: '850 KB', status: 'Sẵn sàng' },
    { id: 'REP-1026', name: 'Báo cáo Tổng hợp Tồn kho cuối ngày', date: '23/02/2026 23:59', type: 'PDF', size: '3.0 MB', status: 'Đã lưu trữ' },
  ];

  // Long làm : quản lí công thức
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const mockRecipes = [
    {
      sku: 'KFC-GA-001', name: 'Gà rán miếng lớn', emoji: '🍗', category: 'Gà rán', estCost: 14500, status: 'Đã thiết lập',
      ingredients: [
        { id: 'NL-GA-001', name: 'Thịt gà tươi nguyên con', qty: 0.25, unit: 'kg', cost: 12000 },
        { id: 'NL-BO-001', name: 'Bột chiên xù', qty: 0.05, unit: 'kg', cost: 1500 },
        { id: 'NL-DA-001', name: 'Dầu ăn thực vật', qty: 0.05, unit: 'lít', cost: 1000 },
      ]
    },
    {
      sku: 'KFC-BU-001', name: 'Burger Zinger', emoji: '🍔', category: 'Burger', estCost: 19500, status: 'Đã thiết lập',
      ingredients: [
        { id: 'BB-BA-001', name: 'Vỏ bánh Burger', qty: 2, unit: 'cái', cost: 4000 },
        { id: 'NL-GA-002', name: 'Thịt gà phi lê', qty: 0.15, unit: 'kg', cost: 10000 },
        { id: 'NL-RA-001', name: 'Xà lách Đà Lạt', qty: 0.05, unit: 'kg', cost: 1500 },
        { id: 'NL-SO-002', name: 'Sốt Mayonnaise', qty: 0.02, unit: 'lít', cost: 4000 },
      ]
    },
    {
      sku: 'KFC-SD-001', name: 'Khoai tây chiên', emoji: '🍟', category: 'Ăn vặt', estCost: 0, status: 'Chưa có',
      ingredients: []
    }
  ];

  // STATE TÌM KIẾM & LỌC CÔNG THỨC (RECIPE / BOM)
  const [recipeSearchText, setRecipeSearchText] = useState("");
  const [recipeAppliedSearch, setRecipeAppliedSearch] = useState("");
  const [filterRecipeCategory, setFilterRecipeCategory] = useState("Tất cả danh mục");
  const [filterRecipeStatus, setFilterRecipeStatus] = useState("Trạng thái");

  // Logic lọc Công thức
  const filteredRecipes = mockRecipes.filter((recipe) => {
    // 1. Lọc theo chữ (Mã SKU hoặc Tên sản phẩm)
    let matchText = true;
    if (recipeAppliedSearch) {
      const lowerKeyword = recipeAppliedSearch.toLowerCase();
      matchText = recipe.sku.toLowerCase().includes(lowerKeyword) || 
                  recipe.name.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Danh mục
    let matchCategory = true;
    if (filterRecipeCategory !== "Tất cả danh mục") {
      matchCategory = recipe.category === filterRecipeCategory;
    }

    // 3. Lọc theo Trạng thái (Đã thiết lập hay chưa)
    let matchStatus = true;
    if (filterRecipeStatus === "Đã thiết lập BOM") {
      matchStatus = recipe.status === "Đã thiết lập";
    } else if (filterRecipeStatus === "Chưa có công thức") {
      matchStatus = recipe.status === "Chưa có";
    }

    return matchText && matchCategory && matchStatus;
  });

  //Long làm :SỔ QUỸ / HÓA ĐƠN
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const mockTransactions = [
    { id: 'GD-1001', date: '25/02/2026 10:30', type: 'Thu', category: 'Thanh toán đơn Franchise', ref: 'Đơn #1001 - CN Quận 1', amount: 3750000, method: 'Chuyển khoản', status: 'Hoàn thành' },
    { id: 'GD-1002', date: '25/02/2026 09:15', type: 'Chi', category: 'Nhập nguyên liệu', ref: 'HĐ NCC CP Foods', amount: 15000000, method: 'Công nợ', status: 'Chờ duyệt' },
    { id: 'GD-1003', date: '24/02/2026 15:45', type: 'Thu', category: 'Thanh toán đơn Franchise', ref: 'Đơn #0998 - CN Gò Vấp', amount: 8200000, method: 'Chuyển khoản', status: 'Hoàn thành' },
    { id: 'GD-1004', date: '24/02/2026 14:00', type: 'Chi', category: 'Chi phí vận hành', ref: 'Bảo trì lò chiên (Sự cố #INC-001)', amount: 2500000, method: 'Tiền mặt', status: 'Hoàn thành' },
    { id: 'GD-1005', date: '23/02/2026 11:20', type: 'Chi', category: 'Nhập bao bì', ref: 'HĐ NCC Nhựa Bình Minh', amount: 4500000, method: 'Chuyển khoản', status: 'Hoàn thành' },
  ];

  // STATE TÌM KIẾM & LỌC GIAO DỊCH (SỔ QUỸ / HÓA ĐƠN)
  const [transactionSearchText, setTransactionSearchText] = useState("");
  const [transactionAppliedSearch, setTransactionAppliedSearch] = useState("");
  const [filterTransactionType, setFilterTransactionType] = useState("Loại giao dịch");

  // Logic lọc Giao dịch (Thu/Chi)
  const filteredTransactions = mockTransactions.filter((tx) => {
    // 1. Lọc theo chữ (Mã GD, Tham chiếu hoặc Hạng mục)
    let matchText = true;
    if (transactionAppliedSearch) {
      const lowerKeyword = transactionAppliedSearch.toLowerCase();
      matchText = tx.id.toLowerCase().includes(lowerKeyword) || 
                  tx.ref.toLowerCase().includes(lowerKeyword) ||
                  tx.category.toLowerCase().includes(lowerKeyword);
    }

    // 2. Lọc theo Loại (Thu / Chi)
    let matchType = true;
    if (filterTransactionType === "Phiếu Thu") {
      matchType = tx.type === "Thu";
    } else if (filterTransactionType === "Phiếu Chi") {
      matchType = tx.type === "Chi";
    }

    return matchText && matchType;
  });
  //'products'
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "franchise",
    storeName: "",
    status: "active",
  });
  const [newStore, setNewStore] = useState({
    username: "",
    password: "",
    name: "",
    storeName: "",
    status: "active",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    min: "",
    emoji: "🥪",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c, p] = await Promise.all([
          api.getUsers(),
          api.getCategories(),
          api.getProducts(),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setCategories(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
      } catch (err) {
        console.error("Admin load:", err);
      }
    };
    load();
  }, []);

  const loadAdminData = async () => {
    try {
      const [u, c, p] = await Promise.all([
        api.getUsers(),
        api.getCategories(),
        api.getProducts(),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setCategories(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error("Admin load:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      window.alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newUser.role === "franchise" && !newUser.storeName) {
      window.alert("Vui lòng nhập tên cửa hàng!");
      return;
    }
    try {
      const existingUsers = await api.getUsers();
      if (existingUsers.find((u) => u.username === newUser.username)) {
        window.alert("Tên đăng nhập đã tồn tại!");
        return;
      }
      const user = {
        id: Date.now(),
        ...newUser,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      await api.saveUsers([...existingUsers, user]);
      await loadAdminData();
      setShowAddUser(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        role: "franchise",
        storeName: "",
        status: "active",
      });
      window.alert("✅ Thêm người dùng thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const existingUsers = await api.getUsers();
      const updatedUsers = existingUsers.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
<<<<<<< HEAD
          : u
=======
          : u,
>>>>>>> 84ecd4c (fix conflict)
      );
      await api.saveUsers(updatedUsers);
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không cập nhật được"));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      const existingUsers = await api.getUsers();
      await api.saveUsers(existingUsers.filter((u) => u.id !== userId));
      await loadAdminData();
      window.alert("✅ Đã xóa người dùng!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const existingUsers = await api.getUsers();
      const updatedUsers = existingUsers.map((u) => {
        if (u.id !== userId) return u;
        const updated = { ...u, role: newRole };
        if (newRole !== "franchise") updated.storeName = "";
        return updated;
      });
      await api.saveUsers(updatedUsers);
      await loadAdminData();
      window.alert("✅ Đã đổi vai trò!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không cập nhật được"));
    }
  };

  const handleAddStore = async () => {
    if (
      !newStore.username ||
      !newStore.password ||
      !newStore.name ||
      !newStore.storeName
    ) {
      window.alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    try {
      const existingUsers = await api.getUsers();
      if (existingUsers.find((u) => u.username === newStore.username)) {
        window.alert("Tên đăng nhập đã tồn tại!");
        return;
      }
      const user = {
        id: Date.now(),
        ...newStore,
        role: "franchise",
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      await api.saveUsers([...existingUsers, user]);
      await loadAdminData();
      setShowAddStore(false);
      setNewStore({
        username: "",
        password: "",
        name: "",
        storeName: "",
        status: "active",
      });
      window.alert("✅ Thêm cửa hàng thành công!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleSaveCategory = async () => {
    const name = (
      editingCategory ? editingCategory.name : newCategoryName
    ).trim();
    if (!name) {
      window.alert("Vui lòng nhập tên danh mục!");
      return;
    }
    try {
      const list = await api.getCategories();
      if (editingCategory) {
        const updated = list.map((c) =>
<<<<<<< HEAD
          c.id === editingCategory.id ? { ...c, name } : c
=======
          c.id === editingCategory.id ? { ...c, name } : c,
>>>>>>> 84ecd4c (fix conflict)
        );
        await api.saveCategories(updated);
        const prods = await api.getProducts();
        await api.saveProducts(
          prods.map((p) =>
<<<<<<< HEAD
            p.category === editingCategory.name ? { ...p, category: name } : p
          )
=======
            p.category === editingCategory.name ? { ...p, category: name } : p,
          ),
>>>>>>> 84ecd4c (fix conflict)
        );
        setEditingCategory(null);
        window.alert("✅ Đã cập nhật danh mục!");
      } else {
        if (list.some((c) => c.name === name)) {
          window.alert("Danh mục này đã tồn tại!");
          return;
        }
        await api.saveCategories([...list, { id: "cat" + Date.now(), name }]);
        setNewCategoryName("");
        setShowAddCategory(false);
        window.alert("✅ Thêm danh mục thành công!");
      }
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteCategory = async (cat) => {
    const prods = await api.getProducts();
    const inCat = prods.filter((p) => p.category === cat.name);
    if (inCat.length > 0) {
      window.alert(
<<<<<<< HEAD
        `Không thể xóa. Còn ${inCat.length} sản phẩm thuộc danh mục "${cat.name}". Hãy đổi danh mục sản phẩm trước.`
=======
        `Không thể xóa. Còn ${inCat.length} sản phẩm thuộc danh mục "${cat.name}". Hãy đổi danh mục sản phẩm trước.`,
>>>>>>> 84ecd4c (fix conflict)
      );
      return;
    }
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      const list = await api.getCategories();
      await api.saveCategories(list.filter((c) => c.id !== cat.id));
      await loadAdminData();
      window.alert("✅ Đã xóa danh mục!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const handleSaveProduct = async () => {
    const p = editingProduct || newProduct;
    const name = (p.name || "").trim();
    const category = (p.category || "").trim();
    const price = parseInt(p.price, 10);
    const stock = parseInt(p.stock, 10);
    const min = parseInt(p.min, 10);
    if (
      !name ||
      !category ||
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(stock) ||
      stock < 0 ||
      Number.isNaN(min) ||
      min < 0
    ) {
      window.alert(
<<<<<<< HEAD
        "Vui lòng điền đầy đủ thông tin hợp lệ (tên, danh mục, giá, tồn kho, min)."
=======
        "Vui lòng điền đầy đủ thông tin hợp lệ (tên, danh mục, giá, tồn kho, min).",
>>>>>>> 84ecd4c (fix conflict)
      );
      return;
    }
    try {
      const list = await api.getProducts();
      if (editingProduct) {
        const updated = list.map((x) =>
          x.id === editingProduct.id
            ? {
                ...editingProduct,
                name,
                category,
                price,
                stock,
                min,
                emoji: p.emoji || "🥪",
              }
<<<<<<< HEAD
            : x
=======
            : x,
>>>>>>> 84ecd4c (fix conflict)
        );
        await api.saveProducts(updated);
        setEditingProduct(null);
        window.alert("✅ Đã cập nhật sản phẩm!");
      } else {
        const maxNum = list.reduce((acc, x) => {
          const n = parseInt(String(x.id).replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? acc : Math.max(acc, n);
        }, 0);
        const id = "P" + String(maxNum + 1).padStart(3, "0");
        await api.saveProducts([
          ...list,
          { id, name, category, price, stock, min, emoji: p.emoji || "🥪" },
        ]);
        setShowAddProduct(false);
        setNewProduct({
          name: "",
          category: "",
          price: "",
          stock: "",
          min: "",
          emoji: "🥪",
        });
        window.alert("✅ Thêm sản phẩm thành công!");
      }
      await loadAdminData();
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không lưu được"));
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    try {
      const list = await api.getProducts();
      await api.saveProducts(list.filter((p) => p.id !== product.id));
      await loadAdminData();
      window.alert("✅ Đã xóa sản phẩm!");
    } catch (err) {
      window.alert("Lỗi: " + (err.message || "Không xóa được"));
    }
  };

  const franchiseStores = users.filter((u) => u.role === "franchise");

  const adminStats = [
    {
      label: "Tổng người dùng",
      value: users.length.toString(),
      change: "",
      icon: Users,
      color: "ck-icon-box-blue",
    },
    {
      label: "Đang hoạt động",
      value: users.filter((u) => u.status === "active").length.toString(),
      change: "",
      icon: CheckCircle,
      color: "ck-icon-box-green",
    },
    {
      label: "Nhân viên CH",
      value: users.filter((u) => u.role === "franchise").length.toString(),
      change: "",
      icon: Store,
      color: "ck-icon-box-purple",
    },
    {
      label: "Quản trị viên",
      value: users.filter((u) => u.role === "admin").length.toString(),
      change: "",
      icon: Shield,
      color: "ck-icon-box-red",
    },
  ];

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg">
            <Shield className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">
              Quản trị hệ thống
            </h1>
            <p className="ck-text-xs ck-text-gray-400 ck-mono">
              {userData.name} - Admin
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ck-btn ck-flex ck-items-center ck-gap-2 ck-px-4 ck-py-2 ck-bg-red-500-20 ck-text-red-400 ck-rounded-xl ck-font-semibold"
          style={{ border: "none" }}
          onClick={onLogout}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </header>

      <main className="ck-p-8">
        <div
          className="ck-max-w-7xl"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="ck-flex ck-gap-2 ck-mb-8 ck-flex-wrap">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`ck-btn ck-px-5 ck-py-3 ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2 ${
                    adminTab === tab.id
                      ? "ck-bg-gradient-btn-admin ck-text-white"
                      : "ck-bg-gray-800 ck-text-gray-400"
                  }`}
                  style={
                    adminTab !== tab.id
                      ? { border: "1px solid var(--ck-border)" }
                      : {}
                  }
                  onClick={() => setAdminTab(tab.id)}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {adminTab === "dashboard" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">
                Dashboard Admin
              </h2>
              <div className="ck-grid-4 ck-gap-6 ck-mb-10">
                {adminStats.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Quản lý người dùng
                  </h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    onClick={() => setShowAddUser(true)}
                  >
                    <UserPlus size={18} />
                    Thêm người dùng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Tên đăng nhập</th>
                        <th>Họ tên</th>
                        <th>Vai trò</th>
                        <th>Địa điểm</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <p className="ck-font-bold ck-text-white ck-mono">
                              {user.username}
                            </p>
                            <p className="ck-text-xs ck-text-gray-500">
                              ID: {user.id}
                            </p>
                          </td>
                          <td>
                            <div className="ck-flex ck-items-center ck-gap-3">
                              <div className="ck-avatar">
                                {user.name.charAt(0)}
                              </div>
                              <span className="ck-font-semibold ck-text-white">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            {user.id === userData.id ? (
                              <span className="ck-text-gray-400">
                                {ROLE_LABELS[user.role]}
                              </span>
                            ) : (
                              <select
                                className="ck-select ck-px-3 ck-py-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-lg ck-text-sm"
                                value={user.role}
                                onChange={(e) =>
                                  handleChangeRole(user.id, e.target.value)
                                }
                              >
<<<<<<< HEAD
                                <option value="admin">Quản trị viên</option>
=======
>>>>>>> 84ecd4c (fix conflict)
                                <option value="franchise">
                                  Nhân viên cửa hàng
                                </option>
                                <option value="kitchen">Nhân viên bếp</option>
                                <option value="coordinator">
                                  Điều phối viên
                                </option>
                                <option value="manager">Quản lý</option>
                              </select>
                            )}
                          </td>
                          <td className="ck-text-gray-400">
                            {user.storeName || "-"}
                          </td>
                          <td className="ck-text-center">
                            <button
                              type="button"
                              className={`ck-btn ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${
                                user.status === "active"
                                  ? "ck-bg-green-500-20 ck-text-green-400"
                                  : "ck-bg-gray-500-20 ck-text-gray-400"
                              }`}
                              style={{ border: "none" }}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.status === "active"
                                ? "✓ Hoạt động"
                                : "✗ Vô hiệu"}
                            </button>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg"
                                style={{ background: "none", border: "none" }}
                                onClick={() => handleToggleStatus(user.id)}
                                title={
                                  user.status === "active"
                                    ? "Vô hiệu hóa"
                                    : "Kích hoạt"
                                }
                              >
                                {user.status === "active" ? (
                                  <XCircle
                                    size={18}
                                    className="ck-text-yellow-400"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={18}
                                    className="ck-text-green-400"
                                  />
                                )}
                              </button>
                              {user.role !== "admin" && (
                                <button
                                  type="button"
                                  className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                  style={{ border: "none" }}
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Xóa"
                                >
                                  <Trash2
                                    size={18}
                                    className="ck-text-red-400"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminTab === "franchise" && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">
                Quản lý danh mục cửa hàng franchise
              </h2>
              <p className="ck-text-gray-400 ck-mb-6">
                Danh sách cửa hàng franchise và tài khoản nhân viên cửa hàng.
              </p>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">
                    Danh sách cửa hàng
                  </h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    onClick={() => setShowAddStore(true)}
                  >
                    <Plus size={18} />
                    Thêm cửa hàng
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên cửa hàng</th>
                        <th>Người phụ trách</th>
                        <th>Tên đăng nhập</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchiseStores.map((user, idx) => (
                        <tr key={user.id}>
                          <td className="ck-text-gray-400">{idx + 1}</td>
                          <td className="ck-font-semibold ck-text-white">
                            {user.storeName || "-"}
                          </td>
                          <td className="ck-text-gray-400">{user.name}</td>
                          <td className="ck-mono ck-text-gray-400">
                            {user.username}
                          </td>
                          <td className="ck-text-center">
                            <span
                              className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${
                                user.status === "active"
                                  ? "ck-bg-green-500-20 ck-text-green-400"
                                  : "ck-bg-gray-500-20 ck-text-gray-400"
                              }`}
                            >
                              {user.status === "active"
                                ? "Hoạt động"
                                : "Vô hiệu"}
                            </span>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                style={{ border: "none" }}
                                onClick={() => handleToggleStatus(user.id)}
                                title={
                                  user.status === "active"
                                    ? "Vô hiệu hóa"
                                    : "Kích hoạt"
                                }
                              >
                                {user.status === "active" ? (
                                  <XCircle size={18} />
                                ) : (
                                  <CheckCircle size={18} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                style={{ border: "none" }}
                                onClick={() => handleDeleteUser(user.id)}
                                title="Xóa"
                              >
                                <Trash2 size={18} className="ck-text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {franchiseStores.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có cửa hàng franchise. Bấm &quot;Thêm cửa hàng&quot; để
                    tạo.
                  </div>
                )}
              </div>
            </>
          )}

         {adminTab === "kitchen" && (
  <div className="ck-flex ck-gap-6 ck-w-full" style={{ minHeight: '700px' }}>
    
    {/* ===== LEFT SIDEBAR (20%) ===== */}
    <div 
      className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col ck-justify-between" 
      style={{ width: '20%' }}
    >
      <ul className="ck-space-y-2" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {['Tổng Quan', 'Đơn', 'Lịch giao', 'Xử lý sự cố'].map((item, idx) => (
          <li key={idx}>
            <button 
              type="button"
              onClick={() => {
                setActiveKitchenTab(item);
                setSelectedOrder(null); // Đóng panel chi tiết khi chuyển tab
              }}
              className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${
                activeKitchenTab === item 
                  ? "ck-bg-orange-500-20 ck-text-orange-400" 
                  : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
              }`}
              style={activeKitchenTab !== item ? { border: 'none', background: 'transparent' } : { border: 'none' }}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>

      <div className="ck-flex ck-items-center ck-gap-3 ck-pt-4 ck-border-t ck-border-gray-700">
        <div className="ck-w-10 ck-h-10 ck-bg-gradient-btn-admin ck-rounded-full ck-flex ck-items-center ck-justify-center ck-text-white ck-font-bold">
          {userData?.name ? userData.name.charAt(0) : "U"}
        </div>
        <div className="ck-overflow-hidden">
          <p className="ck-text-sm ck-font-bold ck-text-white ck-truncate">
            {userData?.name || "Tên Nhân Viên"}
          </p>
          <p className="ck-text-xs ck-text-gray-400">Admin</p>
        </div>
      </div>
    </div>

    {/* ===== RIGHT CONTENT (80%) ===== */}
    <div className="ck-flex ck-flex-col ck-gap-6" style={{ width: '80%' }}>
      
      {/* ----------------- TAB TỔNG QUAN (GIỮ NGUYÊN CODE CŨ CỦA BẠN) ----------------- */}
      {activeKitchenTab === 'Tổng Quan' && (
        <div className="ck-flex ck-flex-col ck-gap-6">
          {/* 1. Thống kê 4 block */}
          <div className="ck-grid ck-grid-cols-4 ck-gap-4">
            {[
              { label: 'Tổng xuất ăn cần làm', value: '124', color: 'ck-text-blue-400' },
              { label: 'Đang chế biến', value: '45', color: 'ck-text-orange-400' },
              { label: 'Đã đóng gói / Sẵn sàng', value: '70', color: 'ck-text-green-400' },
              { label: 'Hao hụt / Hỏng', value: '9', color: 'ck-text-red-400' }
            ].map((stat, idx) => (
              <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl">
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
                <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* 2. Khu vực Cảnh Báo */}
          <div>
            <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-3 ck-flex ck-items-center ck-gap-2">
              <span className="ck-w-2 ck-h-2 ck-bg-red-500 ck-rounded-full ck-animate-pulse ck-inline-block"></span>
              Cảnh Báo
            </h3>
            <div className="ck-grid ck-grid-cols-3 ck-gap-4">
              <div className="ck-bg-red-500-20 ck-border ck-border-red-500-50 ck-p-4 ck-rounded-xl ck-flex ck-items-center ck-justify-between">
                <span className="ck-text-red-400 ck-font-bold">Thiếu nguyên liệu</span>
                <span className="ck-text-red-400 ck-font-black ck-text-xl">3</span>
              </div>
              <div className="ck-bg-yellow-500-20 ck-border ck-border-yellow-500-50 ck-p-4 ck-rounded-xl ck-flex ck-items-center ck-justify-between">
                <span className="ck-text-yellow-400 ck-font-bold">Thiết bị trục trặc</span>
                <span className="ck-text-yellow-400 ck-font-black ck-text-xl">1</span>
              </div>
              <div className="ck-bg-orange-500-20 ck-border ck-border-orange-500-50 ck-p-4 ck-rounded-xl ck-flex ck-items-center ck-justify-between">
                <span className="ck-text-orange-400 ck-font-bold">Order gấp...</span>
                <span className="ck-text-orange-400 ck-font-black ck-text-xl">5</span>
              </div>
            </div>
          </div>

          {/* 3. Danh sách đơn hàng & Lịch giao hàng */}
          <div className="ck-grid ck-grid-cols-3 ck-gap-6">
            <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
              <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                <h3 className="ck-text-xl ck-font-bold ck-text-white">Danh sách đơn hàng</h3>
                <button className="ck-text-sm ck-text-gray-400 hover:ck-text-white ck-underline" style={{ border: 'none', background: 'transparent' }}>
                  Xem tất cả
                </button>
              </div>
              <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-p-2 ck-overflow-y-auto ck-scrollbar" style={{ maxHeight: '350px' }}>
                <div className="ck-space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div key={item} className="ck-bg-gray-800 ck-p-4 ck-rounded-lg ck-border ck-border-gray-700">
                      <div className="ck-flex ck-justify-between ck-mb-2">
                        <span className="ck-font-bold ck-text-white">Đơn hàng #{1000 + item}</span>
                        <span className="ck-text-orange-400 ck-text-sm ck-font-semibold">Đang chế biến</span>
                      </div>
                      <p className="ck-text-sm ck-text-gray-400">2x Gà rán, 1x Khoai tây chiên, 1x Pepsi</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
              <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-4">Lịch Giao Hàng</h3>
              <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-p-2 ck-overflow-y-auto ck-scrollbar" style={{ maxHeight: '350px' }}>
                <div className="ck-space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="ck-bg-gray-800 ck-p-3 ck-rounded-lg ck-border ck-border-gray-700">
                      <div className="ck-text-white ck-font-semibold ck-text-sm">Tài xế Nguyễn Văn A</div>
                      <div className="ck-text-gray-400 ck-text-xs ck-mt-1">Giao lúc: 10:{item}5 AM</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Khu vực Quản lý Danh mục & Sản phẩm */}
          <div className="ck-mt-4 ck-pt-6 ck-border-t ck-border-gray-700">
            <h2 className="ck-text-2xl ck-font-black ck-text-white ck-mb-2">Cài đặt & Quản lý Kho</h2>
            <p className="ck-text-gray-400 ck-mb-6">Danh mục sản phẩm và sản phẩm do bếp trung tâm cung cấp.</p>

            <div className="ck-flex ck-gap-2 ck-mb-6">
              <button
                type="button"
                className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                  kitchenSubTab === "categories" ? "ck-bg-orange-500-20 ck-text-orange-400" : "ck-bg-gray-800 ck-text-gray-400"
                }`}
                style={kitchenSubTab !== "categories" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}
                onClick={() => setKitchenSubTab("categories")}
              >
                Danh mục sản phẩm
              </button>
              <button
                type="button"
                className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${
                  kitchenSubTab === "products" ? "ck-bg-orange-500-20 ck-text-orange-400" : "ck-bg-gray-800 ck-text-gray-400"
                }`}
                style={kitchenSubTab !== "products" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}
                onClick={() => setKitchenSubTab("products")}
              >
                Sản phẩm bếp trung tâm
              </button>
            </div>

            {kitchenSubTab === "categories" && (
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">Danh mục sản phẩm</h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    style={{ border: "none" }}
                    onClick={() => {
                      setShowAddCategory(true);
                      setEditingCategory(null);
                      setNewCategoryName("");
                    }}
                  >
                    <Plus size={18} /> Thêm danh mục
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên danh mục</th>
                        <th>Số sản phẩm</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => (
                        <tr key={cat.id}>
                          <td className="ck-text-gray-400">{idx + 1}</td>
                          <td className="ck-font-semibold ck-text-white">{cat.name}</td>
                          <td className="ck-text-gray-400">
                            {products.filter((p) => p.category === cat.name).length}
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                style={{ border: "none" }}
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setShowAddCategory(true);
                                  setNewCategoryName(cat.name);
                                }}
                                title="Sửa"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                style={{ border: "none" }}
                                onClick={() => handleDeleteCategory(cat)}
                                title="Xóa"
                              >
                                <Trash2 size={18} className="ck-text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {categories.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có danh mục. Bấm &quot;Thêm danh mục&quot; để tạo.
                  </div>
                )}
              </div>
            )}

            {kitchenSubTab === "products" && (
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">Sản phẩm bếp trung tâm</h3>
                  <button
                    type="button"
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                    style={{ border: "none" }}
                    onClick={() => {
                      setShowAddProduct(true);
                      setEditingProduct(null);
                      setNewProduct({ name: "", category: categories[0]?.name || "", price: "", stock: "", min: "", emoji: "🥪" });
                    }}
                  >
                    <Plus size={18} /> Thêm sản phẩm
                  </button>
                </div>
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá (₫)</th>
                        <th>Tồn kho</th>
                        <th>Min</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="ck-mono ck-text-gray-400">{p.id}</td>
                          <td>
                            <span className="ck-font-semibold ck-text-white">{p.emoji} {p.name}</span>
                          </td>
                          <td className="ck-text-gray-400">{p.category}</td>
                          <td className="ck-mono ck-text-gray-400">{Number(p.price).toLocaleString()}</td>
                          <td className="ck-text-gray-400">{p.stock}</td>
                          <td className="ck-text-gray-400">{p.min}</td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white"
                                style={{ border: "none" }}
                                onClick={() => {
                                  setEditingProduct(p);
                                  setShowAddProduct(true);
                                  setNewProduct({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), min: String(p.min), emoji: p.emoji || "🥪" });
                                }}
                                title="Sửa"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                type="button"
                                className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20"
                                style={{ border: "none" }}
                                onClick={() => handleDeleteProduct(p)}
                                title="Xóa"
                              >
                                <Trash2 size={18} className="ck-text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {products.length === 0 && (
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">
                    Chưa có sản phẩm. Bấm &quot;Thêm sản phẩm&quot; để tạo.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB ĐƠN HÀNG ----------------- */}
      {activeKitchenTab === 'Đơn' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
          
          {/* 1. Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search đã ép cứng màu tối và chống méo nút */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm mã đơn, cửa hàng..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }} /* ÉP CỨNG màu nền tối để trình duyệt không tự bôi trắng */
                defaultValue={orderSearchText}
                onChange={(e) => setOrderSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setOrderAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setOrderAppliedSearch(orderSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Các Select Box đã gắn State */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Trạng thái">Trạng thái</option>
              <option value="Chờ xử lý">Chờ xử lý</option>
              <option value="Đang chế biến">Đang chế biến</option>
              <option value="Đã đóng gói">Đã đóng gói</option>
            </select>
            
            <select 
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Cửa hàng">Cửa hàng</option>
              <option value="CN Quận 1">CN Quận 1</option>
              <option value="CN Quận 3">CN Quận 3</option>
              <option value="CN Gò Vấp">CN Gò Vấp</option>
              <option value="CN Quận 5">CN Quận 5</option>
            </select>
            
            <select 
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Thời gian">Thời gian</option>
              <option value="Ca sáng">Ca sáng</option>
              <option value="Ca chiều">Ca chiều</option>
            </select>
          </div>

          {/* 2. Khu vực hiển thị Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* --- KHUNG BẢNG DANH SÁCH --- */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedOrder ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã Đơn</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Cửa hàng</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Giờ đặt</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Cần giao</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">SL</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* ĐỔI MOCKORDERS THÀNH FILTEREDORDERS Ở ĐÂY */}
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedOrder(order)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedOrder?.id === order.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-bold">{order.id}</td>
                        <td className="ck-py-4 ck-px-4">{order.store}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-gray-400">{order.timeIn}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-semibold ck-text-orange-400">{order.timeOut}</td>
                        <td className="ck-py-4 ck-px-4">{order.qty}</td>
                        <td className="ck-py-4 ck-px-4">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            order.status === 'Đang chế biến' ? 'ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50' : 
                            order.status === 'Đã đóng gói' ? 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50' : 
                            'ck-bg-gray-700 ck-text-gray-300 ck-border-gray-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy đơn hàng nào phù hợp với "{orderAppliedSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- NGĂN KÉO CHI TIẾT BÊN PHẢI (GIỮ NGUYÊN) --- */}
            {selectedOrder && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết {selectedOrder.id}</h3>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="ck-space-y-4 ck-text-sm">
                  <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                    <span className="ck-text-gray-400">Giao đến:</span>
                    <span className="ck-text-white ck-font-semibold">{selectedOrder.store}</span>
                  </div>
                  <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                    <span className="ck-text-gray-400">Tài xế:</span>
                    <span className="ck-text-white ck-font-semibold">{selectedOrder.driver}</span>
                  </div>

                  <div className="ck-pt-2">
                    <span className="ck-text-gray-400 ck-block ck-mb-2">Danh sách món:</span>
                    <ul className="ck-text-white ck-space-y-2 ck-bg-gray-800 ck-p-3 ck-rounded-lg">
                      <li>• 50 x Gà rán miếng lớn</li>
                      <li>• 20kg x Khoai tây cắt sẵn</li>
                      <li>• 10L x Nước sốt cay</li>
                    </ul>
                  </div>

                  {selectedOrder.note && (
                    <div className="ck-pt-2">
                      <span className="ck-text-orange-400 ck-block ck-mb-2 ck-font-semibold">Ghi chú từ chi nhánh:</span>
                      <p className="ck-text-gray-300 ck-italic ck-bg-orange-500-20 ck-p-3 ck-rounded-lg ck-border ck-border-orange-500-50">
                        "{selectedOrder.note}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="ck-mt-6 ck-flex ck-gap-3">
                  <button className="ck-flex-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    🖨️ In phiếu
                  </button>
                  <button className="ck-flex-1 ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    Cập nhật
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- TAB LỊCH GIAO ----------------- */}
      {activeKitchenTab === 'Lịch giao' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
          
          {/* 1. Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối và có nút Tìm kiếm */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm mã chuyến, tài xế, biển số..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={tripSearchText}
                onChange={(e) => setTripSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setTripAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setTripAppliedSearch(tripSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Các Dropdown đã gắn State */}
            <select 
              value={tripFilterStatus}
              onChange={(e) => setTripFilterStatus(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Trạng thái chuyến">Trạng thái chuyến</option>
              <option value="Chờ xuất phát">Chờ xuất phát</option>
              <option value="Đang giao">Đang giao</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Trễ giờ">Trễ giờ</option>
            </select>
            
            <select 
              value={tripFilterStore}
              onChange={(e) => setTripFilterStore(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Cửa hàng đến">Cửa hàng đến</option>
              <option value="CN Quận 1">CN Quận 1</option>
              <option value="CN Quận 3">CN Quận 3</option>
              <option value="CN Gò Vấp">CN Gò Vấp</option>
              <option value="CN Quận 5">CN Quận 5</option>
            </select>
            
            <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0" style={{ border: 'none' }}>
              + Điều phối xe
            </button>
          </div>

          {/* 2. Khu vực hiển thị Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* --- KHUNG BẢNG DANH SÁCH CHUYẾN --- */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedTrip ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã Chuyến</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Tài xế</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Điểm đến</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Gồm các đơn</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Bắt đầu</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Dự kiến đến</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED TRIPS Ở ĐÂY */}
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedTrip(trip)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedTrip?.id === trip.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-bold">{trip.id}</td>
                        <td className="ck-py-4 ck-px-4">
                          <span className="ck-block ck-font-semibold">{trip.driver}</span>
                          <span className="ck-text-xs ck-text-gray-400">{trip.plate}</span>
                        </td>
                        <td className="ck-py-4 ck-px-4">{trip.store}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-300">{trip.orders}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-gray-400">{trip.startTime}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-semibold ck-text-orange-400">{trip.eta}</td>
                        <td className="ck-py-4 ck-px-4">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            trip.status === 'Đang giao' ? 'ck-bg-blue-500-20 ck-text-blue-400 ck-border-blue-500-50' : 
                            trip.status === 'Chờ xuất phát' ? 'ck-bg-yellow-500-20 ck-text-yellow-400 ck-border-yellow-500-50' : 
                            trip.status === 'Trễ giờ' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' :
                            'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy chuyến xe nào phù hợp với "{tripAppliedSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- NGĂN KÉO CHI TIẾT CHUYẾN XE (GIỮ NGUYÊN) --- */}
            {selectedTrip && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết {selectedTrip.id}</h3>
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="ck-space-y-4 ck-text-sm">
                  {/* Info Tài xế */}
                  <div className="ck-bg-gray-800 ck-p-4 ck-rounded-xl ck-border ck-border-gray-700">
                    <div className="ck-flex ck-items-center ck-gap-3 ck-mb-3">
                      <div className="ck-w-10 ck-h-10 ck-bg-gray-700 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-text-white ck-font-bold">
                        {selectedTrip.driver.charAt(0)}
                      </div>
                      <div>
                        <p className="ck-text-white ck-font-bold">{selectedTrip.driver}</p>
                        <p className="ck-text-xs ck-text-gray-400">SĐT: {selectedTrip.phone}</p>
                      </div>
                    </div>
                    <div className="ck-flex ck-justify-between ck-border-t ck-border-gray-700 ck-pt-2">
                      <span className="ck-text-gray-400">Biển số:</span>
                      <span className="ck-text-white ck-font-semibold">{selectedTrip.plate}</span>
                    </div>
                  </div>

                  <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                    <span className="ck-text-gray-400">Giao đến:</span>
                    <span className="ck-text-white ck-font-semibold">{selectedTrip.store}</span>
                  </div>

                  {/* Danh sách các đơn trong chuyến */}
                  <div className="ck-pt-2">
                    <span className="ck-text-gray-400 ck-block ck-mb-2">Giao các đơn hàng:</span>
                    <div className="ck-flex ck-flex-wrap ck-gap-2">
                      {selectedTrip.orders.split(', ').map((ord, i) => (
                        <span key={i} className="ck-bg-orange-500-20 ck-text-orange-400 ck-px-3 ck-py-1 ck-rounded-lg ck-font-bold ck-border ck-border-orange-500-50">
                          {ord}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ck-mt-6 ck-flex ck-gap-3">
                  <button className="ck-flex-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    📞 Gọi tài xế
                  </button>
                  <button className="ck-flex-1 ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    Cập nhật
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- TAB XỬ LÝ SỰ CỐ ----------------- */}
      {activeKitchenTab === 'Xử lý sự cố' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
          
          {/* 1. Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-red-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm mã sự cố, người báo cáo..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={incidentSearchText}
                onChange={(e) => setIncidentSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIncidentAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setIncidentAppliedSearch(incidentSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-red-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            <select 
              value={filterIncidentType}
              onChange={(e) => setFilterIncidentType(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Loại sự cố">Loại sự cố</option>
              <option value="Thiết bị">Thiết bị</option>
              <option value="Nguyên liệu">Nguyên liệu</option>
              <option value="Hệ thống / App">Hệ thống / App</option>
              <option value="Vận chuyển">Vận chuyển</option>
            </select>
            
            <select 
              value={filterIncidentPriority}
              onChange={(e) => setFilterIncidentPriority(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Mức độ ưu tiên">Mức độ ưu tiên</option>
              <option value="Khẩn cấp">Khẩn cấp</option>
              <option value="Cao">Cao</option>
              <option value="Trung bình">Trung bình</option>
            </select>

            <button className="ck-btn ck-px-4 ck-py-2 ck-bg-red-500-20 ck-text-red-400 ck-rounded-xl ck-font-bold ck-flex-shrink-0" style={{ border: '1px solid rgba(239, 68, 68, 0.5)' }}>
              + Báo cáo sự cố mới
            </button>
          </div>

          {/* 2. Khu vực hiển thị Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* --- KHUNG BẢNG DANH SÁCH SỰ CỐ --- */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedIncident ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã SC</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Thời gian</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Phân loại</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mô tả ngắn</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Mức độ</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED INCIDENTS Ở ĐÂY */}
                  {filteredIncidents.length > 0 ? (
                    filteredIncidents.map((inc, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedIncident(inc)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedIncident?.id === inc.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-red-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-bold">{inc.id}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-gray-400">{inc.time}</td>
                        <td className="ck-py-4 ck-px-4">{inc.type}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-semibold ck-truncate ck-max-w-xs">{inc.title}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-center">
                          {inc.priority === 'Khẩn cấp' && <span className="ck-text-red-500 ck-font-black">🔴 Khẩn cấp</span>}
                          {inc.priority === 'Cao' && <span className="ck-text-orange-400 ck-font-bold">🟠 Cao</span>}
                          {inc.priority === 'Trung bình' && <span className="ck-text-yellow-500 ck-font-semibold">🟡 TB</span>}
                        </td>
                        <td className="ck-py-4 ck-px-4">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            inc.status === 'Mới' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' : 
                            inc.status === 'Đang xử lý' ? 'ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50' : 
                            'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy sự cố nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- NGĂN KÉO CHI TIẾT SỰ CỐ (GIỮ NGUYÊN) --- */}
            {selectedIncident && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-4">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết {selectedIncident.id}</h3>
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="ck-space-y-4 ck-text-sm">
                  {/* Cảnh báo đỏ nếu khẩn cấp */}
                  {selectedIncident.priority === 'Khẩn cấp' && (
                    <div className="ck-bg-red-500-20 ck-border ck-border-red-500-50 ck-p-3 ck-rounded-lg ck-text-red-400 ck-font-bold ck-flex ck-items-center ck-gap-2">
                      <span className="ck-animate-pulse">⚠️</span> CẦN XỬ LÝ NGAY LẬP TỨC
                    </div>
                  )}

                  <div>
                    <span className="ck-text-gray-400 ck-block ck-mb-1">Vấn đề:</span>
                    <p className="ck-text-white ck-font-bold ck-text-lg">{selectedIncident.title}</p>
                  </div>

                  <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                    <span className="ck-text-gray-400">Người báo cáo:</span>
                    <span className="ck-text-white ck-font-semibold">{selectedIncident.reporter}</span>
                  </div>

                  <div className="ck-flex ck-justify-between ck-border-b ck-border-gray-700 ck-pb-2">
                    <span className="ck-text-gray-400">Phân loại:</span>
                    <span className="ck-text-white ck-font-semibold">{selectedIncident.type}</span>
                  </div>

                  {/* Vùng mô tả chi tiết */}
                  <div className="ck-pt-2">
                    <span className="ck-text-gray-400 ck-block ck-mb-2">Mô tả chi tiết:</span>
                    <p className="ck-text-gray-300 ck-bg-gray-800 ck-p-3 ck-rounded-lg">
                      Phát hiện lúc {selectedIncident.time}. Hệ thống báo lỗi tự động. Yêu cầu bộ phận kỹ thuật / bảo trì kiểm tra và khắc phục để không ảnh hưởng đến tiến độ giao hàng.
                    </p>
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="ck-mt-6 ck-flex ck-flex-col ck-gap-3">
                  {selectedIncident.status !== 'Đã giải quyết' && (
                    <button className="ck-w-full ck-bg-red-500 hover:ck-bg-red-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                      🔧 Tiếp nhận xử lý
                    </button>
                  )}
                  <button className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors ck-cursor-pointer">
                    Đóng sự cố (Đã khắc phục xong)
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  </div>
)}
{/* ===== TAB QUẢN LÝ (MANAGEMENT) ===== */}
        {adminTab === "management" && (
  <div className="ck-flex ck-gap-6 ck-w-full ck-animate-fade-in" style={{ minHeight: '800px' }}>
    
    {/* ===== LEFT SIDEBAR (20%) ===== */}
    <div 
      className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" 
      style={{ width: '20%' }}
    >
      <ul className="ck-space-y-2 ck-flex-1" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {[
          'Bảng KPI', 
          'Quản lý sản phẩm', 
          'Tổng quan tồn kho', 
          'Phân tích chi phí', 
          'Báo cáo', 
          'Quản lý công thức', 
          'Sổ quỹ / Hóa đơn'
        ].map((item, idx) => (
          <li key={idx}>
            <button 
              type="button"
              onClick={() => {
                setActiveManagementTab(item);
                setSelectedMasterProduct(null); // Đóng panel nếu đang mở
              }}
              className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${
                activeManagementTab === item 
                  ? "ck-bg-gradient-btn-admin ck-text-white" 
                  : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
              }`}
              style={activeManagementTab !== item ? { border: 'none', background: 'transparent' } : { border: 'none' }}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>

    {/* ===== RIGHT CONTENT (80%) ===== */}
    <div className="ck-flex ck-flex-col ck-gap-6" style={{ width: '80%' }}>

      {/* ----------------- 1. TAB BẢNG KPI (GIỮ NGUYÊN CODE CŨ) ----------------- */}
      {activeManagementTab === 'Bảng KPI' && (
        <div className="ck-flex ck-flex-col ck-gap-6">
          {/* ROW 1: Bảng 4 chỉ số KPI */}
          <div className="ck-grid ck-grid-cols-4 ck-gap-4">
            {[
              { label: 'Giá trị xuất kho', value: '145.2M', sub: '₫ trong ngày', color: 'ck-text-blue-400' },
              { label: '% Chi phí thực phẩm', value: '32.5%', sub: 'Mục tiêu < 35%', color: 'ck-text-green-400' },
              { label: 'Tỷ lệ hao hụt', value: '2.8%', sub: 'Cảnh báo > 3%', color: 'ck-text-yellow-400' },
              { label: 'Tỷ lệ giao hàng', value: '98.5%', sub: 'Đúng giờ', color: 'ck-text-purple-400' }
            ].map((stat, idx) => (
              <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-flex-col ck-justify-center">
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">{stat.label}</h4>
                <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
                <span className="ck-text-xs ck-text-gray-500 ck-mt-1">{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* ROW 2 */}
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

          {/* ROW 3 */}
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

     {/* ----------------- 2. TAB QUẢN LÝ SẢN PHẨM ----------------- */}
      {activeManagementTab === 'Quản lý sản phẩm' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
          
          {/* Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm mã SKU, Tên sản phẩm..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={productSearchText}
                onChange={(e) => setProductSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setProductAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setProductAppliedSearch(productSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
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
              <option value="Tráng miệng">Tráng miệng</option>
            </select>
            
            <select 
              value={filterProductStatus}
              onChange={(e) => setFilterProductStatus(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Trạng thái">Trạng thái</option>
              <option value="Đang bán">Đang bán</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
            </select>

            <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex-shrink-0" style={{ border: 'none' }}>
              + Thêm SP Master
            </button>
          </div>

          {/* Khu vực Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* Khung Bảng */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedMasterProduct ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã SKU</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Sản phẩm</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Danh mục</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Giá vốn (COGS)</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Giá Franchise</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED MASTER PRODUCTS Ở ĐÂY */}
                  {filteredMasterProducts.length > 0 ? (
                    filteredMasterProducts.map((prod, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedMasterProduct(prod)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedMasterProduct?.sku === prod.sku ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{prod.sku}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-bold">{prod.emoji} {prod.name}</td>
                        <td className="ck-py-4 ck-px-4">{prod.category}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-blue-400 ck-font-mono">{prod.cogs.toLocaleString()} ₫</td>
                        <td className="ck-py-4 ck-px-4 ck-text-green-400 ck-font-mono">{prod.price.toLocaleString()} ₫</td>
                        <td className="ck-py-4 ck-px-4">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            prod.status === 'Đang bán' ? 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50' : 
                            'ck-bg-gray-700 ck-text-gray-400 ck-border-gray-600'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy sản phẩm nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ngăn kéo chi tiết (Side-panel) - GIỮ NGUYÊN */}
            {selectedMasterProduct && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Chỉnh sửa Dữ liệu</h3>
                  <button 
                    onClick={() => setSelectedMasterProduct(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="ck-space-y-4 ck-text-sm">
                  <div>
                    <label className="ck-block ck-text-gray-400 ck-mb-1 ck-font-semibold">Mã SKU</label>
                    <input type="text" readOnly value={selectedMasterProduct.sku} className="ck-w-full ck-bg-gray-800 ck-text-gray-400 ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none ck-font-mono" />
                  </div>

                  <div>
                    <label className="ck-block ck-text-gray-400 ck-mb-1 ck-font-semibold">Tên sản phẩm</label>
                    <div className="ck-flex ck-gap-2">
                      <input type="text" defaultValue={selectedMasterProduct.emoji} className="ck-w-12 ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 ck-outline-none ck-text-center" />
                      <input type="text" defaultValue={selectedMasterProduct.name} className="ck-flex-1 ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-orange-400 ck-outline-none" />
                    </div>
                  </div>

                  <div className="ck-grid ck-grid-cols-2 ck-gap-3">
                    <div>
                      <label className="ck-block ck-text-gray-400 ck-mb-1 ck-font-semibold">Giá vốn (COGS)</label>
                      <input type="number" defaultValue={selectedMasterProduct.cogs} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-blue-400 ck-outline-none" />
                    </div>
                    <div>
                      <label className="ck-block ck-text-gray-400 ck-mb-1 ck-font-semibold">Giá Franchise</label>
                      <input type="number" defaultValue={selectedMasterProduct.price} className="ck-w-full ck-bg-gray-800 ck-text-green-400 ck-font-bold ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-green-400 ck-outline-none" />
                    </div>
                  </div>

                  <div className="ck-flex ck-items-center ck-justify-between ck-bg-gray-800 ck-p-3 ck-rounded-lg ck-border ck-border-gray-700">
                    <span className="ck-text-white ck-font-semibold">Trạng thái bán</span>
                    {/* Giả lập Toggle Switch */}
                    <div className={`ck-w-12 ck-h-6 ck-rounded-full ck-p-1 ck-cursor-pointer ck-transition-colors ${selectedMasterProduct.status === 'Đang bán' ? 'ck-bg-green-500' : 'ck-bg-gray-600'}`}>
                      <div className={`ck-bg-white ck-w-4 ck-h-4 ck-rounded-full ck-shadow-md ck-transform ck-transition-transform ${selectedMasterProduct.status === 'Đang bán' ? 'ck-translate-x-6' : 'ck-translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>

                <div className="ck-mt-6 ck-flex ck-gap-3">
                  <button className="ck-w-1/3 ck-bg-red-500-20 hover:ck-bg-red-500-50 ck-text-red-400 ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    Xóa
                  </button>
                  <button className="ck-flex-1 ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    Lưu cập nhật
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- 3. TAB TỔNG QUAN TỒN KHO ----------------- */}
      {activeManagementTab === 'Tổng quan tồn kho' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full">
          
          {/* Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-yellow-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm mã hàng, tên nguyên liệu..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={inventorySearchText}
                onChange={(e) => setInventorySearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setInventoryAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setInventoryAppliedSearch(inventorySearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-yellow-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

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
            
            <select 
              value={filterInventoryStatus}
              onChange={(e) => setFilterInventoryStatus(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Cảnh báo tồn kho">Cảnh báo tồn kho</option>
              <option value="Sắp hết hàng">Sắp hết hàng</option>
              <option value="Đã hết hàng">Đã hết hàng</option>
            </select>

            <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex-shrink-0">
              📥 Xuất File Excel
            </button>
          </div>

          {/* Khu vực Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* Khung Bảng Danh Sách */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedInventoryItem ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã Hàng</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Nguyên liệu / Vật tư</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Danh mục</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-right">Tồn hiện tại</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-right">Định mức Min</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED INVENTORY Ở ĐÂY */}
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedInventoryItem(item)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedInventoryItem?.sku === item.sku ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-yellow-400' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{item.sku}</td>
                        <td className="ck-py-4 ck-px-4 ck-font-bold">{item.name}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-gray-400">{item.category}</td>
                        <td className={`ck-py-4 ck-px-4 ck-font-mono ck-font-bold ck-text-right ${item.stock === 0 ? 'ck-text-red-500' : item.stock <= item.min ? 'ck-text-yellow-400' : 'ck-text-white'}`}>
                          {item.stock.toLocaleString()} <span className="ck-text-xs ck-text-gray-500">{item.unit}</span>
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400 ck-text-right">
                          {item.min.toLocaleString()} <span className="ck-text-xs">{item.unit}</span>
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-text-center">
                          {item.status === 'An toàn' && <span className="ck-bg-green-500-20 ck-text-green-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ck-border-green-500-50">An toàn</span>}
                          {item.status === 'Sắp hết' && <span className="ck-bg-yellow-500-20 ck-text-yellow-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ck-border-yellow-500-50">Sắp hết</span>}
                          {item.status === 'Hết hàng' && <span className="ck-bg-red-500-20 ck-text-red-400 ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ck-border-red-500-50 ck-animate-pulse">Hết hàng</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy nguyên liệu nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ngăn kéo chi tiết (Side-panel) - Thao tác Nhập/Xuất kho - GIỮ NGUYÊN */}
            {selectedInventoryItem && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Kiểm kê & Điều chỉnh</h3>
                  <button 
                    onClick={() => setSelectedInventoryItem(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="ck-space-y-5 ck-text-sm">
                  
                  {/* Cảnh báo đỏ/vàng nếu kho có vấn đề */}
                  {selectedInventoryItem.status === 'Hết hàng' && (
                    <div className="ck-bg-red-500-20 ck-border ck-border-red-500-50 ck-p-3 ck-rounded-lg ck-text-red-400 ck-font-bold ck-flex ck-items-center ck-gap-2">
                      ⚠️ KHO TRỐNG - CẦN NHẬP GẤP
                    </div>
                  )}
                  {selectedInventoryItem.status === 'Sắp hết' && (
                    <div className="ck-bg-yellow-500-20 ck-border ck-border-yellow-500-50 ck-p-3 ck-rounded-lg ck-text-yellow-400 ck-font-bold ck-flex ck-items-center ck-gap-2">
                      ⚡ DƯỚI ĐỊNH MỨC TỐI THIỂU
                    </div>
                  )}

                  {/* Thông tin mặt hàng */}
                  <div className="ck-bg-gray-800 ck-p-4 ck-rounded-xl ck-border ck-border-gray-700">
                    <p className="ck-text-xs ck-text-gray-400 ck-font-mono ck-mb-1">{selectedInventoryItem.sku}</p>
                    <p className="ck-text-lg ck-text-white ck-font-bold ck-mb-3">{selectedInventoryItem.name}</p>
                    <div className="ck-flex ck-justify-between ck-items-end">
                      <div>
                        <p className="ck-text-xs ck-text-gray-400 ck-mb-1">Tồn kho thực tế</p>
                        <p className="ck-text-2xl ck-font-black ck-text-white">
                          {selectedInventoryItem.stock} <span className="ck-text-sm ck-text-gray-500 ck-font-normal">{selectedInventoryItem.unit}</span>
                        </p>
                      </div>
                      <div className="ck-text-right">
                        <p className="ck-text-xs ck-text-gray-400 ck-mb-1">Định mức tối thiểu</p>
                        <p className="ck-text-lg ck-font-bold ck-text-gray-300">
                          {selectedInventoryItem.min} {selectedInventoryItem.unit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vùng thao tác Nhập / Xuất */}
                  <div>
                    <label className="ck-block ck-text-gray-400 ck-mb-2 ck-font-semibold">Thao tác nhanh</label>
                    <div className="ck-flex ck-gap-2">
                      <input 
                        type="number" 
                        placeholder="Số lượng..." 
                        className="ck-flex-1 ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-blue-400 ck-outline-none" 
                      />
                      <span className="ck-flex ck-items-center ck-text-gray-500 ck-px-2">{selectedInventoryItem.unit}</span>
                    </div>
                    <div className="ck-flex ck-gap-3 ck-mt-3">
                      <button className="ck-flex-1 ck-bg-green-500-20 hover:ck-bg-green-500-50 ck-text-green-400 ck-py-2 ck-rounded-xl ck-font-bold ck-border ck-border-green-500-50 ck-transition-colors ck-cursor-pointer">
                        + Nhập kho
                      </button>
                      <button className="ck-flex-1 ck-bg-red-500-20 hover:ck-bg-red-500-50 ck-text-red-400 ck-py-2 ck-rounded-xl ck-font-bold ck-border ck-border-red-500-50 ck-transition-colors ck-cursor-pointer">
                        - Xuất kho
                      </button>
                    </div>
                  </div>

                  {/* Lịch sử giao dịch gần nhất */}
                  <div className="ck-pt-2 ck-border-t ck-border-gray-700">
                    <p className="ck-text-sm ck-text-gray-400 ck-font-semibold ck-mb-3">Lịch sử gần đây</p>
                    <ul className="ck-space-y-2">
                      <li className="ck-flex ck-justify-between ck-text-xs ck-p-2 ck-bg-gray-800 ck-rounded-lg">
                        <span className="ck-text-gray-400">Hôm nay, 08:30</span>
                        <span className="ck-text-red-400 ck-font-bold">-10 {selectedInventoryItem.unit}</span>
                      </li>
                      <li className="ck-flex ck-justify-between ck-text-xs ck-p-2 ck-bg-gray-800 ck-rounded-lg">
                        <span className="ck-text-gray-400">Hôm qua, 14:00</span>
                        <span className="ck-text-green-400 ck-font-bold">+50 {selectedInventoryItem.unit}</span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- 4. TAB PHÂN TÍCH CHI PHÍ (MỚI) ----------------- */}
      {activeManagementTab === 'Phân tích chi phí' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
          
          {/* Thanh Công Cụ Lọc (Toolbar) */}
          <div className="ck-flex ck-justify-between ck-items-center">
            <h2 className="ck-text-2xl ck-font-black ck-text-white">Báo cáo Phân tích Chi phí</h2>
            <div className="ck-flex ck-gap-3">
              <select className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                <option>Tháng này</option>
                <option>Tháng trước</option>
                <option>Quý này</option>
                <option>Năm nay</option>
              </select>
              <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600">
                📥 Tải Báo Cáo PDF
              </button>
            </div>
          </div>

          {/* 4 Thẻ KPI Chi phí */}
          <div className="ck-grid ck-grid-cols-4 ck-gap-4">
            {mockCostStats.map((stat, idx) => (
              <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-flex-col ck-justify-center">
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
                <div className="ck-flex ck-items-end ck-gap-3">
                  <p className="ck-text-3xl ck-font-black ck-text-white">{stat.value}</p>
                  <span className={`ck-text-sm ck-font-bold ck-mb-1 ${stat.isUp ? 'ck-text-green-400' : 'ck-text-red-400'}`}>
                    {stat.isUp ? '↑' : '↓'} {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Khu vực Biểu đồ (Charts) */}
          <div className="ck-grid ck-grid-cols-3 ck-gap-6">
            
            {/* Biểu đồ Cột - Xu hướng Doanh thu vs Chi phí (66%) */}
            <div className="ck-col-span-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col" style={{ minHeight: '350px' }}>
              <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Xu hướng Giá trị xuất kho & Chi phí vốn (6 tháng)</h3>
              
              {/* Vùng chứa Biểu đồ (Giả lập) */}
              <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-flex-col ck-items-center ck-justify-center ck-bg-gray-800 ck-bg-opacity-50">
                <div className="ck-flex ck-items-end ck-gap-4 ck-mb-4 ck-h-32">
                  <div className="ck-w-8 ck-bg-blue-500 ck-rounded-t-sm ck-h-24"></div>
                  <div className="ck-w-8 ck-bg-orange-500 ck-rounded-t-sm ck-h-16"></div>
                  <div className="ck-w-2"></div>
                  <div className="ck-w-8 ck-bg-blue-500 ck-rounded-t-sm ck-h-28"></div>
                  <div className="ck-w-8 ck-bg-orange-500 ck-rounded-t-sm ck-h-20"></div>
                  <div className="ck-w-2"></div>
                  <div className="ck-w-8 ck-bg-blue-500 ck-rounded-t-sm ck-h-20"></div>
                  <div className="ck-w-8 ck-bg-orange-500 ck-rounded-t-sm ck-h-12"></div>
                </div>
                <span className="ck-text-gray-500 ck-font-semibold">[Khu vực render Recharts - Bar Chart]</span>
              </div>
            </div>

            {/* Biểu đồ Tròn - Cơ cấu Chi phí (33%) */}
            <div className="ck-col-span-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col">
              <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mb-4">Cơ cấu Chi phí</h3>
              
              <div className="ck-flex-1 ck-border-2 ck-border-dashed ck-border-gray-700 ck-rounded-xl ck-flex ck-flex-col ck-items-center ck-justify-center ck-bg-gray-800 ck-bg-opacity-50 ck-p-4">
                {/* Giả lập hình tròn bằng CSS */}
                <div className="ck-w-32 ck-h-32 ck-rounded-full ck-border-8 ck-border-blue-500 ck-border-t-orange-500 ck-border-r-yellow-500 ck-border-b-green-500 ck-mb-4"></div>
                
                <div className="ck-w-full ck-space-y-2 ck-mt-4">
                  <div className="ck-flex ck-justify-between ck-text-sm"><span className="ck-text-blue-400">■ Nguyên liệu (Thịt/Rau)</span><span className="ck-text-white">55%</span></div>
                  <div className="ck-flex ck-justify-between ck-text-sm"><span className="ck-text-orange-400">■ Bao bì / Nhựa</span><span className="ck-text-white">20%</span></div>
                  <div className="ck-flex ck-justify-between ck-text-sm"><span className="ck-text-yellow-400">■ Vận hành bếp</span><span className="ck-text-white">15%</span></div>
                  <div className="ck-flex ck-justify-between ck-text-sm"><span className="ck-text-green-400">■ Khác (Hao hụt...)</span><span className="ck-text-white">10%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng Top 5 Sản phẩm/Nguyên liệu tốn kém nhất */}
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
            <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
              <h3 className="ck-text-lg ck-font-bold ck-text-white">Top 5 Mặt hàng có chi phí vốn (COGS) cao nhất</h3>
              <button className="ck-text-orange-400 hover:ck-text-orange-300 ck-text-sm ck-font-semibold ck-bg-transparent ck-border-none">
                Xem chi tiết →
              </button>
            </div>
            <table className="ck-w-full ck-text-left ck-border-collapse">
              <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                <tr>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Mã SKU</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Tên mặt hàng</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Phân loại</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-right">Giá vốn (COGS)</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-right">Biên LN Gộp</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-center">Biến động giá</th>
                </tr>
              </thead>
              <tbody className="ck-text-white ck-text-sm">
                {topCostItems.map((item, idx) => (
                  <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors">
                    <td className="ck-py-4 ck-px-5 ck-font-mono ck-text-gray-400">{item.sku}</td>
                    <td className="ck-py-4 ck-px-5 ck-font-bold">{item.name}</td>
                    <td className="ck-py-4 ck-px-5 ck-text-gray-400">{item.category}</td>
                    <td className="ck-py-4 ck-px-5 ck-text-right ck-font-mono ck-font-bold ck-text-orange-400">
                      {item.cogs.toLocaleString()} ₫
                    </td>
                    <td className="ck-py-4 ck-px-5 ck-text-right ck-font-mono">
                      {item.margin !== 'N/A' ? <span className="ck-text-green-400">{item.margin}</span> : <span className="ck-text-gray-500">N/A</span>}
                    </td>
                    <td className="ck-py-4 ck-px-5 ck-text-center">
                      {item.trend === 'up' && <span className="ck-text-red-400 ck-font-bold">📈 Tăng</span>}
                      {item.trend === 'down' && <span className="ck-text-green-400 ck-font-bold">📉 Giảm</span>}
                      {item.trend === 'stable' && <span className="ck-text-gray-400 ck-font-bold">➖ Ổn định</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
      {/* ----------------- 5. TAB BÁO CÁO (MỚI) ----------------- */}
      {activeManagementTab === 'Báo cáo' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
          
          {/* Thanh Bộ Lọc & Công Cụ (Toolbar) */}
          <div className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl">
            <div className="ck-flex ck-items-center ck-gap-4">
              <h2 className="ck-text-xl ck-font-black ck-text-white ck-mr-4">Trích xuất Báo cáo</h2>
              
              {/* Form chọn ngày tháng */}
              <div className="ck-flex ck-items-center ck-gap-2">
                <span className="ck-text-sm ck-text-gray-400 ck-font-semibold">Từ:</span>
                <input type="date" className="ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-orange-400 ck-outline-none ck-text-sm" defaultValue="2026-02-01" />
              </div>
              <div className="ck-flex ck-items-center ck-gap-2">
                <span className="ck-text-sm ck-text-gray-400 ck-font-semibold">Đến:</span>
                <input type="date" className="ck-bg-gray-800 ck-text-white ck-px-3 ck-py-2 ck-rounded-lg ck-border ck-border-gray-700 focus:ck-border-orange-400 ck-outline-none ck-text-sm" defaultValue="2026-02-25" />
              </div>
            </div>
            
            <button className="ck-btn ck-px-5 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-shadow-lg">
              Tạo báo cáo tùy chỉnh
            </button>
          </div>

          {/* Các Thẻ Báo Cáo Nhanh (Quick Reports) */}
          <h3 className="ck-text-lg ck-font-bold ck-text-white ck-mt-2">Mẫu báo cáo thường dùng</h3>
          <div className="ck-grid ck-grid-cols-4 ck-gap-5">
            {[
              { title: 'Báo cáo Doanh thu', desc: 'Tổng hợp giá trị xuất kho, đơn hàng franchise.', icon: '💰', color: 'ck-text-green-400', bg: 'ck-bg-green-500-20' },
              { title: 'Báo cáo Tồn kho', desc: 'Chi tiết số lượng hiện tại, cảnh báo hết hạn.', icon: '📦', color: 'ck-text-blue-400', bg: 'ck-bg-blue-500-20' },
              { title: 'Báo cáo Hao hụt', desc: 'Thống kê nguyên liệu hư hỏng, quá hạn.', icon: '📉', color: 'ck-text-red-400', bg: 'ck-bg-red-500-20' },
              { title: 'Hiệu suất Vận chuyển', desc: 'Chỉ số KPI của tài xế, tỉ lệ giao đúng giờ.', icon: '🚚', color: 'ck-text-orange-400', bg: 'ck-bg-orange-500-20' }
            ].map((report, idx) => (
              <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-flex-col ck-justify-between hover:ck-border-gray-500 ck-transition-colors ck-cursor-pointer ck-group">
                <div>
                  <div className={`ck-w-12 ck-h-12 ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-text-2xl ck-mb-4 ${report.bg}`}>
                    {report.icon}
                  </div>
                  <h4 className="ck-text-base ck-font-bold ck-text-white ck-mb-2 group-hover:ck-text-orange-400 ck-transition-colors">{report.title}</h4>
                  <p className="ck-text-xs ck-text-gray-400 ck-leading-relaxed">{report.desc}</p>
                </div>
                <div className="ck-mt-5 ck-flex ck-gap-2">
                  <button className="ck-flex-1 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-2 ck-rounded-lg ck-text-xs ck-font-bold ck-border ck-border-gray-600 ck-transition-colors">
                    Xuất PDF
                  </button>
                  <button className="ck-flex-1 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-2 ck-rounded-lg ck-text-xs ck-font-bold ck-border ck-border-gray-600 ck-transition-colors">
                    Xuất Excel
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bảng Lịch sử xuất báo cáo (Recent Reports) */}
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-mt-4 ck-flex-1">
            <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
              <h3 className="ck-text-lg ck-font-bold ck-text-white">Lịch sử xuất báo cáo gần đây</h3>
              <button className="ck-text-sm ck-font-semibold ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-underline">
                Xóa lịch sử cũ
              </button>
            </div>
            
            <table className="ck-w-full ck-text-left ck-border-collapse">
              <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                <tr>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Mã File</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Tên báo cáo</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold">Thời gian tạo</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-center">Định dạng</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-right">Dung lượng</th>
                  <th className="ck-py-4 ck-px-5 ck-font-semibold ck-text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="ck-text-white ck-text-sm">
                {mockRecentReports.map((report, idx) => (
                  <tr key={idx} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800 ck-transition-colors">
                    <td className="ck-py-4 ck-px-5 ck-font-mono ck-text-gray-400">{report.id}</td>
                    <td className="ck-py-4 ck-px-5 ck-font-bold">{report.name}</td>
                    <td className="ck-py-4 ck-px-5 ck-text-gray-400">{report.date}</td>
                    <td className="ck-py-4 ck-px-5 ck-text-center">
                      <span className={`ck-px-3 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ck-border ${
                        report.type === 'PDF' ? 'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50' : 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="ck-py-4 ck-px-5 ck-text-right ck-font-mono ck-text-gray-400">{report.size}</td>
                    <td className="ck-py-4 ck-px-5 ck-text-center">
                      <button className="ck-btn ck-px-4 ck-py-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-rounded-lg ck-font-bold ck-text-xs ck-border-none ck-transition-colors">
                        Tải xuống ⬇
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
      {/* ----------------- 6. TAB QUẢN LÝ CÔNG THỨC ----------------- */}
      {activeManagementTab === 'Quản lý công thức' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
          
          {/* Thanh Công Cụ Lọc (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-orange-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm mã SKU, Tên sản phẩm..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={recipeSearchText}
                onChange={(e) => setRecipeSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setRecipeAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setRecipeAppliedSearch(recipeSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-orange-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            <select 
              value={filterRecipeCategory}
              onChange={(e) => setFilterRecipeCategory(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Tất cả danh mục">Tất cả danh mục</option>
              <option value="Gà rán">Gà rán</option>
              <option value="Burger">Burger</option>
              <option value="Ăn vặt">Ăn vặt</option>
            </select>
            
            <select 
              value={filterRecipeStatus}
              onChange={(e) => setFilterRecipeStatus(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Trạng thái">Trạng thái</option>
              <option value="Đã thiết lập BOM">Đã thiết lập BOM</option>
              <option value="Chưa có công thức">Chưa có công thức</option>
            </select>
          </div>

          {/* Khu vực Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* Khung Bảng Danh Sách Định Mức */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedRecipe ? '55%' : '100%' }} // Cho ngăn kéo rộng hơn chút để dễ nhập liệu
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Sản phẩm (Master Data)</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Số nguyên liệu</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-right">Giá vốn ước tính</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED RECIPES Ở ĐÂY */}
                  {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedRecipe(recipe)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedRecipe?.sku === recipe.sku ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-orange-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4">
                          <span className="ck-block ck-font-bold">{recipe.emoji} {recipe.name}</span>
                          <span className="ck-text-xs ck-font-mono ck-text-gray-400">{recipe.sku}</span>
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-text-center ck-font-mono ck-text-gray-300">
                          {recipe.ingredients.length} mục
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-text-right ck-text-blue-400 ck-font-mono ck-font-bold">
                          {recipe.estCost.toLocaleString()} ₫
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-text-center">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            recipe.status === 'Đã thiết lập' ? 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50' : 
                            'ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50'
                          }`}>
                            {recipe.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy công thức nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ngăn kéo chi tiết (Side-panel) - Chỉnh sửa Công thức - GIỮ NGUYÊN */}
            {selectedRecipe && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-flex ck-flex-col ck-animate-fade-in"
                style={{ width: '45%', maxHeight: '600px' }}
              >
                {/* Header Panel */}
                <div className="ck-p-5 ck-border-b ck-border-gray-700 ck-flex ck-justify-between ck-items-center">
                  <div>
                    <h3 className="ck-text-xl ck-font-bold ck-text-white ck-mb-1">Định mức nguyên liệu (BOM)</h3>
                    <p className="ck-text-sm ck-text-orange-400 ck-font-semibold">{selectedRecipe.emoji} {selectedRecipe.name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRecipe(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Body - Danh sách nguyên liệu (Có thanh cuộn) */}
                <div className="ck-p-5 ck-flex-1 ck-overflow-y-auto ck-scrollbar">
                  {selectedRecipe.ingredients.length === 0 ? (
                    <div className="ck-text-center ck-py-10 ck-text-gray-500">
                      <p className="ck-mb-2 ck-text-3xl">🫙</p>
                      <p>Sản phẩm này chưa có công thức.</p>
                      <p className="ck-text-xs">Bấm "Thêm nguyên liệu" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="ck-space-y-3">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between ck-group">
                          {/* Tên NL */}
                          <div className="ck-flex-1">
                            <p className="ck-text-white ck-font-semibold">{ing.name}</p>
                            <p className="ck-text-xs ck-font-mono ck-text-gray-400">{ing.id}</p>
                          </div>
                          
                          {/* Nhập Số lượng */}
                          <div className="ck-flex ck-items-center ck-gap-2 ck-w-1/3">
                            <input 
                              type="number" 
                              defaultValue={ing.qty} 
                              step="0.01"
                              className="ck-w-full ck-bg-gray-900 ck-text-white ck-px-2 ck-py-1.5 ck-rounded-lg ck-border ck-border-gray-600 focus:ck-border-orange-400 ck-outline-none ck-text-right ck-font-mono" 
                            />
                            <span className="ck-text-sm ck-text-gray-400 ck-w-8">{ing.unit}</span>
                          </div>

                          {/* Nút Xóa (Chỉ hiện khi hover) */}
                          <button className="ck-ml-2 ck-text-gray-500 hover:ck-text-red-400 ck-bg-transparent ck-border-none ck-opacity-0 group-hover:ck-opacity-100 ck-transition-opacity ck-cursor-pointer">
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nút thêm nguyên liệu mới */}
                  <button className="ck-w-full ck-mt-4 ck-py-3 ck-rounded-xl ck-border-2 ck-border-dashed ck-border-gray-600 hover:ck-border-orange-400 hover:ck-text-orange-400 ck-text-gray-400 ck-font-bold ck-bg-transparent ck-transition-colors ck-cursor-pointer">
                    + Thêm nguyên liệu từ Kho
                  </button>
                </div>

                {/* Footer Panel - Tổng kết & Lưu */}
                <div className="ck-p-5 ck-border-t ck-border-gray-700 ck-bg-gray-900 ck-rounded-b-2xl">
                  <div className="ck-flex ck-justify-between ck-items-end ck-mb-4">
                    <span className="ck-text-sm ck-text-gray-400">Ước tính Tổng giá vốn:</span>
                    <span className="ck-text-2xl ck-font-black ck-text-blue-400">{selectedRecipe.estCost.toLocaleString()} ₫</span>
                  </div>
                  <button className="ck-w-full ck-bg-orange-500 hover:ck-bg-orange-600 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer ck-shadow-lg">
                    Lưu Công Thức
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ----------------- 7. TAB SỔ QUỸ / HÓA ĐƠN ----------------- */}
      {activeManagementTab === 'Sổ quỹ / Hóa đơn' && (
        <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
          
          {/* Thống kê nhanh Dòng tiền (GIỮ NGUYÊN) */}
          <div className="ck-grid ck-grid-cols-3 ck-gap-4">
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
              <div>
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Tổng Thu (Tháng này)</h4>
                <p className="ck-text-2xl ck-font-black ck-text-green-400">+124.500.000 ₫</p>
              </div>
              <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-green-500-20 ck-flex ck-items-center ck-justify-center ck-text-2xl">💰</div>
            </div>
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
              <div>
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Tổng Chi (Tháng này)</h4>
                <p className="ck-text-2xl ck-font-black ck-text-red-400">-86.200.000 ₫</p>
              </div>
              <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-red-500-20 ck-flex ck-items-center ck-justify-center ck-text-2xl">💸</div>
            </div>
            <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-flex ck-justify-between ck-items-center">
              <div>
                <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-1">Tồn Quỹ Hiện Tại</h4>
                <p className="ck-text-2xl ck-font-black ck-text-blue-400">38.300.000 ₫</p>
              </div>
              <div className="ck-w-12 ck-h-12 ck-rounded-full ck-bg-blue-500-20 ck-flex ck-items-center ck-justify-center ck-text-2xl">🏦</div>
            </div>
          </div>

          {/* Thanh Công Cụ (Toolbar) */}
          <div className="ck-flex ck-gap-4 ck-items-center">
            
            {/* Thanh Search ép màu tối */}
            <div className="ck-flex ck-flex-1 ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-overflow-hidden focus-within:ck-border-blue-400 ck-transition-colors">
              <input 
                type="text" 
                placeholder="🔍 Tìm mã giao dịch, tham chiếu..." 
                className="ck-w-full ck-px-4 ck-py-2 ck-outline-none"
                style={{ backgroundColor: '#111827', color: 'white' }}
                defaultValue={transactionSearchText}
                onChange={(e) => setTransactionSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setTransactionAppliedSearch(e.target.value);
                }} 
              />
              <button 
                onClick={() => setTransactionAppliedSearch(transactionSearchText)}
                className="ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-blue-400 ck-px-6 ck-font-bold ck-border-l ck-border-gray-700 ck-transition-colors ck-flex-shrink-0"
              >
                Tìm kiếm
              </button>
            </div>

            <select 
              value={filterTransactionType}
              onChange={(e) => setFilterTransactionType(e.target.value)}
              className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer"
            >
              <option value="Loại giao dịch">Loại giao dịch</option>
              <option value="Phiếu Thu">Phiếu Thu</option>
              <option value="Phiếu Chi">Phiếu Chi</option>
            </select>
            
            {/* Mình cho ô Date thành một input độc lập đẹp hơn */}
            <input type="date" className="ck-bg-gray-900 ck-text-white ck-px-4 ck-py-2 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none ck-cursor-pointer" />
            
            <button className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-border-none ck-flex-shrink-0">
              + Tạo Phiếu Mới
            </button>
          </div>

          {/* Khu vực Bảng & Ngăn kéo */}
          <div className="ck-flex ck-gap-6 ck-flex-1 ck-items-start ck-transition-all">
            
            {/* Khung Bảng Danh Sách Giao Dịch */}
            <div 
              className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ck-duration-300"
              style={{ width: selectedTransaction ? '66.66%' : '100%' }} 
            >
              <table className="ck-w-full ck-text-left ck-border-collapse">
                <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                  <tr>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Mã GD</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Thời gian</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Loại</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold">Hạng mục & Tham chiếu</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-right">Số tiền</th>
                    <th className="ck-py-4 ck-px-4 ck-font-semibold ck-text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="ck-text-white ck-text-sm">
                  {/* DÙNG FILTERED TRANSACTIONS Ở ĐÂY */}
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedTransaction(tx)}
                        className={`ck-border-t ck-border-gray-700 ck-cursor-pointer ck-transition-colors hover:ck-bg-gray-800 ${selectedTransaction?.id === tx.id ? 'ck-bg-gray-800 ck-border-l-4 ck-border-l-blue-500' : ''}`}
                      >
                        <td className="ck-py-4 ck-px-4 ck-font-mono ck-text-gray-400">{tx.id}</td>
                        <td className="ck-py-4 ck-px-4 ck-text-gray-400">{tx.date}</td>
                        <td className="ck-py-4 ck-px-4">
                          <span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ${tx.type === 'Thu' ? 'ck-bg-green-500-20 ck-text-green-400' : 'ck-bg-red-500-20 ck-text-red-400'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="ck-py-4 ck-px-4">
                          <span className="ck-block ck-font-semibold">{tx.category}</span>
                          <span className="ck-text-xs ck-text-gray-400">{tx.ref}</span>
                        </td>
                        <td className={`ck-py-4 ck-px-4 ck-text-right ck-font-mono ck-font-bold ${tx.type === 'Thu' ? 'ck-text-green-400' : 'ck-text-red-400'}`}>
                          {tx.type === 'Thu' ? '+' : '-'}{tx.amount.toLocaleString()} ₫
                        </td>
                        <td className="ck-py-4 ck-px-4 ck-text-center">
                          <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ck-border ${
                            tx.status === 'Hoàn thành' ? 'ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50' : 
                            'ck-bg-yellow-500-20 ck-text-yellow-400 ck-border-yellow-500-50'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="ck-py-8 ck-text-center ck-text-gray-500">
                        Không tìm thấy giao dịch nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ngăn kéo chi tiết (Side-panel) - Chi tiết Hóa Đơn - GIỮ NGUYÊN */}
            {selectedTransaction && (
              <div 
                className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-animate-fade-in"
                style={{ width: '33.33%' }}
              >
                <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                  <h3 className="ck-text-xl ck-font-bold ck-text-white">Chi tiết Giao dịch</h3>
                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer ck-p-1"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Khối dạng tờ biên lai */}
                <div className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-rounded-xl ck-p-5 ck-relative ck-overflow-hidden">
                  {/* Đường viền đứt nét tạo cảm giác hóa đơn */}
                  <div className="ck-absolute ck-top-0 ck-left-0 ck-w-full ck-h-2 ck-bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+')] ck-bg-repeat-x ck-transform ck--translate-y-1"></div>
                  
                  <div className="ck-text-center ck-mb-6 ck-mt-2">
                    <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Mã Giao Dịch</p>
                    <p className="ck-text-xl ck-font-mono ck-font-bold ck-text-white">{selectedTransaction.id}</p>
                    <p className="ck-text-xs ck-text-gray-500 ck-mt-1">{selectedTransaction.date}</p>
                  </div>

                  <div className="ck-space-y-3 ck-text-sm ck-border-t ck-border-b ck-border-dashed ck-border-gray-600 ck-py-4 ck-mb-4">
                    <div className="ck-flex ck-justify-between">
                      <span className="ck-text-gray-400">Hạng mục:</span>
                      <span className="ck-text-white ck-font-semibold">{selectedTransaction.category}</span>
                    </div>
                    <div className="ck-flex ck-justify-between">
                      <span className="ck-text-gray-400">Tham chiếu:</span>
                      <span className="ck-text-blue-400 ck-font-medium ck-underline ck-cursor-pointer">{selectedTransaction.ref}</span>
                    </div>
                    <div className="ck-flex ck-justify-between">
                      <span className="ck-text-gray-400">Phương thức:</span>
                      <span className="ck-text-white ck-font-semibold">{selectedTransaction.method}</span>
                    </div>
                    <div className="ck-flex ck-justify-between">
                      <span className="ck-text-gray-400">Người tạo:</span>
                      <span className="ck-text-white">Admin Kế Toán</span>
                    </div>
                  </div>

                  <div className="ck-flex ck-justify-between ck-items-end">
                    <span className="ck-text-base ck-text-gray-300 ck-font-bold">Tổng cộng:</span>
                    <span className={`ck-text-3xl ck-font-black ${selectedTransaction.type === 'Thu' ? 'ck-text-green-400' : 'ck-text-red-400'}`}>
                      {selectedTransaction.type === 'Thu' ? '+' : '-'}{selectedTransaction.amount.toLocaleString()} ₫
                    </span>
                  </div>
                </div>

                <div className="ck-mt-6 ck-flex ck-gap-3">
                  {selectedTransaction.status === 'Chờ duyệt' && (
                    <button className="ck-flex-1 ck-bg-blue-500 hover:ck-bg-blue-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                      ✓ Duyệt Phiếu
                    </button>
                  )}
                  <button className="ck-flex-1 ck-bg-gray-700 hover:ck-bg-gray-600 ck-text-white ck-py-2 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer">
                    🖨️ In Hóa Đơn
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  </div>
)}

      


        </div>
      </main>

      {showAddUser && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowAddUser(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Thêm người dùng mới
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowAddUser(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>

            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  className="ck-input ck-w-full"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Họ tên *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Vai trò *
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="franchise">Nhân viên cửa hàng</option>
                  <option value="kitchen">Nhân viên bếp</option>
                  <option value="coordinator">Điều phối viên</option>
                  <option value="manager">Quản lý</option>
<<<<<<< HEAD
                  <option value="admin">Quản trị viên</option>
=======
>>>>>>> 84ecd4c (fix conflict)
                </select>
              </div>
              {newUser.role === "franchise" && (
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Tên cửa hàng *
                  </label>
                  <input
                    type="text"
                    className="ck-input ck-w-full"
                    value={newUser.storeName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, storeName: e.target.value })
                    }
                    placeholder="Cửa hàng Quận 1"
                  />
                </div>
              )}
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => setShowAddUser(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleAddUser}
                >
                  Thêm người dùng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStore && (
        <div
          className="ck-modal-overlay"
          onClick={() => setShowAddStore(false)}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                Thêm cửa hàng franchise
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => setShowAddStore(false)}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên cửa hàng *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.storeName}
                  onChange={(e) =>
                    setNewStore({ ...newStore, storeName: e.target.value })
                  }
                  placeholder="Cửa hàng Quận 1"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Người phụ trách (họ tên) *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.name}
                  onChange={(e) =>
                    setNewStore({ ...newStore, name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={newStore.username}
                  onChange={(e) =>
                    setNewStore({ ...newStore, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  className="ck-input ck-w-full"
                  value={newStore.password}
                  onChange={(e) =>
                    setNewStore({ ...newStore, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Trạng thái
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={newStore.status}
                  onChange={(e) =>
                    setNewStore({ ...newStore, status: e.target.value })
                  }
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                </select>
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => setShowAddStore(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleAddStore}
                >
                  Thêm cửa hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddCategory || editingCategory) && (
        <div
          className="ck-modal-overlay"
          onClick={() => {
            setShowAddCategory(false);
            setEditingCategory(null);
            setNewCategoryName("");
          }}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục sản phẩm"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategoryName("");
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    editingCategory ? editingCategory.name : newCategoryName
                  }
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      : setNewCategoryName(e.target.value)
                  }
                  placeholder="Ví dụ: Bánh mì"
                />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategory(null);
                    setNewCategoryName("");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleSaveCategory}
                >
                  {editingCategory ? "Lưu thay đổi" : "Thêm danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddProduct || editingProduct) && (
        <div
          className="ck-modal-overlay"
          onClick={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
          role="presentation"
        >
          <div
            className="ck-modal-box ck-max-w-md ck-w-full ck-p-8"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">
                {editingProduct
                  ? "Sửa sản phẩm"
                  : "Thêm sản phẩm bếp trung tâm"}
              </h3>
              <button
                type="button"
                className="ck-btn ck-p-2 ck-rounded-lg"
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                }}
                style={{ background: "none", border: "none" }}
              >
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={(editingProduct ? editingProduct : newProduct).name}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Bánh mì sandwich"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Danh mục *
                </label>
                <select
                  className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                  value={
                    (editingProduct ? editingProduct : newProduct).category
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          category: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="ck-grid-2 ck-gap-4"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Giá (₫) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ck-input ck-w-full"
                    value={(editingProduct ? editingProduct : newProduct).price}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            price: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            price: e.target.value,
                          })
                    }
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                    Tồn kho *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ck-input ck-w-full"
                    value={(editingProduct ? editingProduct : newProduct).stock}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            stock: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            stock: e.target.value,
                          })
                    }
                    placeholder="150"
                  />
                </div>
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Mức tồn tối thiểu *
                </label>
                <input
                  type="number"
                  min="0"
                  className="ck-input ck-w-full"
                  value={(editingProduct ? editingProduct : newProduct).min}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          min: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, min: e.target.value })
                  }
                  placeholder="50"
                />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                  Emoji (hiển thị)
                </label>
                <input
                  type="text"
                  className="ck-input ck-w-full"
                  value={
                    (editingProduct
                      ? editingProduct.emoji
                      : newProduct.emoji) || ""
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          emoji: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, emoji: e.target.value })
                  }
                  placeholder="🥪"
                  maxLength={2}
                />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold"
                  style={{ border: "none" }}
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold"
                  style={{ border: "none" }}
                  onClick={handleSaveProduct}
                >
                  {editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
