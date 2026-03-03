/**
 * API service - Kết nối backend Central Kitchen.
 * Ghi chú: Giữ nguyên code gốc của nhóm, chỉ thêm Fake Login và phần Central Kitchen.
 */
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : (process.env.REACT_APP_API_URL || "http://localhost:8081");
const TOKEN_KEY = "ck_token";
const USER_KEY = "ck_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

/** Gọi API: tự gắn Bearer token nếu có */
function request(path, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setToken(null);
      setStoredUser(null);
      throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    }
    if (!res.ok) {
      const msg = data.message || data.error || res.statusText;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data;
  });
}

/** Chuẩn hóa role backend */
function normalizeRole(role) {
  if (!role) return "franchise";
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "KITCHEN_STAFF" || r === "KITCHEN") return "kitchen";
  return r.toLowerCase();
}

// --- Auth ---

const auth = {
  // Đã sửa thành FAKE LOGIN theo ý bạn
  async login(username, password) {
    const fakeUsers = [
      { username: "admin", password: "123", role: "admin", name: "Sếp Tổng (Admin)" },
      { username: "manager", password: "123", role: "manager", name: "Quản lý Cấp Cao" },
      { username: "kitchen", password: "123", role: "kitchen", name: "Bếp Trưởng" },
      { username: "franchise", password: "123", role: "franchise", name: "CN Quận 1" },
    ];

    const found = fakeUsers.find(u => u.username === username && u.password === password);
    if (!found) throw new Error("Sai tài khoản hoặc mật khẩu");

    const user = {
      id: found.username,
      username: found.username,
      name: found.name,
      role: found.role,
    };

    setToken("fake-token-ck-2026");
    setStoredUser(user);
    return user;
  },

  logout() {
    setToken(null);
    setStoredUser(null);
  },

  getStoredUser() {
    return getStoredUser();
  },

  isAuthenticated() {
    return Boolean(getToken());
  },

  async register({ username, password, fullName, employeeCode, role }) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, fullName, employeeCode, role: role || "KITCHEN_STAFF" }),
    });
  },

  async updateProfile(payload) {
    return request("/api/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

// --- Products & Categories (Giữ nguyên mapProduct của nhóm) ---
function mapProduct(p) {
  return {
    id: p.productId || p.id,
    name: p.productName || p.name,
    category: p.categoryName || p.category || "",
    price: Number(p.sellingPrice ?? p.price ?? 0),
    stock: p.stock ?? 0,
    min: p.min ?? 0,
    emoji: p.emoji || "🍽️",
    active: p.active !== false,
  };
}

const productsApi = {
  async getList() {
    const res = await request("/api/products");
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    return (list || []).map(mapProduct);
  },
  async create(body) { return request("/api/products", { method: "POST", body: JSON.stringify(body) }); },
  async update(id, body) { return request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) }); },
  async delete(id) { return request(`/api/products/${id}`, { method: "DELETE" }); }
};

const categoriesApi = {
  async getList() {
    const res = await request("/api/categories");
    return Array.isArray(res) ? res : res.data || [];
  },
  async create(body) { return request("/api/categories", { method: "POST", body: JSON.stringify(body) }); },
  async update(id, body) { return request(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }); },
  async delete(id) { return request(`/api/categories/${id}`, { method: "DELETE" }); }
};

// --- Ingredients & Runs ---
const centralKitchenApi = {
  // Nguyên liệu
  async getIngredients() { return request("/api/ingredients"); },
  async createIngredient(body) { return request("/api/ingredients", { method: "POST", body: JSON.stringify(body) }); },
  async updateIngredient(id, body) { return request(`/api/ingredients/${id}`, { method: "PUT", body: JSON.stringify(body) }); },
  async deleteIngredient(id) { return request(`/api/ingredients/${id}`, { method: "DELETE" }); },
  // Phiếu nấu
  async getProductionRuns() { return request("/api/production-runs"); },
  async updateRunStatus(id, status) { return request(`/api/production-runs/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }); },
  // Sự cố
  async getIncidents() { return request("/api/incidents"); },
  async createIncident(body) { return request("/api/incidents", { method: "POST", body: JSON.stringify(body) }); },
  async updateIncidentStatus(id, status) { return request(`/api/incidents/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }); }
};

// --- API object thống nhất ---
const api = {
  init() { },
  isAuthenticated: () => auth.isAuthenticated(),
  login: (username, password) => auth.login(username, password),
  logout: () => auth.logout(),
  getStoredUser: () => auth.getStoredUser(),
  register: (data) => auth.register(data),
  updateProfile: (data) => auth.updateProfile(data),

  // Hàm cho CENTRAL KITCHEN (Phần của bạn)
  getProducts: () => productsApi.getList(),
  updateProduct: (id, body) => productsApi.update(id, body),
  deleteProduct: (id) => productsApi.delete(id),

  getCategories: () => categoriesApi.getList(),
  createCategory: (body) => categoriesApi.create(body),
  updateCategory: (id, body) => categoriesApi.update(id, body),
  deleteCategory: (id) => categoriesApi.delete(id),

  getIngredients: () => centralKitchenApi.getIngredients(),
  createIngredient: (body) => centralKitchenApi.createIngredient(body),
  updateIngredient: (id, body) => centralKitchenApi.updateIngredient(id, body),
  deleteIngredient: (id) => centralKitchenApi.deleteIngredient(id),

  getProductionRuns: () => centralKitchenApi.getProductionRuns(),
  updateProductionRunStatus: (id, status) => centralKitchenApi.updateRunStatus(id, status),

  getIncidents: () => centralKitchenApi.getIncidents(),
  createIncident: (body) => centralKitchenApi.createIncident(body),
  updateIncidentStatus: (id, status) => centralKitchenApi.updateIncidentStatus(id, status),

  // HÀM GỐC CỦA NHÓM (GIỮ NGUYÊN ĐỂ KHÔNG LỖI MANAGER/ADMIN)
  createProduct: (body) => productsApi.create(body),
  importInventory: (body) => request("/api/inventory/import", { method: "POST", body: JSON.stringify(body) }),
  cook: (body) => request("/api/kitchen/cook", { method: "POST", body: JSON.stringify(body) }),
  async getOrders() { return []; },
  async addOrder() { return {}; },
  async getUsers() { return []; },
  async saveUsers() { return []; },
  async saveCategories() { return []; },
  async saveProducts() { return []; },
};

export default api;