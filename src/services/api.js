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
function messageByPath(path, status) {
  const p = (path || "").toLowerCase();
  if (p.includes("/auth/login"))
    return "Tên đăng nhập hoặc mật khẩu không đúng.";
  if (p.includes("/auth/forgot-password")) return "Email không đúng.";
  if (p.includes("/auth/verify-otp")) return "Mã OTP không đúng.";
  if (p.includes("/auth/reset-password"))
    return "Mã OTP không đúng hoặc mật khẩu mới không hợp lệ.";
  if (status === 403 && p.includes("/admin/accounts"))
    return "Bạn không có quyền thực hiện thao tác này. Chỉ tài khoản Admin mới thực hiện được — hãy đăng nhập bằng tài khoản Admin hoặc kiểm tra cấu hình quyền trên backend.";
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
    const byPath = messageByPath(path, status);
    if (byPath) return byPath;
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  }
  if (status === 403) {
    const byPath = messageByPath(path, status);
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
  if (r === "MANAGER") return "manager";
  if (r === "KITCHEN_MANAGER") return "kitchen";
  if (r === "STORE_MANAGER") return "franchise";
  if (r === "COORDINATOR") return "supply";
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
      fullName: info.fullName ?? info.name ?? null,
      role: normalizeRole(info.role ?? res.role),
      roleRaw: info.role ?? res.role,
    };

    storage.setToken(res.token);
    storage.setUser(user);
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
        fullName: res.fullName ?? res.name ?? null,
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
      const fullName =
        res.fullName ?? res.name ?? current.fullName ?? current.name;
      setStoredUser({
        ...current,
        name: fullName ?? current.name,
        fullName: fullName ?? null,
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

  /** Danh sách đơn vị tính (Master Data). GET /api/common/units → { "Nhóm": [{ code, label }], ... } */
  getCommonUnits: async () => {
    try {
      const res = await request("/api/common/units");
      return res && typeof res === "object" ? res : {};
    } catch {
      return {};
    }
  },

  // --- Quản lý Cửa hàng ---
  getStores: async () => {
    try {
      const res = await request("/api/stores/all");
      return Array.isArray(res) ? res : (res?.data ?? []);
    } catch {
      return [];
    }
  },

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
  getCategories: async () => {
    try {
      const res = await request("/api/categories");
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Tạo danh mục sản phẩm. POST /api/categories
   * Body: { name, description }
   * Response: { id, name, description }
   */
  createCategory: (b) =>
    request("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: (b.name ?? "").trim(),
        description: (b.description ?? "").trim() || "",
      }),
    }),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),

  // --- Nguyên liệu & Kho ---
  getIngredients: async () => [],
  createIngredient: (b) =>
    request("/api/ingredients", { method: "POST", body: JSON.stringify(b) }),
  updateIngredient: (id, b) =>
    request(`/api/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(b),
    }),
  deleteIngredient: (id) =>
    request(`/api/ingredients/${id}`, { method: "DELETE" }),
  getManagerInventory: async () => [],
  importInventory: (b) =>
    request("/api/inventory/import", {
      method: "POST",
      body: JSON.stringify(b),
    }),

  // --- Đơn hàng (kênh Admin / bếp trung tâm) ---
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
  // --- Công thức (FORMULA - Cập nhật API mới) ---

  /** Lấy toàn bộ công thức (dùng cho màn hình quản lý/ADMIN). */
  // Giả định backend có API GET /api/formulas để lấy danh sách
  getManagerRecipes: async () => toArray(await request("/api/formulas")),

  /** Xem Công Thức của 1 sản phẩm theo productId. GET /api/formulas/{productId} */
  getRecipeOfProduct: (pId) => request(`/api/formulas/${pId}`),

  /**
   * Lưu / Cập nhật Công thức (Upsert).
   * POST /api/formulas
   * body ví dụ:
   * { productId: "PRD_GA_RAN", ingredients: [{ ingredientId: "ING_THIT_GA", amountNeeded: 0.25 }] }
   */
  saveRecipe: (b) =>
    request("/api/formulas", { method: "POST", body: JSON.stringify(b) }),

  /** Xóa Công Thức của 1 sản phẩm. DELETE /api/formulas/{productId} */
  deleteRecipe: (productId) =>
    request(`/api/formulas/${productId}`, { method: "DELETE" }),


  /**
   * Lưu / Cập nhật Công thức (Upsert). POST /api/formulas
   * Body: { productId, ingredients: [{ ingredientId, amountNeeded }] }
   */
  upsertFormula: (body) =>
    request("/api/formulas", {
      method: "POST",
      body: JSON.stringify({
        productId: body.productId,
        ingredients: (body.ingredients || []).map((i) => ({
          ingredientId: i.ingredientId,
          amountNeeded: i.amountNeeded,
        })),
      }),
    }),
  /** Xem công thức theo productId. GET /api/formulas/{productId} */
  getFormula: (productId) => request(`/api/formulas/${productId}`),
  /** Xóa công thức. DELETE /api/formulas/{productId} */
  deleteFormula: (productId) =>
    request(`/api/formulas/${productId}`, { method: "DELETE" }),

  // --- Bếp (Kitchen) ---
  getKitchenAggregation: () => request("/api/kitchen/aggregation"),
  confirmAggregation: (b) =>
    request("/api/kitchen/aggregation/confirm", {
      method: "POST",
      body: JSON.stringify(b),
    }),
  cook: (b) =>
    request("/api/kitchen/cook", { method: "POST", body: JSON.stringify(b) }),
  getActiveProductions: async () => api.getProductionRuns(), // Trỏ chung về 1 hàm cho đồng bộ
  getProductionRuns: async () => {
    try {
      const res = await request("/api/kitchen/productions/active");
      const list = Array.isArray(res) ? res : (res?.data ?? []);

      // Phiên dịch (Map) dữ liệu từ Backend sang Frontend
      return list.map(run => ({
        id: run.runId || run.id || Math.random().toString(), // Tránh lỗi thiếu key
        name: run.productName || run.name || "Mẻ nấu chưa có tên",
        status: run.status || "PENDING",
        totalQty: Number(run.plannedQty || run.totalQty || 0),
        cookedQty: Number(run.cookedQty || 0), // Nếu DB chưa có thực tế nấu được bao nhiêu thì set = 0
        details: run.details || [] // Giữ lại chi tiết các cửa hàng nếu có
      }));
    } catch (error) {
      console.error("Lỗi lấy danh sách mẻ nấu:", error);
      return [];
    }
  },
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

  // --- Thống kê & Quy đổi ---
  getKPIStats: async () => {
    return await request("/api/manager/analytics/revenue");
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
  getRevenueAnalytics: () => request("/api/manager/analytics/revenue"),
  // Thay vì trả về [], mình lấy list sản phẩm để tính giá vốn

  // --- Báo cáo ---
  getReports: async () => toArray(await request("/api/reports")),
  createReport: (b) =>
    request("/api/reports/export", { method: "POST", body: JSON.stringify(b) }),

  // --- Hàm bổ trợ cũ ---
  getUsers: async () => [],
  saveUsers: async () => [],
  saveCategories: async () => [],
  saveProducts: async () => [],
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
  /**
   * Lấy danh sách sản phẩm. GET /api/products (không body)
   * Response: { totalItems, data: [...], totalPages, currentPage }
   * Mỗi phần tử trong data: { productId, productName, categoryId, categoryName, sellingPrice, baseUnit, active }
   */
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
  /**
   * Danh sách danh mục sản phẩm. GET /api/categories
   * Hỗ trợ: mảng trực tiếp, hoặc { data }, { content }, { categories }.
   */
  async getList() {
    try {
      const res = await request("/api/categories");
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.content)) return res.content;
      if (Array.isArray(res?.categories)) return res.categories;
      if (process.env.NODE_ENV === "development" && res != null) {
        console.warn("[GET /api/categories] Response không phải mảng:", res);
      }
      return [];
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[GET /api/categories] Lỗi:", err?.message || err);
      }
      return [];
    }
  },

  /**
   * Tạo danh mục sản phẩm. POST /api/categories
   * Request: { name, description }
   * Response: { id, name, description }
   */
  async create(body) {
    return request("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: (body.name ?? "").trim(),
        description: (body.description ?? "").trim() || "",
      }),
    });
  },
};

// --- Ingredients & Inventory ---

const ingredientsApi = {
  /** Danh sách nguyên liệu. GET /api/ingredients → [{ ingredientId, version, name, kitchenStock, unit, unitCost, minThreshold }] */
  async getList() {
    try {
      const res = await request("/api/ingredients");
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      return [];
    }
  },


  /** Chi tiết nguyên liệu. GET /api/ingredients/{id} */
  async getById(id) {
    return request(`/api/ingredients/${encodeURIComponent(id)}`);
  },

  /**
   * Tạo nguyên liệu. POST /api/ingredients
   * Body: { name, kitchenStock, unit, unitCost, minThreshold }
   * Response: { ingredientId, version, name, kitchenStock, unit, unitCost, minThreshold }
   */
  async create(body) {
    return request("/api/ingredients", {
      method: "POST",
      body: JSON.stringify({
        name: (body.name ?? "").trim(),
        kitchenStock: Number(body.kitchenStock) ?? 0,
        unit: (body.unit || "KG").toUpperCase(),
        unitCost: Number(body.unitCost) ?? 0,
        minThreshold: Number(body.minThreshold) ?? 0,
      }),
    });
  },

  /**
   * Cập nhật nguyên liệu. PUT /api/ingredients/{id}
   * Body: { name, ingredientName, unit, price, unitCost, stockQuantity, kitchenStock, minThreshold, description? }
   */
  async update(id, body) {
    return request(`/api/ingredients/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({
        name: (body.name ?? body.ingredientName ?? "").trim(),
        ingredientName: (body.name ?? body.ingredientName ?? "").trim(),
        unit: (body.unit || "KG").toUpperCase(),
        price: Number(body.unitCost ?? body.price) ?? 0,
        unitCost: Number(body.unitCost ?? body.price) ?? 0,
        stockQuantity: Number(body.kitchenStock ?? body.stockQuantity) ?? 0,
        kitchenStock: Number(body.kitchenStock ?? body.stockQuantity) ?? 0,
        minThreshold: Number(body.minThreshold) ?? 0,
        description: body.description?.trim() || undefined,
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
  init() { },

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

  /** Danh sách đơn vị tính (Master Data). GET /api/common/units */
  async getCommonUnits() {
    try {
      const res = await request("/api/common/units");
      return res && typeof res === "object" ? res : {};
    } catch {
      return {};
    }
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
      const arr = Array.isArray(res) ? res : (res?.data ?? []);
      return arr.map((s) => ({
        ...s,
        isActive: s.isActive ?? s.active ?? true,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách tiệm đang trống Quản lý.
   * GET /api/stores/empty-stores
   * Response: Array<{ storeId, name, address, phone, type, isActive }>
   */
  async getEmptyStores() {
    try {
      const res = await request("/api/stores/empty-stores");
      const arr = Array.isArray(res) ? res : (res?.data ?? []);
      return arr.map((s) => ({
        ...s,
        isActive: s.isActive ?? s.active ?? true,
      }));
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

  /**
   * Đóng/mở cửa hàng (Admin).
   * PUT /api/store/settings/{storeId}/active
   * Body: { "isActive": true | false }
   * @param {string} storeId - Mã cửa hàng
   * @param {boolean} isActive - true = mở, false = đóng
   */
  async updateStoreActive(storeId, isActive) {
    const id = String(storeId ?? "").trim();
    if (!id) throw new Error("Không có mã cửa hàng.");
    return request(`/api/store/settings/${encodeURIComponent(id)}/active`, {
      method: "PUT",
      body: JSON.stringify({ isActive: Boolean(isActive) }),
    });
  },

  /**
   * Gán Quản lý cho cửa hàng.
   * PUT /api/stores/{storeId}/assign-manager?accountId=...
   * @param {string} storeId - Mã cửa hàng
   * @param {string} accountId - Mã tài khoản (STORE_MANAGER) cần gán
   */
  assignStoreManager(storeId, accountId) {
    const sid = String(storeId ?? "").trim();
    const aid = String(accountId ?? "").trim();
    if (!sid) throw new Error("Không có mã cửa hàng.");
    if (!aid) throw new Error("Không có mã tài khoản.");
    const params = new URLSearchParams({ accountId: aid });
    return request(
      `/api/stores/${encodeURIComponent(sid)}/assign-manager?${params.toString()}`,
      { method: "PUT" },
    );
  },

  // =========================================================
  // STORE_MANAGER — Role: Quản lý cửa hàng
  // 5.1 Giỏ hàng: add (POST), update (PUT), get (GET), remove (DELETE), checkout (POST)
  // 5.2 Đơn hàng: DS đơn (GET), Chi tiết (GET /orders/{orderId}), Tạo nhanh (POST /standard|/urgent)
  // 5.3 Nhận hàng: Báo thiếu/hỏng POST /api/shipments/{shipmentId}/report
  // 5.4 Cài đặt tiệm: Xem/Sửa profile GET|PUT /api/store/settings/profile
  // =========================================================

  /** Xem giỏ hàng. GET /api/store/cart (5.1) */
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
   * Thêm món vào giỏ. POST /api/store/cart/add (5.1)
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
   * Sửa số lượng 1 món. PUT /api/store/cart/update (5.1)
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

  /** Xóa 1 món khỏi giỏ. DELETE /api/store/cart/remove/{productId} (5.1) */
  removeFromStoreCart(productId) {
    return request(`/api/store/cart/remove/${productId}`, {
      method: "DELETE",
    });
  },

  /**
   * Chốt đơn từ giỏ. POST /api/store/cart/checkout (5.1)
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

  /** Xem profile tiệm. GET /api/store/settings/profile (5.4) */
  async getStoreProfile() {
    try {
      const res = await request("/api/store/settings/profile");
      return res ?? {};
    } catch {
      return {};
    }
  },

  /**
   * Sửa profile tiệm. PUT /api/store/settings/profile (5.4)
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
  getIngredient: (id) => ingredientsApi.getById(id),
  updateIngredient: (id, body) => ingredientsApi.update(id, body),
  createProduct: (body) => productsApi.create(body),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  importInventory: (body) => inventoryApi.import(body),
  cook: (body) => kitchenApi.cook(body),

  // =========================================================
  // Đơn hàng STORE_MANAGER (cửa hàng)
  // =========================================================

  /**
   * Danh sách đơn hàng của tiệm. GET /api/store/orders (5.2)
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
   * Chi tiết đơn hàng. GET /api/store/orders/{orderId} (5.2)
   */
  getStoreOrderDetail(orderId) {
    return request(`/api/store/orders/${orderId}`);
  },

  /**

   * Tạo đơn nhanh không qua giỏ. POST /api/store/orders/standard hoặc /urgent (5.2)
   * Body: { deliveryDate, note?, items: [{ productId, quantity, price }] }
>>>>>>> 7607cd6dacecfcb14c31cbc25c21ae24d7c35f25
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
   * Chuẩn hóa danh sách cửa hàng đang quản lý từ response account.
   * Hỗ trợ: stores[], storeNames[], storeName (string).
   * @returns {string} Chuỗi tên cửa hàng, phân cách bằng ", "
   */
  resolveManagedStores(a) {
    if (!a) return "";
    const stores = a.stores;
    if (Array.isArray(stores) && stores.length > 0) {
      const names = stores
        .map((s) =>
          typeof s === "string" ? s : (s?.name ?? s?.storeName ?? ""),
        )
        .filter(Boolean);
      if (names.length) return names.join(", ");
    }
    const storeNames = a.storeNames;
    if (Array.isArray(storeNames) && storeNames.length > 0) {
      const names = storeNames.filter((s) => s && String(s).trim());
      if (names.length) return names.join(", ");
    }
    const storeName = a.storeName;
    if (storeName && String(storeName).trim()) return String(storeName).trim();
    return "";
  },

  /**
   * Danh sách tài khoản (AccountResponse): accountId, username, role, isActive, userId, fullName, email.
   */
  async getUsers() {
    try {
      const list = await request("/api/admin/list-accounts");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => {
        const accountId = a.accountId ?? a.id ?? a.userId;
        const managedStores = this.resolveManagedStores(a);
        const firstStore =
          Array.isArray(a.stores) && a.stores[0] ? a.stores[0] : null;
        const storeId =
          a.storeId ??
          a.storeIds?.[0] ??
          (typeof firstStore === "object"
            ? (firstStore?.storeId ?? firstStore?.id)
            : null) ??
          null;
        return {
          id: accountId ?? a.userId,
          accountId,
          username: a.username,
          name: a.fullName ?? a.username,
          role: normalizeRole(a.role),
          roleRaw: a.role,
          status:
            a.isActive !== false && a.active !== false ? "active" : "inactive",
          storeName: a.storeName ?? null,
          storeId,
          storeIds: a.storeIds ?? (a.storeId ? [a.storeId] : null),
          managedStores,
          email: a.email ?? null,
          userId: a.userId,
        };
      });
    } catch {
      return [];
    }
  },

  /** Chỉ tài khoản đang hoạt động (isActive = true). */
  async getActiveAccounts() {
    try {
      const list = await request("/api/admin/list-accounts/active");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => {
        const accountId = a.accountId ?? a.id ?? a.userId;
        const managedStores = this.resolveManagedStores(a);
        const firstStore =
          Array.isArray(a.stores) && a.stores[0] ? a.stores[0] : null;
        const storeId =
          a.storeId ??
          a.storeIds?.[0] ??
          (typeof firstStore === "object"
            ? (firstStore?.storeId ?? firstStore?.id)
            : null) ??
          null;
        return {
          id: accountId ?? a.userId,
          accountId,
          username: a.username,
          name: a.fullName ?? a.username,
          role: normalizeRole(a.role),
          roleRaw: a.role,
          status: "active",
          userId: a.userId,
          email: a.email ?? null,
          storeName: a.storeName ?? null,
          storeId,
          storeIds: a.storeIds ?? (a.storeId ? [a.storeId] : null),
          managedStores,
        };
      });
    } catch {
      return [];
    }
  },

  /** Chỉ tài khoản bị khóa / vô hiệu hóa (isActive = false). */
  async getInactiveAccounts() {
    try {
      const list = await request("/api/admin/list-accounts/inactive");
      const arr = Array.isArray(list) ? list : (list?.data ?? []);
      return arr.map((a) => {
        const accountId = a.accountId ?? a.id ?? a.userId;
        const managedStores = this.resolveManagedStores(a);
        const firstStore =
          Array.isArray(a.stores) && a.stores[0] ? a.stores[0] : null;
        const storeId =
          a.storeId ??
          a.storeIds?.[0] ??
          (typeof firstStore === "object"
            ? (firstStore?.storeId ?? firstStore?.id)
            : null) ??
          null;
        return {
          id: accountId ?? a.userId,
          accountId,
          username: a.username,
          name: a.fullName ?? a.username,
          role: normalizeRole(a.role),
          roleRaw: a.role,
          status: "inactive",
          userId: a.userId,
          email: a.email ?? null,
          storeName: a.storeName ?? null,
          storeId,
          storeIds: a.storeIds ?? (a.storeId ? [a.storeId] : null),
          managedStores,
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Khóa / Mở khóa tài khoản (Admin).
   * PUT /api/admin/accounts/{accountId}/status
   * Body: { "isActive": true | false }
   *
   * Backend (Spring) cần:
   * 1) SecurityConfig: requestMatchers PUT "/api/admin/accounts/{id}/status" với hasAuthority("ADMIN")
   *    (Token role=ADMIN dùng hasAuthority; role=ROLE_ADMIN dùng hasRole("ADMIN"))
   * 2) Controller: PutMapping "/accounts/{accountId}/status" với body DTO field isActive (boolean).
   *
   * @param {string} accountId - Mã tài khoản (UUID từ bảng accounts)
   * @param {boolean} isActive - true = mở khóa, false = khóa
   * @returns {Promise<object>} Response từ backend
   */
  async updateAccountStatus(accountId, isActive) {
    const id = String(accountId ?? "").trim();
    if (!id) throw new Error("Không có mã tài khoản để cập nhật.");
    return request(`/api/admin/accounts/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive: Boolean(isActive) }),
    });
  },

  /**
   * Cập nhật email tài khoản (Admin).
   * PATCH /api/admin/accounts/{accountId}/email
   * Body: { "email": "email_moi_tinh@gmail.com" }
   * @param {string} accountId - Mã tài khoản (UUID)
   * @param {object} data - { email }
   */
  async updateAccount(accountId, data) {
    const id = String(accountId ?? "").trim();
    if (!id) throw new Error("Không có mã tài khoản.");
    const email = data?.email != null ? String(data.email).trim() : "";
    if (!email) throw new Error("Không có email để cập nhật.");
    return request(`/api/admin/accounts/${encodeURIComponent(id)}/email`, {
      method: "PATCH",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Hoán đổi cửa hàng giữa 2 Quản lý (Admin).
   * PUT /api/admin/accounts/swap-stores?accountId1=...&accountId2=...
   * @param {string} accountId1 - Mã tài khoản 1 (STORE_MANAGER)
   * @param {string} accountId2 - Mã tài khoản 2 (STORE_MANAGER)
   */
  async swapStores(accountId1, accountId2) {
    const id1 = String(accountId1 ?? "").trim();
    const id2 = String(accountId2 ?? "").trim();
    if (!id1 || !id2) throw new Error("Cần chọn đủ 2 tài khoản.");
    if (id1 === id2) throw new Error("Hai tài khoản phải khác nhau.");
    const params = new URLSearchParams();
    params.set("accountId1", id1);
    params.set("accountId2", id2);
    return request(`/api/admin/accounts/swap-stores?${params.toString()}`, {
      method: "PUT",
    });
  },

  /**
   * Gán cửa hàng làm việc cho tài khoản (Admin).
   * PATCH /api/admin/accounts/{accountId}/store?storeId=ST_001
   * @param {string} accountId - Mã tài khoản (UUID)
   * @param {string} storeId - Mã cửa hàng (vd: ST_001)
   */
  async updateAccountStore(accountId, storeId) {
    const id = String(accountId ?? "").trim();
    if (!id) throw new Error("Không có mã tài khoản.");
    const sid = String(storeId ?? "").trim();
    if (!sid) throw new Error("Không có mã cửa hàng.");
    return request(
      `/api/admin/accounts/${encodeURIComponent(id)}/store?storeId=${encodeURIComponent(sid)}`,
      { method: "PATCH" },
    );
  },

  /**
   * Thay đổi chức vụ tài khoản (Admin).
   * PATCH /api/admin/accounts/{accountId}/role?roleName=...&storeId=...&replacementAccountId=...
   * @param {string} accountId - Mã tài khoản (UUID)
   * @param {string} roleName - ADMIN | MANAGER | COORDINATOR | KITCHEN_MANAGER | STORE_MANAGER
   * @param {string} [storeId] - Mã cửa hàng (bắt buộc khi roleName = STORE_MANAGER)
   * @param {string} [replacementAccountId] - Mã tài khoản thay thế (khi chuyển store manager sang role khác)
   */
  async updateAccountRole(accountId, roleName, storeId, replacementAccountId) {
    const id = String(accountId ?? "").trim();
    if (!id) throw new Error("Không có mã tài khoản.");
    const params = new URLSearchParams();
    params.set("roleName", String(roleName ?? "").trim());
    if (storeId) params.set("storeId", String(storeId).trim());
    if (replacementAccountId)
      params.set("replacementAccountId", String(replacementAccountId).trim());
    const query = params.toString();
    return request(
      `/api/admin/accounts/${encodeURIComponent(id)}/role${query ? `?${query}` : ""}`,
      {
        method: "PATCH",
      },
    );
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

  /**
   * Báo cáo xe giao THIẾU/HỎNG hàng. POST /api/shipments/{shipmentId}/report (5.3)
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
  // Sửa lại endpoint Phân tuyến tự động theo chuẩn RouteAllocationController
  autoRouting: async (body) => {
    return request("/api/logistics/allocate-routes", {
      method: "POST",
      body: JSON.stringify(body || {}), // Hỗ trợ gửi body rỗng {} nếu muốn xếp tự động toàn bộ
    });
  },

  // ====================================================================
  // BỔ SUNG API: QUẢN LÝ (MANAGER) & BẾP TRUNG TĂM (CENTRAL KITCHEN)
  // ====================================================================

  // --- ANALYTICS (DASHBOARD) ---
  /** * Lấy số liệu tổng quan Dashboard (API MỚI)
   * Mapping với API: GET /api/manager/analytics/dashboard
   */
  getManagerAnalytics: async (startDate, endDate) => {
    try {
      const q = new URLSearchParams();
      if (startDate) q.set("startDate", startDate);
      if (endDate) q.set("endDate", endDate);
      const query = q.toString();

      const path = query
        ? `/api/manager/analytics/dashboard?${query}`
        : "/api/manager/analytics/dashboard";

      return await request(path, { method: "GET" });
    } catch (error) {
      console.error("Lỗi lấy dữ liệu Analytics:", error);
      // Trả về object rỗng với cấu trúc an toàn để UI không bị văng lỗi undefined
      return {
        totalExportValue: {},
        totalOrders: {},
        totalWastageValue: {},
        exportTrend: [],
        topExportedProducts: [],
        topWastedProducts: []
      };
    }
  },

  // Bạn có một hàm getRevenueAnalytics bị trùng chức năng, 
  // hãy cập nhật luôn cho an toàn nếu có component nào đang gọi nhầm:
  getRevenueAnalytics: async (startDate, endDate) => {
    return api.getManagerAnalytics(startDate, endDate);
  },

  // --- QUẢN TRỊ ĐƠN HÀNG TRUNG TÂM (MANAGER/ADMIN) ---
  /**
   * Xem chi tiết một đơn hàng bất kỳ trong hệ thống
   * Mapping với API: GET /api/orders/{orderId}
   */
  getOrderDetails: async (orderId) => {
    return request(`/api/orders/${orderId}`, { method: "GET" });
  },

  /**
   * Quản lý hủy đơn hàng (Chỉ hủy khi trạng thái là NEW)
   * Mapping với API: PUT /api/orders/{orderId}/cancel
   */
  cancelManagerOrder: async (orderId) => {
    return request(`/api/orders/${orderId}/cancel`, { method: "PUT" });
  },

  // --- QUẢN LÝ QUY ĐỔI ĐƠN VỊ (UNIT CONVERSION) ---
  /**
   * Tạo quy tắc quy đổi mới (Ví dụ: 1 Thùng = 10 Kg)
   * Mapping với API: POST /api/manager/conversions
   */
  createUnitConversion: async (body) => {
    return request("/api/manager/conversions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * Tính toán thử nghiệm quy đổi (Ví dụ: Test xem 5 Thùng là bao nhiêu Kg)
   * Mapping với API: GET /api/manager/conversions/calculate?ingredientId=...&unit=...&quantity=...
   */
  calculateConversion: async (ingredientId, unit, quantity) => {
    return request(
      `/api/manager/conversions/calculate?ingredientId=${ingredientId}&unit=${unit}&quantity=${quantity}`,
      {
        method: "GET",
      },
    );
  },

  // --- QUẢN LÝ HAO HỤT BẾP (WASTAGE) ---
  /**
   * Báo cáo hao hụt mẻ nấu, tự động hoàn trả/trừ kho nguyên liệu
   * Mapping với API: POST /api/kitchen/wastage
   */
  reportKitchenWastage: async (body) => {
    return request("/api/kitchen/wastage", {
      method: "POST",
      body: JSON.stringify({
        runId: body.runId,
        wasteQty: Number(body.wasteQty) || 0,
        reason: body.reason || "Không có lý do",
      }),
    });
  },

  // --- LỆNH XUẤT BẾN (DISPATCH) ---
  /**
   * Quản lý/Điều phối viên bấm xuất bến cho chuyến xe
   * Mapping với API: PATCH /api/logistics/shipments/{id}/dispatch
   */
  dispatchShipment: async (shipmentId) => {
    return request(`/api/logistics/shipments/${shipmentId}/dispatch`, {
      method: "PATCH",
    });
  },

  async resolveReplacement(shipId) {
    const res = await request(`/api/shipments/${shipId}/resolve-replacement`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return res.message ?? res.msg ?? res;
  },

  // ====================================================================
  // BỔ SUNG CÁC HÀM BỊ THIẾU MÀ GIAO DIỆN MANAGER PAGE ĐANG GỌI
  // ====================================================================

  getMasterProducts: async () => {
    try {
      const res = await request("/api/products");
      const list = Array.isArray(res) ? res : res?.data || [];

      // Map dữ liệu từ Backend (camelCase) sang chuẩn giao diện (snake_case)
      return list.map((item) => ({
        ...item, // Giữ lại các data gốc
        product_id: item.productId || item.product_id || "",
        product_name: item.productName || item.product_name || "Chưa có tên",
        category: item.categoryName || item.category || "Chưa phân loại",
        cost_price: item.costPrice || item.cost_price || 0,
        selling_price: item.sellingPrice || item.selling_price || 0,
        emoji: item.emoji || "🍔",
      }));
    } catch {
      return [];
    }
  },

  getManagerInventory: async () => {
    try {
      const res = await request("/api/ingredients");
      const list = Array.isArray(res) ? res : res?.data || [];

      // Ép kiểu dữ liệu trả về khớp với các biến mà ManagerPage.js đang dùng
      return list.map((item) => ({
        ...item,
        // DB là ingredient_id -> React cần item.ingredientId hoặc item.id
        ingredientId: item.ingredient_id || item.ingredientId || item.id,
        // DB là name -> React cần item.ingredientName hoặc item.name
        ingredientName: item.name || item.ingredientName || item.name,
        // Đơn vị gốc
        unit: item.unit || "KG",
      }));
    } catch (error) {
      console.error("Lỗi lấy kho:", error);
      return [];
    }
  },

  // Trừ kho hàng loạt cho nhiều mẻ nấu cùng lúc
  updateBulkProductionStatus: async (runIds, status = "COMPLETED") => {
    return request(`/api/kitchen/productions/status/bulk?status=${status}`, {
      method: "PUT",
      body: JSON.stringify(runIds),
    });
  },

  // ĐÃ SỬA: Hàm `getKPIStats` map theo chuẩn API Dashboard mới
  getKPIStats: async (startDate, endDate) => {
    try {
      // Gọi chung hàm getManagerAnalytics đã viết ở trên cho gọn
      const res = await api.getManagerAnalytics(startDate, endDate);

      // Bọc fallback an toàn tránh lỗi
      const exportData = res.totalExportValue || {};
      const ordersData = res.totalOrders || {};
      const wastageData = res.totalWastageValue || {};

      return [
        {
          label: "Giá trị xuất kho",
          value: `${(exportData.currentValue || 0).toLocaleString()} ₫`,
          isUp: exportData.trend === "UP",
          change: `${exportData.growthPercentage || 0}%`
        },
        {
          label: "Tổng đơn hàng",
          value: ordersData.currentValue || 0,
          isUp: ordersData.trend === "UP",
          change: `${ordersData.growthPercentage || 0}%`
        },
        {
          label: "Giá trị hao hụt",
          value: `${(wastageData.currentValue || 0).toLocaleString()} ₫`,
          // Hao hụt tăng (UP) là biểu hiện xấu, bạn có thể cân nhắc đổi màu đỏ ở frontend
          isUp: wastageData.trend === "UP",
          change: `${wastageData.growthPercentage || 0}%`
        }
      ];
    } catch (error) {
      console.error("Lỗi getKPIStats:", error);
      return [];
    }
  },


  // 2 Mảng này Backend của bạn CHƯA CÓ API, mình cho trả về mảng rỗng [] trước để UI không bị crash (văng lỗi)
  getReports: async () => [],

  // ĐÃ SỬA: Trả lại hàm mock Expenses fake để không bị lỗi .reduce() ở UI ManagerPage
  getExpenses: async () => {
    try {
      const prods = await api.getProducts();
      return prods.map((p) => ({
        id: p.id || p.productId,
        date: new Date().toISOString().split('T')[0],
        supplier: "Kho trung tâm",
        category: "Nhập nguyên liệu",
        amount: p.price || p.sellingPrice || 0,
        ref: "PO-MASTER",
      }));
    } catch { return []; }
  },

  // Các hàm Thêm/Sửa/Xóa từ giao diện Manager
  createMasterProduct: async (b) =>
    request("/api/products", { method: "POST", body: JSON.stringify(b) }),
  updateMasterProduct: async (id, b) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteMasterProduct: async (id) =>
    request(`/api/products/${id}`, { method: "DELETE" }),

  createReport: async (b) => {
    console.log("Chưa có API Report", b);
    return {};
  },
  createExpense: async (b) => {
    console.log("Chưa có API Expense", b);
    return {};
  },

  // 1. Bổ sung các hàm lấy dữ liệu tổng bị thiếu
  getProductionRuns: async () =>
    toArray(await request("/api/kitchen/productions/active")),

  getKitchenAggregation: () => request("/api/kitchen/aggregation"),

  // 2. Bổ sung các hàm thao tác Bếp & Đơn

  confirmAggregation: (b) =>
    request("/api/kitchen/aggregation/confirm", {
      method: "POST",
      body: JSON.stringify(b),
    }),
  // Đã sửa lại đúng endpoint của kitchen và truyền status qua query params
  updateProductionRunStatus: (id, s) =>
    request(`/api/kitchen/productions/${id}/status?status=${s}`, {
      method: "PUT",
    }),
  deleteIngredient: (id) =>
    request(`/api/ingredients/${id}`, { method: "DELETE" }),

  updateProductStatus: async (productId, isActive) => {
    return request(`/api/products/${productId}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive: Boolean(isActive) }), // Hoặc gửi status tùy theo Backend expect
    });
  },

  // 3. Bổ sung các hàm CRUD cho Kho bếp
  updateCategory: (id, b) =>
    request(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(b),
    }),
  updateProduct: (id, b) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(b) }),

  // 4. Bổ sung các hàm thao tác Sự cố
  createIncident: (b) =>
    request("/api/incidents", { method: "POST", body: JSON.stringify(b) }),
  updateIncidentStatus: (id, s) =>
    request(`/api/incidents/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: s }),
    }),

  // Cập nhật Cấu hình Hệ thống (System Config)
  // Dùng dấu cộng nối chuỗi cho chắc ăn 100%, khỏi sợ lỗi format string
  updateSystemConfig: async (configKey, body) => {
    return request("/api/manager/configs/" + configKey, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  // 5. Cập nhật tên hàm báo cáo hao hụt
  // (Trong component bạn gọi api.reportWastage, nên phải export đúng tên này)
  reportWastage: async (body) => {
    return request("/api/kitchen/wastage", {
      method: "POST",
      body: JSON.stringify({
        runId: body.runId,
        wasteQty: Number(body.wasteQty) || 0,
        reason: body.reason || "Không có lý do",
      }),
    });
  },

  markOrderPreparing: async (orderId) => {
    return request(`/api/orders/delivery/${orderId}/preparing`, {
      method: "POST",
      // Thường API chuyển trạng thái không cần body, nếu BE yêu cầu thì thêm vào đây
      body: JSON.stringify({})
    });
  },

  // Bổ sung: Quản lý cài đặt & trạng thái đóng/mở cửa hàng (StoreSettingsController)
  updateStoreSettings: async (settingsData) => {
    return request("/api/store/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData), // Ví dụ truyền: { isActive: true }
    });
  },

  // ====================================================================
  // BỔ SUNG API: ĐIỀU PHỐI CUNG ỨNG (COORDINATOR)
  // ====================================================================

  // 3.1. Chia Tuyến & Gom Xe (Gom xe tự động đã có ở autoRouting bên trên)
  getReadyOrders: async () => toArray(await request("/api/logistics/orders/ready")),
  manualAllocateRoutes: async (orderIds) => {
    return request("/api/logistics/orders/manual-allocate", {
      method: "POST",
      body: JSON.stringify({ orderIds: orderIds || [] }),
    });
  },

  // 3.2. Điều Phối Tài Xế
  getDriverList: async () => toArray(await request("/api/logistics/orders/coordinators-list")),
  assignDriver: async (shipmentId, accountId) => {
    return request(`/api/shipments/${shipmentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ accountId }),
    });
  },
  markShipmentDelivered: async (shipmentId) => {
    return request(`/api/shipments/${shipmentId}/delivered`, {
      method: "POST",
    });
  },

  // 3.3. Tra cứu Lịch trình
  getActiveShipments: async () => toArray(await request("/api/logistics/orders/active")),
  getHistoryShipments: async () => toArray(await request("/api/logistics/orders/history")),
  getShipmentDetails: async (shipmentId) => {
    return request(`/api/logistics/orders/${shipmentId}/details`);
  },
  placeOrderForStore: (body) => request("/api/orders/standard", { method: "POST", body: JSON.stringify(body) }),
  addOrderUrgent: (body) => request("/api/orders/urgent", { method: "POST", body: JSON.stringify(body) }),
  getStoreHistoryForManager: (storeId) => request(`/api/orders/history?storeId=${storeId}`),
  getSystemConfigs: async () => {
    const res = await request("/api/manager/configs/map");
    // Nếu res có thuộc tính data thì lấy data, không thì lấy chính nó
    return res?.data || res || {};
  },
  updateUnitConversion: (id, newFactor) =>
    request(`/api/manager/conversions/${id}?newFactor=${newFactor}`, { method: "PUT" }),
  deleteUnitConversion: (id) =>
    request(`/api/manager/conversions/${id}`, { method: "DELETE" }),
  getConversionsByIngredient: (ingredientId) =>
    request(`/api/manager/conversions/ingredient/${ingredientId}`),
  getManagerRecipes: async () => {
    try {
      const res = await request("/api/formulas");
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) { return []; }
  },
  getRecipeOfProduct: (pId) => request(`/api/formulas/${pId}`),
  saveRecipe: (b) => request("/api/formulas", { method: "POST", body: JSON.stringify(b) }),
  deleteRecipe: (productId) => request(`/api/formulas/${productId}`, { method: "DELETE" }),

  exportAnalyticsCSV: async (startDate, endDate) => {
    try {
      // 1. Lấy token bằng hàm có sẵn trong file của bạn
      const token = storage.getToken();
      if (!token) {
        throw new Error("Không tìm thấy phiên đăng nhập!");
      }

      // 2. Build URL động theo môi trường (giống cách bạn làm cũ)
      const q = new URLSearchParams();
      if (startDate) q.set("startDate", startDate);
      if (endDate) q.set("endDate", endDate);
      const query = q.toString();

      const finalUrl = `${BASE_URL.replace(/\/$/, "")}/api/manager/analytics/export/csv${query ? `?${query}` : ""}`;

      // 3. Dùng fetch gọi API kèm Token
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Lỗi xác thực hoặc không tải được file từ Server!");
      }

      // 4. Bọc dữ liệu thành Blob và tạo link tải ẩn
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Bao_Cao_Thong_Ke_${new Date().toISOString().split('T')[0]}.csv`);

      document.body.appendChild(link);
      link.click(); // Giả lập click tải xuống

      // 5. Dọn dẹp rác trình duyệt
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Lỗi tải báo cáo CSV:", error);
      alert("Lỗi: " + error.message);
    }
  },
};
export default api;