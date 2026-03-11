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
    const raw = (data.role || "KITCHEN_MANAGER")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    const roleEnum =
      {
        FRANCHISE: "STORE_MANAGER",
        KITCHEN_STAFF: "KITCHEN_MANAGER",
        KITCHEN: "KITCHEN_MANAGER",
      }[raw] || raw;
    const res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: data.username?.trim(),
        password: data.password,
        fullName: data.fullName ?? data.name?.trim(),
        role: roleEnum,
        email: data.email?.trim() || undefined,
        storeId: data.storeId?.trim() || undefined,
      }),
    });
    return res.message ?? res.msg ?? res;
  },

  /**
   * Cập nhật hồ sơ cá nhân (các role trừ Admin).
   * PUT /api/auth/update-profile
   * @typedef {Object} UpdateProfileRequest
   * @property {string} fullName - Họ tên (vd: "Nguyễn Văn B (Đã đổi tên)")
   * @property {string} email - Email (vd: "nguyenvanb_new@gmail.com")
   */
  async updateProfile(data) {
    const body = {
      fullName: (data.fullName ?? data.name ?? "").trim(),
      email: (data.email ?? "").trim(),
    };
    const res = await request("/api/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify(body),
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
   * Đổi mật khẩu trong Settings (khi đã đăng nhập).
   * PUT /api/settings/change-password
   * @typedef {Object} ChangePasswordRequest
   * @property {string} oldPassword - Mật khẩu hiện tại (vd: "123")
   * @property {string} newPassword - Mật khẩu mới (vd: "MatKhaumoi@2026")
   * @property {string} confirmPassword - Xác nhận mật khẩu mới (vd: "MatKhaumoi@2026")
   */
  async changePassword(oldPassword, newPassword, confirmPassword) {
    const res = await request("/api/settings/change-password", {
      method: "PUT",
      body: JSON.stringify({
        oldPassword: oldPassword ?? "",
        newPassword: newPassword ?? "",
        confirmPassword: confirmPassword ?? "",
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

  // --- Đơn hàng (kênh Admin / bếp trung tâm) ---
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
  /** Lấy toàn bộ công thức (dùng cho màn hình quản lý/ADMIN). */
  getManagerRecipes: async () => toArray(await request("/api/recipes")),
  /** Xem công thức của 1 sản phẩm theo productId. */
  getRecipeOfProduct: (pId) => request(`/api/recipes/${pId}`),
  /**
   * Lưu / Sửa công thức.
   * POST /api/recipes
   * body ví dụ:
   * { productId: "PRD_GA_RAN", ingredients: [{ ingredientId: "ING_THIT_GA", amountNeeded: 0.25 }] }
   */
  saveRecipe: (b) =>
    request("/api/recipes", { method: "POST", body: JSON.stringify(b) }),
  /** Xóa công thức của 1 sản phẩm. DELETE /api/recipes/{productId} */
  deleteRecipe: (productId) =>
    request(`/api/recipes/${productId}`, { method: "DELETE" }),

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
      return Array.isArray(res) ? res : (res?.data ?? []);
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách tất cả cửa hàng — dùng cho Bảng (Table) và Dropdown trong Admin.
   * GET /api/stores/all
   * Response: Array<{ storeId, name, address, phone, type, isActive }>
   */
  async getStoresAll() {
    try {
      const res = await request("/api/stores/all");
      return Array.isArray(res) ? res : (res?.data ?? []);
    } catch {
      return [];
    }
  },

  /**
   * Tạo cửa hàng mới. POST /api/stores
   * @typedef {Object} StoreRequest
   * @property {string} name - Tên cửa hàng (vd: "Cửa hàng Quận 1 - Chi nhánh A")
   * @property {string} address - Địa chỉ (vd: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM")
   * @property {string} phone - Số điện thoại (vd: "0901234567")
   * @property {string} type - Loại: "FRANCHISE" | "FLAGSHIP" | "KIOSK"
   * Ví dụ: { "name": "Cửa hàng Quận 1 - Chi nhánh A", "address": "123 Lê Lợi...", "phone": "0901234567", "type": "FRANCHISE" }
   */
  createStore(b) {
    const body = {
      name: (b.name ?? "").trim(),
      address: (b.address ?? "").trim(),
      phone: (b.phone ?? "").trim(),
      type: (b.type || "FRANCHISE").toUpperCase(),
    };
    return request("/api/stores", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * Cập nhật cửa hàng. PUT /api/stores/{id} — Body: StoreRequest (name, address, phone, type)
   */
  updateStore(id, b) {
    const body = {
      name: (b.name ?? "").trim(),
      address: (b.address ?? "").trim(),
      phone: (b.phone ?? "").trim(),
      type: (b.type || "FRANCHISE").toUpperCase(),
    };
    return request(`/api/stores/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteStore(id) {
    return request(`/api/stores/${id}`, { method: "DELETE" });
  },

  // --- Giỏ hàng cửa hàng (STORE_MANAGER) ---
  /** Xem giỏ hàng. GET /api/store/cart */
  async getStoreCart() {
    try {
      const res = await request("/api/store/cart");
      const items = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
      return items;
    } catch {
      return [];
    }
  },

  /**
   * Thêm món vào giỏ. POST /api/store/cart/add
   * Body: { productId, quantity } (quantity mặc định 1)
   */
  addToStoreCart(body) {
    return request("/api/store/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId: body.productId ?? body.id,
        quantity: Number(body.quantity) ?? 1,
      }),
    });
  },

  /**
   * Sửa số lượng 1 món. PUT /api/store/cart/update
   * Body: { productId, quantity }
   */
  updateStoreCartItem(body) {
    return request("/api/store/cart/update", {
      method: "PUT",
      body: JSON.stringify({
        productId: body.productId ?? body.id,
        quantity: Number(body.quantity) ?? 0,
      }),
    });
  },

  /** Xóa 1 món khỏi giỏ. DELETE /api/store/cart/remove/{productId} */
  removeFromStoreCart(productId) {
    return request(`/api/store/cart/remove/${productId}`, {
      method: "DELETE",
    });
  },

  /**
   * Chốt đơn từ giỏ. POST /api/store/cart/checkout
   * Body: { orderType: "STANDARD", note?: string }
   */
  checkoutStoreCart(body) {
    return request("/api/store/cart/checkout", {
      method: "POST",
      body: JSON.stringify({
        orderType: body.orderType ?? "STANDARD",
        note: (body.note ?? "").trim() || undefined,
      }),
    });
  },

  /** Xem profile tiệm. GET /api/store/settings/profile */
  async getStoreProfile() {
    try {
      const res = await request("/api/store/settings/profile");
      return res ?? {};
    } catch {
      return {};
    }
  },

  /**
   * Sửa profile tiệm. PUT /api/store/settings/profile
   * Body: { name, address, phone }
   */
  updateStoreProfile(body) {
    return request("/api/store/settings/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: (body.name ?? "").trim(),
        address: (body.address ?? "").trim(),
        phone: (body.phone ?? "").trim(),
      }),
    });
  },

  createCategory: (body) => categoriesApi.create(body),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),
  createIngredient: (body) => ingredientsApi.create(body),
  createProduct: (body) => productsApi.create(body),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  importInventory: (body) => inventoryApi.import(body),
  cook: (body) => kitchenApi.cook(body),

  // =========================================================
  // Đơn hàng STORE_MANAGER (cửa hàng)
  // =========================================================

  /**
   * Danh sách đơn hàng của tiệm hiện tại (STORE_MANAGER).
   * GET /api/store/orders
   */
  async getStoreOrders() {
    try {
      const res = await request("/api/store/orders");
      return Array.isArray(res) ? res : (res?.data ?? []);
    } catch {
      return [];
    }
  },

  /**
   * Chi tiết 1 đơn hàng của tiệm.
   * GET /api/store/orders/{orderId}
   */
  getStoreOrderDetail(orderId) {
    return request(`/api/store/orders/${orderId}`);
  },

  /**
   * Tạo đơn nhanh (không qua giỏ) cho tiệm.
   * - orderType: "STANDARD" hoặc "URGENT"
   * - body dùng JSON giống luồng cửa hàng:
   *   { deliveryDate, note, items: [{ productId, quantity, price }] }
   */
  createStoreOrder(body, orderType = "STANDARD") {
    const path =
      orderType === "URGENT"
        ? "/api/store/orders/urgent"
        : "/api/store/orders/standard";
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Giữ tương thích với code cũ: getOrders() trả danh sách đơn của tiệm
  async getOrders() {
    return this.getStoreOrders();
  },

  /**
   * Tạo tài khoản mới bởi Admin.
   * POST /api/admin/register
   *
   * @typedef {Object} RegisterRequest
   * @property {string} username - Tên đăng nhập (vd: "q1_store")
   * @property {string} password - Mật khẩu (vd: "123")
   * @property {string} fullName - Họ tên (vd: "Quản lý Quận 1")
   * @property {string} role - Vai trò: "STORE_MANAGER" | "KITCHEN_MANAGER" | "ADMIN" | "MANAGER" | "COORDINATOR"
   * @property {string} email - Email (vd: "quanlyq1@centralkitchen.com")
   * @property {string} [storeId] - Mã cửa hàng, bắt buộc khi role = STORE_MANAGER (vd: "ST01")
   * @property {string} [storeName] - Tên cửa hàng (tùy chọn)
   *
   * Ví dụ RegisterRequest:
   * { "username": "q1_store", "password": "123", "fullName": "Quản lý Quận 1", "role": "STORE_MANAGER", "email": "quanlyq1@centralkitchen.com", "storeId": "ST01" }
   *
   * Response: AccountResponse (accountId, username, role, isActive, userId, fullName, email).
   *
   * @param {RegisterRequest & { name?: string }} data - Dữ liệu đăng ký (name được map sang fullName)
   * @returns {Promise<string|object>}
   */
  async createUser(data) {
    const raw = (data.role || "KITCHEN_MANAGER")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    const roleEnum =
      {
        FRANCHISE: "STORE_MANAGER",
        KITCHEN_STAFF: "KITCHEN_MANAGER",
        KITCHEN: "KITCHEN_MANAGER",
      }[raw] || raw;
    /** @type {RegisterRequest} */
    const body = {
      username: (data.username ?? "").trim(),
      password: data.password ?? "",
      fullName: (data.fullName ?? data.name ?? "").trim(),
      role: roleEnum,
      email: (data.email ?? "").trim(),
    };
    if (data.storeId != null && String(data.storeId).trim())
      body.storeId = String(data.storeId).trim();
    if (data.storeName != null && String(data.storeName).trim())
      body.storeName = String(data.storeName).trim();
    const res = await request("/api/admin/register", {
      method: "POST",
      body: JSON.stringify(body),
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
        status:
          a.isActive !== false && a.active !== false ? "active" : "inactive",
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

  /**
   * Khóa / Mở khóa tài khoản (Admin).
   * PUT /api/admin/accounts/{accountId}/status
   * @param {string} accountId - Mã tài khoản (accountId)
   * @param {boolean} isActive - true = mở khóa, false = khóa
   * @returns {Promise<object>} Response từ backend
   */
  async updateAccountStatus(accountId, isActive) {
    return request(`/api/admin/accounts/${accountId}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !!isActive }),
    });
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
   * Báo cáo xe giao THIẾU hàng (STORE_MANAGER).
   * POST /api/shipments/{shipmentId}/report
   * Body: { reportedItems: [{ productId, receivedQuantity, note }] }
   */
  reportShipmentShortage(shipmentId, body) {
    return request(`/api/shipments/${shipmentId}/report`, {
      method: "POST",
      body: JSON.stringify({
        reportedItems: (body.reportedItems || []).map((i) => ({
          productId: i.productId ?? i.id,
          receivedQuantity: Number(i.receivedQuantity ?? i.quantity ?? 0),
          note: (i.note ?? "").trim() || undefined,
        })),
      }),
    });
  },

  /**
   * Chốt nhận ĐỦ HÀNG (STORE_MANAGER).
   * PATCH /api/store/orders/{orderId}/confirm-receipt?updateStock=true
   * Body: { note?: string }
   */
  confirmOrderReceipt(orderId, body = {}, updateStock = true) {
    const q = new URLSearchParams();
    if (updateStock !== undefined) q.set("updateStock", String(updateStock));
    const query = q.toString();
    const path = query
      ? `/api/store/orders/${orderId}/confirm-receipt?${query}`
      : `/api/store/orders/${orderId}/confirm-receipt`;
    return request(path, {
      method: "PATCH",
      body: JSON.stringify({
        note: (body.note ?? "").trim() || undefined,
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
