/**
 * ====================================================================
 * API SERVICE - ULTIMATE STABLE VERSION
 * Version: 2026 - Real API Integration (No more fake users)
 * ====================================================================
 */

const BASE_URL = process.env.NODE_ENV === "development" ? "" : (process.env.REACT_APP_API_URL || "http://localhost:8081");
const TOKEN_KEY = "ck_token";
const USER_KEY = "ck_user";

// --- QUẢN LÝ LOCAL STORAGE ---
const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY),
  getUser: () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  setUser: (u) => u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY)
};

// --- HÀM REQUEST NỀN TẢNG ---
async function request(path, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  const token = storage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    storage.setToken(null);
    storage.setUser(null);
    throw new Error("Hết hạn phiên làm việc.");
  }
  if (!res.ok) throw new Error(data.message || data.error || "Lỗi kết nối server");
  return data;
}

// --- BẢO HIỂM MẢNG (CHỐNG LỖI .FILTER) ---
const toArray = (res) => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

// --- CHUẨN HÓA ROLE (GIỐNG BẠN CỦA BẠN) ---
function normalizeRole(role) {
  if (!role) return "franchise";
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "KITCHEN_STAFF" || r === "KITCHEN") return "kitchen";
  if (r === "MANAGER") return "manager";
  return r.toLowerCase();
}

// =========================================================
// [API OBJECT CHÍNH]
// =========================================================

const api = {
  // --- Hệ thống & Auth (ĐÃ SET MỀM) ---
  init: () => console.log("System Ready - Real API Mode"),
  isAuthenticated: () => !!storage.getToken(),
  getStoredUser: () => storage.getUser(),

  login: async (username, password) => {
    // GỌI API THẬT
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!res.token) throw new Error("Không nhận được mã truy cập từ server");

    // Map dữ liệu từ backend trả về vào format app đang dùng
    const user = {
      id: res.username || res.id,
      name: res.fullName || res.username,
      role: normalizeRole(res.role)
    };

    storage.setToken(res.token);
    storage.setUser(user);
    return user;
  },

  logout: () => { storage.setToken(null); storage.setUser(null); },

  // --- Quản lý Sản phẩm ---
  getProducts: async () => toArray(await request("/api/products")),
  getMasterProducts: async () => toArray(await request("/api/products")),
  createProduct: (b) => request("/api/products", { method: "POST", body: JSON.stringify(b) }),
  createMasterProduct: (b) => request("/api/products", { method: "POST", body: JSON.stringify(b) }),
  updateProduct: (id, b) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  updateMasterProduct: (id, b) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  deleteMasterProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),

  // --- Quản lý Cửa hàng ---
  getStores: async () => toArray(await request("/api/stores")),
  createStore: (b) => request("/api/stores", { method: "POST", body: JSON.stringify(b) }),
  updateStore: (id, b) => request(`/api/stores/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteStore: (id) => request(`/api/stores/${id}`, { method: "DELETE" }),

  // --- Quản lý Danh mục ---
  getCategories: async () => toArray(await request("/api/categories")),
  createCategory: (b) => request("/api/categories", { method: "POST", body: JSON.stringify(b) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),

  // --- Nguyên liệu & Kho ---
  getIngredients: async () => toArray(await request("/api/ingredients")),
  createIngredient: (b) => request("/api/ingredients", { method: "POST", body: JSON.stringify(b) }),
  updateIngredient: (id, b) => request(`/api/ingredients/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteIngredient: (id) => request(`/api/ingredients/${id}`, { method: "DELETE" }),
  getManagerInventory: async () => toArray(await request("/api/inventory/overview")),
  importInventory: (b) => request("/api/inventory/import", { method: "POST", body: JSON.stringify(b) }),

  // --- Đơn hàng ---
  getAllOrders: async () => toArray(await request("/api/orders")),
  getOrdersHistory: async (sId) => toArray(await request(`/api/orders/history?storeId=${sId}`)),
  addOrder: (b) => request("/api/orders/standard", { method: "POST", body: JSON.stringify(b) }),
  addOrderUrgent: (b) => request("/api/orders/urgent", { method: "POST", body: JSON.stringify(b) }),
  cancelOrder: (id) => request(`/api/orders/${id}/cancel`, { method: "PUT" }),

  // --- Công thức (BOM) ---
  getManagerRecipes: async () => toArray(await request("/api/recipes")),
  getRecipeOfProduct: (pId) => request(`/api/recipes/${pId}`),
  saveRecipe: (b) => request("/api/recipes", { method: "POST", body: JSON.stringify(b) }),

  // --- Bếp (Kitchen) ---
  getKitchenAggregation: () => request("/api/kitchen/aggregation"),
  confirmAggregation: (b) => request("/api/kitchen/aggregation/confirm", { method: "POST", body: JSON.stringify(b) }),
  cook: (b) => request("/api/kitchen/cook", { method: "POST", body: JSON.stringify(b) }),
  getActiveProductions: async () => toArray(await request("/api/kitchen/productions/active")),
  getProductionRuns: async () => toArray(await request("/api/kitchen/productions/active")),
  updateProductionRunStatus: (id, s) => request(`/api/production-runs/${id}/status`, { method: "PUT", body: JSON.stringify({ status: s }) }),
  reportWastage: (b) => request("/api/kitchen/wastage", { method: "POST", body: JSON.stringify(b) }),

  // --- Sự cố ---
  getIncidents: async () => toArray(await request("/api/incidents")),
  createIncident: (b) => request("/api/incidents", { method: "POST", body: JSON.stringify(b) }),
  updateIncidentStatus: (id, s) => request(`/api/incidents/${id}/status`, { method: "PUT", body: JSON.stringify({ status: s }) }),

  // --- Thống kê & Quy đổi ---
  getKPIStats: async () => {
    const res = await request("/api/dashboard/kpi");
    return toArray(res);
  },
  getRevenueAnalytics: () => request("/api/manager/analytics/revenue"),
  getExpenses: async () => toArray(await request("/api/expenses")),
  createExpense: (b) => request("/api/expenses", { method: "POST", body: JSON.stringify(b) }),
  setConversion: (b) => request("/api/manager/conversions", { method: "POST", body: JSON.stringify(b) }),

  // --- Báo cáo ---
  getReports: async () => toArray(await request("/api/reports")),
  createReport: (b) => request("/api/reports/export", { method: "POST", body: JSON.stringify(b) }),

  // --- Hàm bổ trợ cũ ---
  getUsers: async () => [],
  saveUsers: async () => [],
  saveCategories: async () => [],
  saveProducts: async () => []
};

export default api;