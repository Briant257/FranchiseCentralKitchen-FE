/**
 * API service - Kết nối backend Central Kitchen.
 * Auth: login trước, token được gửi kèm mọi request.
 * Dev: dùng proxy (package.json) → gọi relative path để tránh CORS.
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
  /** Đăng nhập → lưu token + user, trả về user để app render theo role */
  async login(username, password) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const token = res.token;
    if (!token) throw new Error("Không nhận được token từ server");
    setToken(token);
    const user = {
      id: res.username,
      username: res.username,
      name: res.username,
      role: normalizeRole(res.role),
      roleRaw: res.role,
    };
    setStoredUser(user);
    return user;
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
  /** Danh sách sản phẩm: backend trả { data: [...] } hoặc mảng trực tiếp */
  async getList() {
    const res = await request("/api/products");
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
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

  async getProducts() {
    return productsApi.getList();
  },

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
