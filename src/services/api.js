/**
 * ====================================================================
 * API SERVICE - ULTIMATE STABLE VERSION
 * Version: 2026 - Real API Integration (No more fake users)
 * ====================================================================
 */

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8081";
const TOKEN_KEY = "ck_token";
const USER_KEY = "ck_user";

// --- QUẢN LÝ LOCAL STORAGE ---
const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) =>
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setUser: (u) =>
    u
      ? localStorage.setItem(USER_KEY, JSON.stringify(u))
      : localStorage.removeItem(USER_KEY),
};

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

/**
 * Suy ra lỗi theo trường từ nội dung backend (email, mật khẩu, OTP, tên đăng nhập).
 */
function messageByField(s) {
  if (
    s.includes("email") ||
    s.includes("gmail") ||
    s.includes("mail") ||
    s.includes("user not found") ||
    s.includes("not found")
  )
    return "Email không đúng.";
  if (
    s.includes("password") ||
    s.includes("mật khẩu") ||
    s.includes("wrong") ||
    s.includes("sai mật khẩu") ||
    s.includes("invalid password")
  )
    return "Mật khẩu không đúng.";
  if (
    s.includes("username") ||
    s.includes("tên đăng nhập") ||
    s.includes("login")
  )
    return "Tên đăng nhập không đúng.";
  if (s.includes("otp") || s.includes("mã") || s.includes("code"))
    return "Mã OTP không đúng.";
  return null;
}

/**
 * Lỗi theo ngữ cảnh API (khi backend trả Forbidden/401/400 chung).
 */
function messageByPath(path) {
  const p = (path || "").toLowerCase();
  if (p.includes("/auth/login"))
    return "Tên đăng nhập hoặc mật khẩu không đúng.";
  if (p.includes("/auth/forgot-password")) return "Email không đúng.";
  if (p.includes("/auth/verify-otp")) return "Mã OTP không đúng.";
  if (p.includes("/auth/reset-password"))
    return "Mã OTP không đúng hoặc mật khẩu mới không hợp lệ.";
  return null;
}

function toUserFriendlyError(res, data, path) {
  const status = res.status;
  const raw =
    data.message ||
    data.error ||
    (typeof data.msg === "string" ? data.msg : null) ||
    res.statusText ||
    "";
  const s = String(raw).trim().toLowerCase();

  const byField = messageByField(s);
  if (byField) return byField;

  if (status === 401) {
    const byPath = messageByPath(path);
    if (byPath) return byPath;
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  }
  if (status === 403) {
    const byPath = messageByPath(path);
    if (byPath) return byPath;
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (status === 404) return "Không tìm thấy dữ liệu.";
  if (status === 400) {
    const byPath = messageByPath(path);
    if (byPath) return byPath;
    return raw || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  }
  if (status === 422) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  if (status >= 500) return "Lỗi hệ thống. Vui lòng thử lại sau.";
  if (raw) return typeof raw === "string" ? raw : JSON.stringify(raw);
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

/** Gọi API: tự gắn Bearer token nếu có. Hỗ trợ response JSON hoặc text (trả về { message } nếu là text). */
function request(path, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  const token = storage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers }).then(async (res) => {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    const friendlyMessage = toUserFriendlyError(res, data, path);
    if (res.status === 401) {
      setToken(null);
      setStoredUser(null);
      throw new Error(friendlyMessage);
    }
    if (!res.ok) {
      throw new Error(friendlyMessage);
    }
    return data;
  });
}

// --- BẢO HIỂM MẢNG (CHỐNG LỖI .FILTER) ---
const toArray = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

// --- CHUẨN HÓA ROLE (GIỐNG BẠN CỦA BẠN) ---
function normalizeRole(role) {
  if (!role) return "franchise";
  const r = String(role).toUpperCase().replace(/-/g, "_");
  if (r === "ADMIN") return "admin";
  if (r === "KITCHEN_MANAGER" || r === "MANAGER") return "manager";
  if (r === "KITCHEN_STAFF" || r === "KITCHEN") return "kitchen";
  if (r === "STORE_MANAGER") return "franchise";
  return r.toLowerCase();
}

// =========================================================
// [API OBJECT CHÍNH]
// =========================================================

const auth = {
  isAuthenticated: () => !!storage.getToken(),
  getStoredUser,

  /**
   * Đăng nhập (bước 1).
   * Backend trả: { token, username, role } hoặc OTP: { token: null, message: "OTP_REQUIRED", username }.
   */
  async login(username, password) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const raw = res?.data ?? res;
    const requiresOtp = Boolean(
      raw.requiresOtp ?? res.requiresOtp ?? res.message === "OTP_REQUIRED",
    );
    const token =
      raw.token ??
      raw.accessToken ??
      raw.access_token ??
      res.token ??
      res.accessToken ??
      res.access_token;

    if (requiresOtp || !token || typeof token !== "string") {
      return {
        requiresOtp: true,
        username: res.username ?? username,
      };
    }
    setToken(token);
    const info = raw ?? res;
    const user = {
      id: info.userId ?? info.id ?? info.username,
      username: info.username ?? res.username,
      name: info.fullName ?? info.name ?? info.username ?? res.username,
      role: normalizeRole(info.role ?? res.role),
      roleRaw: info.role ?? res.role,
    };
    setStoredUser(user);
    return user;
  },

  /**
   * Xác nhận OTP đăng nhập. Backend nhận { username, otp }, trả { token, username, role, message }.
   */
  async verifyOtp(otp, emailOrUsername) {
    const res = await request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        username: emailOrUsername,
        otp,
      }),
    });
    const token = res.token ?? res.accessToken ?? res.access_token;
    if (token && typeof token === "string") {
      setToken(token);
      const user = {
        id: res.userId ?? res.username,
        username: res.username ?? emailOrUsername,
        name: res.fullName ?? res.username ?? emailOrUsername,
        role: normalizeRole(res.role),
        roleRaw: res.role,
      };
      setStoredUser(user);
      return user;
    }
    return res;
  },

  /**
   * Đăng ký tài khoản. Request: { username, password, fullName, role, email, storeId }.
   * Trả message hoặc AccountResponse (accountId, username, role, isActive, userId, fullName, email).
   */
  async register(data) {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: data.username?.trim(),
        password: data.password,
        fullName: data.fullName ?? data.name?.trim(),
        role: (data.role || "KITCHEN_STAFF").toUpperCase().replace(/[\s-]/g, "_"),
        email: data.email?.trim() || undefined,
        storeId: data.storeId?.trim() || undefined,
      }),
    });
    return res.message ?? res.msg ?? res;
  },

  /** Cập nhật hồ sơ. Request: { fullName, email }. */
  async updateProfile(data) {
    const res = await request("/api/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify({
        fullName: data.fullName ?? data.name?.trim(),
        email: data.email?.trim(),
      }),
    });
    const current = getStoredUser();
    if (res && current) {
      setStoredUser({
        ...current,
        name: res.fullName ?? current.name,
        email: res.email ?? current.email,
      });
    }
    return res;
  },

  /**
   * Đổi mật khẩu (khi đã đăng nhập). Request: { oldPassword, newPassword, confirmPassword }.
   */
  async changePassword(oldPassword, newPassword, confirmPassword) {
    const res = await request("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword,
      }),
    });
    return res.message ?? res.msg ?? res;
  },

  /** Đăng xuất: xóa token và user */
  logout() {
    setToken(null);
    setStoredUser(null);
  },

  // --- Quản lý Sản phẩm ---
  getProducts: async () => toArray(await request("/api/products")),
  getMasterProducts: async () => toArray(await request("/api/products")),
  createProduct: (b) =>
    request("/api/products", { method: "POST", body: JSON.stringify(b) }),
  createMasterProduct: (b) =>
    request("/api/products", { method: "POST", body: JSON.stringify(b) }),
  updateProduct: (id, b) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  updateMasterProduct: (id, b) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  deleteMasterProduct: (id) =>
    request(`/api/products/${id}`, { method: "DELETE" }),

  // --- Quản lý Cửa hàng ---
  getStores: async () => toArray(await request("/api/stores")),
  /**
   * Tạo cửa hàng (admin). Request: { name, address, phone, type (KIOSK/FLAGSHIP) }.
   * Response: StoreResponse { storeId, name, address, phone, type, isActive }.
   */
  createStore: (b) =>
    request("/api/stores", {
      method: "POST",
      body: JSON.stringify({
        name: b.name?.trim(),
        address: (b.address || "").trim(),
        phone: (b.phone || "").trim(),
        type: (b.type || "FLAGSHIP").toUpperCase(),
      }),
    }),
  updateStore: (id, b) =>
    request(`/api/stores/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: b.name,
        phone: b.phone,
        address: b.address,
      }),
    }),
  deleteStore: (id) => request(`/api/stores/${id}`, { method: "DELETE" }),

  // --- Quản lý Danh mục ---
  getCategories: async () => toArray(await request("/api/categories")),
  createCategory: (b) =>
    request("/api/categories", { method: "POST", body: JSON.stringify(b) }),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),

  // --- Nguyên liệu & Kho ---
  getIngredients: async () => toArray(await request("/api/ingredients")),
  createIngredient: (b) =>
    request("/api/ingredients", { method: "POST", body: JSON.stringify(b) }),
  updateIngredient: (id, b) =>
    request(`/api/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(b),
    }),
  deleteIngredient: (id) =>
    request(`/api/ingredients/${id}`, { method: "DELETE" }),
  getManagerInventory: async () =>
    toArray(await request("/api/inventory/overview")),
  importInventory: (b) =>
    request("/api/inventory/import", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // --- Đơn hàng ---
  getAllOrders: async () => toArray(await request("/api/orders")),
  getOrdersHistory: async (sId) =>
    toArray(await request(`/api/orders/history?storeId=${sId}`)),
  addOrder: (b) =>
    request("/api/orders/standard", {
      method: "POST",
      body: JSON.stringify(b),
    }),
  addOrderUrgent: (b) =>
    request("/api/orders/urgent", { method: "POST", body: JSON.stringify(b) }),
  cancelOrder: (id) => request(`/api/orders/${id}/cancel`, { method: "PUT" }),

  // --- Công thức (BOM) ---
  getManagerRecipes: async () => toArray(await request("/api/recipes")),
  getRecipeOfProduct: (pId) => request(`/api/recipes/${pId}`),
  saveRecipe: (b) =>
    request("/api/recipes", { method: "POST", body: JSON.stringify(b) }),

  // --- Bếp (Kitchen) ---
  getKitchenAggregation: () => request("/api/kitchen/aggregation"),
  confirmAggregation: (b) =>
    request("/api/kitchen/aggregation/confirm", {
      method: "POST",
      body: JSON.stringify(b),
    }),
  cook: (b) =>
    request("/api/kitchen/cook", { method: "POST", body: JSON.stringify(b) }),
  getActiveProductions: async () =>
    toArray(await request("/api/kitchen/productions/active")),
  getProductionRuns: async () =>
    toArray(await request("/api/kitchen/productions/active")),
  updateProductionRunStatus: (id, s) =>
    request(`/api/production-runs/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: s }),
    }),
  reportWastage: (b) =>
    request("/api/kitchen/wastage", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // --- Sự cố ---
  getIncidents: async () => toArray(await request("/api/incidents")),
  createIncident: (b) =>
    request("/api/incidents", { method: "POST", body: JSON.stringify(b) }),
  updateIncidentStatus: (id, s) =>
    request(`/api/incidents/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: s }),
    }),

  // --- Thống kê & Quy đổi ---
  getKPIStats: async () => {
    const res = await request("/api/dashboard/kpi");
    return toArray(res);
  },

  /** Yêu cầu gửi OTP quên mật khẩu (email hoặc username) */
  async forgotPassword(emailOrUsername) {
    const res = await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: emailOrUsername }),
    });
    return res.message ?? res.msg ?? res;
  },

  /** Đặt lại mật khẩu bằng OTP. Body: { email, otp, newPassword }. */
  async resetPassword(otp, newPassword, emailOrUsername) {
    const res = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: emailOrUsername,
        otp,
        newPassword,
      }),
    });
    return res.message ?? res.msg ?? res;
  },

  /** Lấy thông tin Role/Username hiện tại (Debug) */
  async checkMe() {
    return request("/api/auth/check-me", { method: "GET" });
  },
};

// --- Products & Categories ---

/** Map Product/response sang UI: productId, productName, categoryId, categoryName, sellingPrice, baseUnit, isActive. */
function mapProduct(p) {
  return {
    id: p.productId || p.id,
    productId: p.productId,
    name: p.productName || p.name,
    productName: p.productName || p.name,
    category: p.categoryName || p.category || "",
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    price: Number(p.sellingPrice ?? p.price ?? 0),
    sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
    baseUnit: p.baseUnit || "TÔ",
    stock: p.stock ?? 0,
    min: p.min ?? 0,
    emoji: p.emoji || "🍽️",
    active: p.isActive !== false && p.active !== false,
    isActive: p.isActive !== false && p.active !== false,
  };
}

const productsApi = {
  /** Danh sách sản phẩm: hỗ trợ phân trang, tìm kiếm, lọc giá */
  async getList(params = {}) {
    const q = new URLSearchParams();
    if (params.page != null) q.set("page", params.page);
    if (params.limit != null) q.set("limit", params.limit);
    if (params.search) q.set("search", params.search);
    if (params.minPrice != null) q.set("minPrice", params.minPrice);
    if (params.maxPrice != null) q.set("maxPrice", params.maxPrice);
    const query = q.toString();
    const path = query ? `/api/products?${query}` : "/api/products";
    const res = await request(path);
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];
    return (list || []).map(mapProduct);
  },

  /**
   * Tạo sản phẩm kèm công thức (admin). Request: { productId, productName, categoryId, sellingPrice, baseUnit, isActive, ingredients: [{ ingredientId, amountNeeded }] }.
   * Response: { productId, productName, categoryId, categoryName, sellingPrice, baseUnit, isActive }.
   */
  async create(body) {
    const res = await request("/api/products", {
      method: "POST",
      body: JSON.stringify({
        productId: body.productId?.trim(),
        productName: body.productName ?? body.name?.trim(),
        categoryId: body.categoryId,
        sellingPrice: Number(body.sellingPrice ?? body.price ?? 0),
        baseUnit: (body.baseUnit || "TÔ").toUpperCase(),
        isActive: body.isActive !== false,
        ingredients: (body.ingredients || []).map((i) => ({
          ingredientId: i.ingredientId ?? i.id,
          amountNeeded: Number(i.amountNeeded ?? i.amount ?? 0),
        })),
      }),
    });
    return res;
  },
};

const categoriesApi = {
  /** Danh sách danh mục (nếu backend có GET /api/categories) */
  async getList() {
    try {
      const res = await request("/api/categories");
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return [];
    }
  },

  /** Tạo danh mục. Body: { name, description }. */
  async create(body) {
    return request("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        description: body.description || "",
      }),
    });
  },
};

// --- Ingredients & Inventory ---

const ingredientsApi = {
  /** Danh sách nguyên liệu (GET /api/ingredients) */
  async getList() {
    try {
      const res = await request("/api/ingredients");
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      return [];
    }
  },

  /** Tạo nguyên liệu. Body: { ingredientId, ingredientName, unit }. */
  async create(body) {
    return request("/api/ingredients", {
      method: "POST",
      body: JSON.stringify({
        ingredientId: body.ingredientId ?? body.id,
        ingredientName: body.ingredientName ?? body.name,
        unit: body.unit || "kg",
      }),
    });
  },
};

const inventoryApi = {
  /**
   * Nhập kho (admin + manager). Request: { note, supplierId, items: [{ ingredientId, unit, quantity, importPrice }] }.
   * Response: Phiếu nhập kho chi tiết (ticketId, importDate, note, totalAmount, status, createdByName, items).
   */
  async import(body) {
    return request("/api/inventory/import", {
      method: "POST",
      body: JSON.stringify({
        note: body.note || "",
        supplierId: body.supplierId || undefined,
        items: (body.items || []).map((i) => ({
          ingredientId: i.ingredientId ?? i.id,
          unit: (i.unit || "KG").toUpperCase(),
          quantity: Number(i.quantity) || 0,
          importPrice: Number(i.importPrice) || 0,
        })),
      }),
    });
  },
};

// --- Kitchen ---

const kitchenApi = {
  /**
   * Nấu thành phẩm (admin). Request: { productId, quantity, note }.
   * Response: { runId, productName, plannedQty, status, productionDate }.
   */
  async cook(body) {
    return request("/api/kitchen/cook", {
      method: "POST",
      body: JSON.stringify({
        productId: body.productId ?? body.id,
        quantity: Number(body.quantity) || 1,
        note: body.note || undefined,
      }),
    });
  },
};

// --- API object thống nhất (tương thích code cũ) ---

const api = {
  init() {},

  isAuthenticated: () => auth.isAuthenticated(),
  login: (username, password) => auth.login(username, password),
  logout: () => auth.logout(),
  getStoredUser: () => auth.getStoredUser(),

  register: (data) => auth.register(data),
  updateProfile: (data) => auth.updateProfile(data),

  async getProducts(params) {
    return productsApi.getList(params || {});
  },

  async getIngredients() {
    return ingredientsApi.getList();
  },

  checkMe: () => auth.checkMe(),
  forgotPassword: (emailOrUsername) => auth.forgotPassword(emailOrUsername),
  verifyOtp: (otp, emailOrUsername) => auth.verifyOtp(otp, emailOrUsername),
  resetPassword: (otp, newPassword, emailOrUsername) =>
    auth.resetPassword(otp, newPassword, emailOrUsername),
  changePassword: (oldPassword, newPassword, confirmPassword) =>
    auth.changePassword(oldPassword, newPassword, confirmPassword),

  async getCategories() {
    return categoriesApi.getList();
  },

  async getStores() {
    try {
      const res = await request("/api/stores");
      return Array.isArray(res) ? res : res?.data ?? [];
    } catch {
      return [];
    }
  },

  /** Tạo cửa hàng (admin). Request: { name, address, phone, type }. Response: StoreResponse */
  createStore(b) {
    return request("/api/stores", {
      method: "POST",
      body: JSON.stringify({
        name: b.name?.trim(),
        address: (b.address || "").trim(),
        phone: (b.phone || "").trim(),
        type: (b.type || "FLAGSHIP").toUpperCase(),
      }),
    });
  },

  updateStore(id, b) {
    return request(`/api/stores/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: b.name,
        phone: b.phone,
        address: b.address,
      }),
    });
  },

  deleteStore(id) {
    return request(`/api/stores/${id}`, { method: "DELETE" });
  },

  createCategory: (body) => categoriesApi.create(body),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
  createIngredient: (body) => ingredientsApi.create(body),
  createProduct: (body) => productsApi.create(body),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  importInventory: (body) => inventoryApi.import(body),
  cook: (body) => kitchenApi.cook(body),

  /** Orders: backend chưa cung cấp API */
  async getOrders() {
    return [];
  },
  async addOrder() {
    return {};
  },

  /**
   * Admin tạo tài khoản nhân viên. Request: username, password, email, fullName, role, storeId (hoặc storeName).
   * Response: AccountResponse (accountId, username, role, isActive, userId, fullName, email).
   */
  async createUser(data) {
    const res = await request("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username: data.username?.trim(),
        password: data.password,
        email: data.email?.trim(),
        fullName: data.fullName ?? data.name?.trim(),
        role: (data.role || "KITCHEN_STAFF").toUpperCase().replace(/[\s-]/g, "_"),
        storeId: data.storeId?.trim() || undefined,
        storeName: data.storeName?.trim() || undefined,
      }),
    });
    return res.message ?? res.msg ?? res;
  },

  /**
   * Danh sách tài khoản (AccountResponse): accountId, username, role, isActive, userId, fullName, email.
   */
  async getUsers() {
    try {
      const list = await request("/api/admin/list-accounts");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => ({
        id: a.accountId ?? a.userId,
        accountId: a.accountId,
        username: a.username,
        name: a.fullName ?? a.username,
        role: normalizeRole(a.role),
        roleRaw: a.role,
        status: a.isActive !== false && a.active !== false ? "active" : "inactive",
        storeName: a.storeName ?? null,
        email: a.email ?? null,
        userId: a.userId,
      }));
    } catch {
      return [];
    }
  },

  /** Chỉ tài khoản đang hoạt động (isActive = true). */
  async getActiveAccounts() {
    try {
      const list = await request("/api/admin/list-accounts/active");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => ({
        id: a.accountId ?? a.userId,
        accountId: a.accountId,
        username: a.username,
        name: a.fullName ?? a.username,
        role: normalizeRole(a.role),
        status: "active",
        userId: a.userId,
        email: a.email ?? null,
      }));
    } catch {
      return [];
    }
  },

  /** Chỉ tài khoản bị khóa / vô hiệu hóa (isActive = false). */
  async getInactiveAccounts() {
    try {
      const list = await request("/api/admin/list-accounts/inactive");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => ({
        id: a.accountId ?? a.userId,
        accountId: a.accountId,
        username: a.username,
        name: a.fullName ?? a.username,
        role: normalizeRole(a.role),
        status: "inactive",
        userId: a.userId,
        email: a.email ?? null,
      }));
    } catch {
      return [];
    }
  },

  /** Lưu/cập nhật user (Admin): backend chưa có API bulk, giữ tương thích */
  async saveUsers(users) {
    return users;
  },

  async saveCategories() {
    return [];
  },
  async saveProducts() {
    return [];
  },

  /** Báo hoàn thành chuyến hàng. GET /api/shipments/{shipId}/report */
  async reportShipment(shipId) {
    const res = await request(`/api/shipments/${shipId}/report`);
    return res.message ?? res.msg ?? res;
  },

  /**
   * Store manager: Báo cáo thực giao. Request: { reportedItems: [{ productId, receivedQuantity, note }] }.
   */
  async reportDelivery(body) {
    return request("/api/shipments/report-delivery", {
      method: "POST",
      body: JSON.stringify({
        reportedItems: (body.reportedItems || []).map((i) => ({
          productId: i.productId ?? i.id,
          receivedQuantity: Number(i.receivedQuantity ?? i.quantity ?? 0),
          note: i.note || undefined,
        })),
      }),
    });
  },

  /**
   * Phân tuyến tự động (admin). Request: { deliveryDate, maxOrdersPerTrip, maxUrgentPerTrip }.
   * Response: { urgentOrders, standardOrders, urgentTripsCreated, standardTripsCreated, totalTripsCreated }.
   */
  async autoRouting(body) {
    return request("/api/routing/auto", {
      method: "POST",
      body: JSON.stringify({
        deliveryDate: body.deliveryDate,
        maxOrdersPerTrip: Number(body.maxOrdersPerTrip) ?? 10,
        maxUrgentPerTrip: Number(body.maxUrgentPerTrip) ?? 2,
      }),
    });
  },

  /** Giải quyết đơn bù cho chuyến hàng chưa giao thành công. */
  async resolveReplacement(shipId) {
    const res = await request(`/api/shipments/${shipId}/resolve-replacement`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return res.message ?? res.msg ?? res;
  },
};

export default api;
