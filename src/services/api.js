/**
 * API service - Kết nối backend Central Kitchen.
 * Auth: login trước, token được gửi kèm mọi request.
 * Dev: dùng proxy (package.json) → gọi relative path để tránh CORS.
 */
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://localhost:8081";
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

/**
 * Chuyển lỗi từ backend sang câu tiếng Việt theo đúng trường (email/mật khẩu/OTP...).
 */
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

/** Chuẩn hóa role backend (ADMIN, KITCHEN_STAFF) sang format app */
function normalizeRole(role) {
  if (!role) return "franchise";
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "KITCHEN_STAFF" || r === "KITCHEN") return "kitchen";
  return r.toLowerCase();
}

// --- Auth ---

const auth = {
  /**
   * Đăng nhập (bước 1).
   * - Nếu backend trả token ngay → lưu token + user, trả về user.
   * - Nếu backend yêu cầu OTP (không trả token / requiresOtp) → trả { requiresOtp: true, username } để UI chuyển sang màn OTP.
   */
  async login(username, password) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const raw = res?.data ?? res;
    const requiresOtp = Boolean(raw.requiresOtp ?? res.requiresOtp);
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
        username: raw.username ?? res.username ?? username,
      };
    }
    setToken(token);
    const info = raw.user ?? raw;
    const user = {
      id: info.id ?? info.username,
      username: info.username ?? res.username,
      name: info.name ?? info.fullName ?? info.username ?? res.username,
      role: normalizeRole(info.role ?? res.role),
      roleRaw: info.role ?? res.role,
    };
    setStoredUser(user);
    return user;
  },

  /**
   * Xác thực OTP (dùng cho cả luồng đăng nhập và quên mật khẩu).
   * Nếu response có token → lưu token + user và trả về user (để đăng nhập vào app).
   * Ngược lại trả response gốc (vd: luồng quên mật khẩu chuyển sang bước đặt lại mật khẩu).
   */
  async verifyOtp(otp, emailOrUsername) {
    const res = await request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        otp,
        email: emailOrUsername,
        username: emailOrUsername,
      }),
    });
    const raw = res?.data ?? res;
    const token =
      raw.token ??
      raw.accessToken ??
      raw.access_token ??
      res.token ??
      res.accessToken ??
      res.access_token;
    if (token && typeof token === "string") {
      setToken(token);
      const info = raw.user ?? raw;
      const user = {
        id: info.id ?? info.username,
        username: info.username ?? res.username ?? emailOrUsername,
        name: info.name ?? info.fullName ?? info.username ?? emailOrUsername,
        role: normalizeRole(info.role ?? res.role),
        roleRaw: info.role ?? res.role,
      };
      setStoredUser(user);
      return user;
    }
    return res;
  },

  /** Đăng xuất: xóa token và user */
  logout() {
    setToken(null);
    setStoredUser(null);
  },

  /** User đang lưu (sau khi login) */
  getStoredUser() {
    return getStoredUser();
  },

  /** Có đăng nhập hay không (có token) */
  isAuthenticated() {
    return Boolean(getToken());
  },

  /** Đăng ký tài khoản */
  async register({ username, password, fullName, employeeCode, role }) {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        fullName,
        employeeCode,
        role: role || "KITCHEN_STAFF",
      }),
    });
    return res;
  },

  /** Cập nhật hồ sơ (fullName) */
  async updateProfile(payload) {
    return request("/api/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /** Yêu cầu gửi OTP quên mật khẩu (email hoặc username) */
  async forgotPassword(emailOrUsername) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: emailOrUsername,
        username: emailOrUsername,
      }),
    });
  },

  /** Đặt lại mật khẩu mới bằng OTP */
  async resetPassword(otp, newPassword, emailOrUsername) {
    return request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        otp,
        newPassword,
        email: emailOrUsername,
        username: emailOrUsername,
      }),
    });
  },

  /** Lấy thông tin Role/Username hiện tại (Debug) */
  async checkMe() {
    return request("/api/auth/check-me", { method: "GET" });
  },
};

// --- Products & Categories ---

/** Map sản phẩm backend sang format UI (id, name, category, price, ...) */
function mapProduct(p) {
  return {
    id: p.productId || p.id,
    productId: p.productId,
    name: p.productName || p.name,
    productName: p.productName || p.name,
    category: p.categoryName || p.category || "",
    categoryId: p.categoryId,
    price: Number(p.sellingPrice ?? p.price ?? 0),
    sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
    baseUnit: p.baseUnit || "Tô",
    stock: p.stock ?? 0,
    min: p.min ?? 0,
    emoji: p.emoji || "🍽️",
    active: p.active !== false,
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

  /** Tạo sản phẩm */
  async create(body) {
    return request("/api/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
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

  /** Tạo danh mục */
  async create(body) {
    return request("/api/categories", {
      method: "POST",
      body: JSON.stringify(body),
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

  /** Tạo nguyên liệu */
  async create(body) {
    return request("/api/ingredients", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

const inventoryApi = {
  /** Nhập kho nguyên liệu */
  async import(body) {
    return request("/api/inventory/import", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

// --- Kitchen ---

const kitchenApi = {
  /** Nấu / tạo thành phẩm (trừ nguyên liệu theo công thức) */
  async cook(body) {
    return request("/api/kitchen/cook", {
      method: "POST",
      body: JSON.stringify(body),
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

  async getCategories() {
    return categoriesApi.getList();
  },

  createCategory: (body) => categoriesApi.create(body),
  createIngredient: (body) => ingredientsApi.create(body),
  createProduct: (body) => productsApi.create(body),
  importInventory: (body) => inventoryApi.import(body),
  cook: (body) => kitchenApi.cook(body),

  /** Orders: backend chưa cung cấp API */
  async getOrders() {
    return [];
  },
  async addOrder() {
    return {};
  },

  /** Users: backend chưa cung cấp danh sách, dùng cho Admin UI */
  async getUsers() {
    return [];
  },
  async saveUsers() {
    return [];
  },
  async saveCategories() {
    return [];
  },
  async saveProducts() {
    return [];
  },
};

export default api;
