import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  LayoutDashboard,
  BarChart3,
  Store,
  ChefHat,
  Bell,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  DollarSign,
  Send,
  XCircle,
  Shield,
  UserPlus,
  X,
  User,
  Lock,
} from './components/icons/Icons';
import './styles/ck-app.css';

// ==================== LOCAL STORAGE MANAGER ====================
const StorageManager = {
  init: () => {
    if (!localStorage.getItem('ck_users')) {
      const defaultUsers = [
        { id: 1, username: 'admin', password: 'admin123', name: 'Admin', role: 'admin', status: 'active', createdAt: '2026-01-01' },
        { id: 2, username: 'store1', password: 'store123', name: 'Nguyễn Văn A', role: 'franchise', storeName: 'Cửa hàng Quận 1', status: 'active', createdAt: '2026-01-15' },
        { id: 3, username: 'store2', password: 'store123', name: 'Trần Thị B', role: 'franchise', storeName: 'Cửa hàng Quận 3', status: 'active', createdAt: '2026-01-15' },
      ];
      localStorage.setItem('ck_users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('ck_products')) {
      const defaultProducts = [
        { id: 'P001', name: 'Bánh mì sandwich', category: 'Bánh mì', price: 25000, stock: 150, min: 50, emoji: '🥪' },
        { id: 'P002', name: 'Croissant bơ', category: 'Bánh ngọt', price: 35000, stock: 89, min: 30, emoji: '🥐' },
        { id: 'P003', name: 'Bánh baguette', category: 'Bánh mì', price: 15000, stock: 200, min: 80, emoji: '🥖' },
        { id: 'P004', name: 'Donut socola', category: 'Bánh ngọt', price: 20000, stock: 45, min: 40, emoji: '🍩' },
        { id: 'P005', name: 'Bánh mì que', category: 'Bánh mì', price: 12000, stock: 180, min: 60, emoji: '🥖' },
        { id: 'P006', name: 'Cupcake vanilla', category: 'Bánh ngọt', price: 18000, stock: 95, min: 40, emoji: '🧁' },
        { id: 'P007', name: 'Bánh mì hoa cúc', category: 'Bánh mì', price: 22000, stock: 120, min: 50, emoji: '🥖' },
        { id: 'P008', name: 'Macaron mix', category: 'Bánh ngọt', price: 45000, stock: 65, min: 30, emoji: '🍪' },
      ];
      localStorage.setItem('ck_products', JSON.stringify(defaultProducts));
    }

    if (!localStorage.getItem('ck_orders')) {
      localStorage.setItem('ck_orders', JSON.stringify([]));
    }

    if (!localStorage.getItem('ck_categories')) {
      const existingProducts = localStorage.getItem('ck_products') ? JSON.parse(localStorage.getItem('ck_products')) : [];
      const uniqueNames = [...new Set(existingProducts.map((p) => p.category).filter(Boolean))];
      const defaultCategories = uniqueNames.length > 0
        ? uniqueNames.map((name, i) => ({ id: 'cat' + (i + 1), name }))
        : [
            { id: 'cat1', name: 'Bánh mì' },
            { id: 'cat2', name: 'Bánh ngọt' },
          ];
      localStorage.setItem('ck_categories', JSON.stringify(defaultCategories));
    }
  },

  getUsers: () => {
    const users = localStorage.getItem('ck_users');
    return users ? JSON.parse(users) : [];
  },
  saveUsers: (users) => {
    localStorage.setItem('ck_users', JSON.stringify(users));
  },

  getProducts: () => {
    const products = localStorage.getItem('ck_products');
    return products ? JSON.parse(products) : [];
  },
  saveProducts: (products) => {
    localStorage.setItem('ck_products', JSON.stringify(products));
  },

  getCategories: () => {
    const raw = localStorage.getItem('ck_categories');
    return raw ? JSON.parse(raw) : [];
  },
  saveCategories: (categories) => {
    localStorage.setItem('ck_categories', JSON.stringify(categories));
  },

  getOrders: () => {
    const orders = localStorage.getItem('ck_orders');
    return orders ? JSON.parse(orders) : [];
  },
  saveOrders: (orders) => {
    localStorage.setItem('ck_orders', JSON.stringify(orders));
  },
  addOrder: (order) => {
    const orders = StorageManager.getOrders();
    orders.push(order);
    StorageManager.saveOrders(orders);
  },
};

// ==================== LOGIN PAGE ====================
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      const users = StorageManager.getUsers();
      const user = users.find((u) => u.username === username && u.password === password);

      if (user) {
        if (user.status === 'inactive') {
          setError('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
          setLoading(false);
        } else {
          onLogin(user);
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng!');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="ck-root ck-login-page">
      <div className="ck-grain" />
      <div className="ck-absolute ck-inset-0 ck-bg-grid-pattern" style={{ pointerEvents: 'none' }} />

      <div className="ck-login-card">
        <div className="ck-login-box ck-animate-slide-in">
          <div className="ck-text-center ck-mb-8">
            <div className="ck-flex ck-items-center ck-justify-center ck-w-14-h-14 ck-logo-icon ck-rounded-2xl ck-mb-4 ck-shadow-lg" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              <ChefHat className="ck-text-white" size={40} />
            </div>
            <h2 className="ck-text-3xl ck-font-black ck-text-white ck-mb-2">Central Kitchen</h2>
            <p className="ck-text-gray-400 ck-mono">Hệ thống quản lý bếp trung tâm</p>
          </div>

          {error && (
            <div className="ck-error-box ck-rounded-xl ck-shake">
              <p className="ck-text-red-400 ck-text-sm ck-font-semibold ck-text-center">{error}</p>
            </div>
          )}

          <div className="ck-space-y-5">
            <div>
              <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">Tên đăng nhập</label>
              <div className="ck-input-wrap">
                <span className="ck-input-icon"><User size={20} /></span>
                <input
                  type="text"
                  className="ck-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Nhập tên đăng nhập"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="ck-block ck-text-sm ck-font-bold ck-text-gray-300 ck-mb-2">Mật khẩu</label>
              <div className="ck-input-wrap">
                <span className="ck-input-icon"><Lock size={20} /></span>
                <input
                  type="password"
                  className="ck-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            <button
              type="button"
              className="ck-btn ck-btn-primary"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? '⏳ Đang xác thực...' : '🚀 Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== STAT CARD ====================
const StatCard = ({ label, value, change, icon: Icon, color }) => (
  <div className="ck-stat-card ck-rounded-2xl ck-p-6 ck-card-hover">
    <div className="ck-flex ck-items-center ck-justify-between ck-mb-4">
      <div className={`ck-icon-box ck-w-14-h-14 ck-rounded-xl ck-shadow-lg ${color}`}>
        <Icon className="ck-text-white" size={28} />
      </div>
      {change ? (
        <span className={`ck-badge ${change.startsWith('+') ? 'ck-badge-green' : 'ck-badge-red'}`}>{change}</span>
      ) : null}
    </div>
    <p className="ck-text-gray-400 ck-text-sm ck-mb-2 ck-font-medium">{label}</p>
    <p className="ck-text-4xl ck-font-black ck-text-white">{value}</p>
  </div>
);

// ==================== ORDER CARD ====================
const orderStatusConfig = {
  pending: { bg: 'ck-badge-yellow', label: 'Chờ xử lý', icon: Clock },
  processing: { bg: 'ck-badge-blue', label: 'Đang xử lý', icon: Activity },
  completed: { bg: 'ck-badge-green', label: 'Hoàn thành', icon: CheckCircle },
  cancelled: { bg: 'ck-badge-red', label: 'Đã hủy', icon: XCircle },
};

const OrderCard = ({ order, onView }) => {
  const status = orderStatusConfig[order.status] || orderStatusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="ck-order-card ck-rounded-2xl ck-p-6 ck-card-hover">
      <div className="ck-flex ck-justify-between ck-mb-4" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="ck-font-bold ck-text-white ck-text-xl ck-mb-1 ck-mono">{order.id}</h3>
          <p className="ck-text-gray-400 ck-text-sm">{order.date}</p>
        </div>
        <span className={`ck-badge ${status.bg}`}>
          <StatusIcon size={16} />
          {status.label}
        </span>
      </div>

      <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4 ck-mb-4">
        <p className="ck-text-sm ck-text-gray-400 ck-mb-2">Sản phẩm đặt hàng:</p>
        {order.items.slice(0, 3).map((item, idx) => (
          <p key={idx} className="ck-text-sm ck-text-white ck-mb-1">
            • {item.name} <span className="ck-font-bold ck-text-orange-400">x{item.quantity}</span>
          </p>
        ))}
        {order.items.length > 3 && (
          <p className="ck-text-xs ck-text-gray-500 ck-mt-2">+{order.items.length - 3} sản phẩm khác</p>
        )}
      </div>

      {order.note && (
        <div className="ck-bg-blue-500-10 ck-border ck-border-blue-500-30 ck-rounded-lg ck-p-3 ck-mb-4">
          <p className="ck-text-xs ck-text-blue-400 ck-font-semibold ck-mb-1">📝 Ghi chú:</p>
          <p className="ck-text-sm ck-text-orange-300">{order.note}</p>
        </div>
      )}

      <div className="ck-flex ck-items-center ck-justify-between">
        <button
          type="button"
          className="ck-btn ck-text-sm ck-text-orange-400 ck-font-semibold ck-flex ck-items-center ck-gap-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => onView(order)}
        >
          <Eye size={16} />
          Chi tiết
        </button>
        <span className="ck-font-black ck-text-2xl ck-text-orange-400">{order.total.toLocaleString()}₫</span>
      </div>
    </div>
  );
};

// ==================== FRANCHISE STORE PAGE ====================
const FranchiseStorePage = ({ onLogout, userData }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = () => {
    setProducts(StorageManager.getProducts());
    const allOrders = StorageManager.getOrders();
    const myOrders = allOrders.filter((o) => o.storeId === userData.id);
    setOrders(myOrders);
  };

  const stats = [
    { label: 'Đơn hàng tháng này', value: orders.filter((o) => o.date.includes('01/2026')).length.toString(), change: '', icon: ShoppingCart, color: 'ck-icon-box-blue' },
    { label: 'Đang chờ xử lý', value: orders.filter((o) => o.status === 'pending').length.toString(), change: '', icon: Clock, color: 'ck-icon-box-yellow' },
    { label: 'Tồn kho', value: products.reduce((sum, p) => sum + p.stock, 0).toString(), change: '', icon: Package, color: 'ck-icon-box-green' },
    { label: 'Đã hoàn thành', value: orders.filter((o) => o.status === 'completed').length.toString(), change: '', icon: CheckCircle, color: 'ck-icon-box-purple' },
  ];

  const menuItems = [
    { id: 'dashboard', name: 'Tổng quan', icon: LayoutDashboard },
    { id: 'create-order', name: 'Tạo đơn hàng', icon: Plus },
    { id: 'orders', name: 'Đơn hàng của tôi', icon: FileText },
    { id: 'inventory', name: 'Tồn kho', icon: Package },
    { id: 'reports', name: 'Báo cáo', icon: BarChart3 },
  ];

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity } : item)));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) {
      window.alert('Giỏ hàng trống!');
      return;
    }
    if (!deliveryDate) {
      window.alert('Vui lòng chọn ngày giao hàng!');
      return;
    }

    const newOrder = {
      id: `ORD${Date.now().toString().slice(-6)}`,
      storeId: userData.id,
      storeName: userData.storeName,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      status: 'pending',
      date: new Date().toLocaleString('vi-VN'),
      deliveryDate: new Date(deliveryDate).toLocaleDateString('vi-VN'),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      note: orderNote,
      createdBy: userData.name,
    };

    StorageManager.addOrder(newOrder);
    setCart([]);
    setDeliveryDate('');
    setOrderNote('');
    loadData();
    setActiveTab('orders');
    window.alert('✅ Đơn hàng đã được tạo thành công!');
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const lowStockProducts = products.filter((p) => p.stock < p.min * 1.5);
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-logo-icon ck-rounded-xl ck-flex ck-items-center ck-justify-center">
            <Store className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">{userData.storeName}</h1>
            <p className="ck-text-xs ck-text-gray-400 ck-mono">{userData.name} - Nhân viên cửa hàng</p>
          </div>
        </div>
        <div className="ck-flex ck-items-center ck-gap-3">
          <button type="button" className="ck-btn ck-relative ck-p-3 ck-bg-gray-800 ck-rounded-xl" style={{ border: 'none' }}>
            <Bell size={22} className="ck-text-gray-300" />
            {lowStockProducts.length > 0 && (
              <span className="ck-bell-badge">{lowStockProducts.length}</span>
            )}
          </button>
          <button
            type="button"
            className="ck-btn ck-flex ck-items-center ck-gap-2 ck-px-4 ck-py-2 ck-bg-red-500-20 ck-text-red-400 ck-rounded-xl ck-font-semibold"
            style={{ border: 'none' }}
            onClick={onLogout}
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="ck-flex">
        <aside className="ck-sidebar">
          <nav className="ck-sidebar-nav ck-space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ck-sidebar-item ck-sidebar-btn ${activeTab === item.id ? 'ck-active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="ck-main ck-scrollbar ck-max-w-7xl" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          {activeTab === 'dashboard' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">Dashboard</h2>

              <div className="ck-grid-4 ck-gap-6 ck-mb-10">
                {stats.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>

              <div className="ck-grid-1-lg-2 ck-gap-6 ck-mb-8">
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6">
                  <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-flex ck-items-center ck-gap-3">
                      <FileText size={28} className="ck-text-orange-400" />
                      Đơn hàng gần đây
                    </h3>
                    <button
                      type="button"
                      className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2"
                      onClick={() => setActiveTab('create-order')}
                    >
                      <Plus size={18} />
                      Tạo đơn
                    </button>
                  </div>
                  <div className="ck-space-y-4">
                    {orders.length === 0 ? (
                      <div className="ck-text-center ck-py-12">
                        <FileText size={64} className="ck-text-gray-700" style={{ margin: '0 auto 1rem' }} />
                        <p className="ck-text-gray-500">Chưa có đơn hàng nào</p>
                      </div>
                    ) : (
                      orders.slice(0, 3).map((order) => (
                        <OrderCard key={order.id} order={order} onView={setSelectedOrder} />
                      ))
                    )}
                  </div>
                </div>

                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6 ck-flex ck-items-center ck-gap-3">
                    <AlertTriangle size={28} className="ck-text-yellow-400" />
                    Cảnh báo tồn kho
                  </h3>
                  <div className="ck-space-y-3">
                    {lowStockProducts.length === 0 ? (
                      <div className="ck-text-center ck-py-12">
                        <CheckCircle size={64} className="ck-text-green-500" style={{ margin: '0 auto 1rem' }} />
                        <p className="ck-text-green-400 ck-font-semibold">Tồn kho đầy đủ</p>
                      </div>
                    ) : (
                      lowStockProducts.map((product) => (
                        <div key={product.id} className="ck-flex ck-items-center ck-justify-between ck-p-4 ck-bg-yellow-500-10 ck-border ck-border-yellow-500-30 ck-rounded-xl">
                          <div className="ck-flex ck-items-center ck-gap-3">
                            <span className="ck-text-4xl">{product.emoji}</span>
                            <div>
                              <p className="ck-font-bold ck-text-white">{product.name}</p>
                              <p className="ck-text-sm ck-text-yellow-400">Còn {product.stock} / Tối thiểu {product.min}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ck-btn ck-px-4 ck-py-2 ck-bg-orange-500 ck-text-black ck-rounded-lg ck-font-bold"
                            onClick={() => {
                              addToCart(product);
                              setActiveTab('create-order');
                            }}
                          >
                            Đặt
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'create-order' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">Tạo đơn hàng mới</h2>

              <div className="ck-grid-1-lg-3 ck-gap-6">
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6" style={{ gridColumn: 'span 2' }}>
                  <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">Danh sách sản phẩm</h3>
                    <div className="ck-flex ck-gap-3">
                      <div className="ck-relative">
                        <Search className="ck-absolute ck-left-4" style={{ top: '50%', transform: 'translateY(-50%)' }} size={20} />
                        <input
                          type="text"
                          className="ck-input ck-pl-12"
                          style={{ paddingLeft: '2.5rem' }}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Tìm sản phẩm..."
                        />
                      </div>
                      <select
                        className="ck-select ck-px-4 ck-py-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả' : cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ck-grid-1-md-2 ck-gap-4 ck-max-h-600 ck-overflow-y-auto ck-scrollbar ck-pr-2">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="ck-border ck-border-gray-700 ck-rounded-xl ck-p-5 ck-bg-gray-900-50 ck-card-hover">
                        <div className="ck-flex ck-justify-between ck-mb-4" style={{ alignItems: 'flex-start' }}>
                          <div className="ck-flex ck-items-center ck-gap-3">
                            <span className="ck-text-5xl">{product.emoji}</span>
                            <div>
                              <h4 className="ck-font-bold ck-text-white ck-text-lg">{product.name}</h4>
                              <p className="ck-text-sm ck-text-gray-400">{product.category}</p>
                              <p className="ck-text-xs ck-text-gray-500 ck-mono">{product.id}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ck-flex ck-items-center ck-justify-between">
                          <div>
                            <p className="ck-text-2xl ck-font-black ck-text-orange-400">{product.price.toLocaleString()}₫</p>
                            <p className="ck-text-xs ck-text-gray-500 ck-mono">Còn {product.stock}</p>
                          </div>
                          <button
                            type="button"
                            className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-primary ck-text-white ck-rounded-lg ck-font-bold ck-flex ck-items-center ck-gap-2"
                            onClick={() => addToCart(product)}
                          >
                            <Plus size={16} />
                            Thêm
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-h-fit ck-sticky-top-24">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6 ck-flex ck-items-center ck-gap-3">
                    <ShoppingCart size={28} className="ck-text-orange-400" />
                    Giỏ hàng ({cart.length})
                  </h3>

                  {cart.length === 0 ? (
                    <div className="ck-text-center ck-py-12">
                      <ShoppingCart size={64} className="ck-text-gray-700" style={{ margin: '0 auto 1rem' }} />
                      <p className="ck-text-gray-500">Giỏ hàng trống</p>
                    </div>
                  ) : (
                    <>
                      <div className="ck-space-y-3 ck-mb-6 ck-max-h-96 ck-overflow-y-auto ck-scrollbar">
                        {cart.map((item) => (
                          <div key={item.id} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-xl ck-p-3">
                            <div className="ck-flex ck-justify-between ck-mb-3" style={{ alignItems: 'flex-start' }}>
                              <div className="ck-flex ck-gap-3">
                                <span className="ck-text-3xl">{item.emoji}</span>
                                <div>
                                  <p className="ck-font-bold ck-text-white">{item.name}</p>
                                  <p className="ck-text-sm ck-text-gray-400 ck-mono">{item.price.toLocaleString()}₫</p>
                                </div>
                              </div>
                              <button type="button" className="ck-btn ck-text-red-500 ck-p-1 ck-rounded" onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="ck-flex ck-items-center ck-justify-between">
                              <div className="ck-flex ck-items-center ck-gap-2 ck-bg-gray-800 ck-rounded-lg ck-border ck-border-gray-700">
                                <button type="button" className="ck-btn ck-px-3 ck-py-2" onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ border: 'none', background: 'none', color: '#e5e7eb' }}>-</button>
                                <span className="ck-font-bold ck-text-white ck-px-3 ck-mono">{item.quantity}</span>
                                <button type="button" className="ck-btn ck-px-3 ck-py-2" onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ border: 'none', background: 'none', color: '#e5e7eb' }}>+</button>
                              </div>
                              <span className="ck-font-black ck-text-orange-400 ck-mono">{(item.price * item.quantity).toLocaleString()}₫</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="ck-border-t ck-border-gray-700 ck-pt-4 ck-space-y-4">
                        <div className="ck-flex ck-justify-between ck-text-lg ck-font-bold">
                          <span className="ck-text-gray-400">Tổng cộng</span>
                          <span className="ck-text-orange-400 ck-text-2xl ck-mono">
                            {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}₫
                          </span>
                        </div>

                        <div>
                          <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">
                            Ngày giao hàng <span className="ck-text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            className="ck-input ck-w-full ck-mono"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
        />
      </div>

                        <div>
                          <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Ghi chú đặc biệt</label>
                          <textarea
                            className="ck-input ck-w-full ck-textarea"
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="VD: Giao trước 6h sáng, để riêng..."
                            rows={3}
                          />
                        </div>

                        <button
                          type="button"
                          className="ck-btn ck-w-full ck-py-4 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-black ck-text-lg ck-flex ck-items-center ck-justify-center ck-gap-2"
                          onClick={handleCreateOrder}
                        >
                          <Send size={20} />
                          Gửi đơn đặt hàng
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="ck-flex ck-items-center ck-justify-between ck-mb-8">
                <h2 className="ck-text-4xl ck-font-black ck-text-white">Đơn hàng của tôi</h2>
                <div className="ck-flex ck-gap-3">
                  <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-border ck-border-gray-700 ck-text-gray-300 ck-rounded-xl ck-flex ck-items-center ck-gap-2" style={{ border: '1px solid' }}>
                    <Filter size={20} />
                    Lọc
                  </button>
                  <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 ck-border ck-border-gray-700 ck-text-gray-300 ck-rounded-xl ck-flex ck-items-center ck-gap-2" style={{ border: '1px solid' }}>
                    <Download size={20} />
                    Xuất Excel
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-12 ck-text-center">
                  <FileText size={80} className="ck-text-gray-700" style={{ margin: '0 auto 1rem' }} />
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-2">Chưa có đơn hàng nào</h3>
                  <p className="ck-text-gray-400 ck-mb-6">Hãy tạo đơn hàng đầu tiên của bạn</p>
                  <button type="button" className="ck-btn ck-px-6 ck-py-3 ck-bg-gradient-btn-primary ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2" style={{ margin: '0 auto' }} onClick={() => setActiveTab('create-order')}>
                    <Plus size={20} />
                    Tạo đơn hàng
                  </button>
                </div>
              ) : (
                <div className="ck-grid-1-md-2 ck-gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onView={setSelectedOrder} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'inventory' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">Tồn kho cửa hàng</h2>

              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <div className="ck-flex ck-gap-3">
                    <div className="ck-relative">
                      <Search className="ck-absolute ck-left-4" style={{ top: '50%', transform: 'translateY(-50%)' }} size={20} />
                      <input
                        type="text"
                        className="ck-input ck-w-64 ck-mono"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm sản phẩm..."
                      />
                    </div>
                    <select className="ck-select ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả danh mục' : cat}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="ck-btn ck-px-4 ck-py-3 ck-bg-green-600 ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2">
                    <Download size={18} />
                    Xuất báo cáo
                  </button>
                </div>

                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th className="ck-text-center">Tồn kho</th>
                        <th className="ck-text-center">Tối thiểu</th>
                        <th className="ck-text-center">Giá</th>
                        <th className="ck-text-center">Trạng thái</th>
                        <th className="ck-text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const percent = (product.stock / product.min) * 100;
                        const status = percent < 100 ? 'low' : percent < 150 ? 'warn' : 'good';
                        return (
                          <tr key={product.id}>
                            <td>
                              <div className="ck-flex ck-items-center ck-gap-4">
                                <span className="ck-text-4xl">{product.emoji}</span>
                                <div>
                                  <p className="ck-font-bold ck-text-white ck-text-lg">{product.name}</p>
                                  <p className="ck-text-sm ck-text-gray-500 ck-mono">{product.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="ck-text-gray-400">{product.category}</td>
                            <td className="ck-text-center"><span className="ck-font-black ck-text-2xl ck-text-white ck-mono">{product.stock}</span></td>
                            <td className="ck-text-center ck-text-gray-400 ck-mono">{product.min}</td>
                            <td className="ck-text-center"><span className="ck-font-bold ck-text-orange-400 ck-mono">{product.price.toLocaleString()}₫</span></td>
                            <td className="ck-text-center">
                              <span className={`ck-badge ${status === 'good' ? 'ck-badge-green' : status === 'warn' ? 'ck-badge-yellow' : 'ck-badge-red'}`}>
                                {status === 'good' ? '✓ Đủ hàng' : status === 'warn' ? '⚠ Sắp hết' : '✗ Thiếu'}
                              </span>
                            </td>
                            <td className="ck-text-center">
                              <button
                                type="button"
                                className="ck-btn ck-px-4 ck-py-2 ck-bg-orange-600 ck-text-white ck-rounded-lg ck-font-bold"
                                onClick={() => { addToCart(product); setActiveTab('create-order'); }}
                              >
                                Đặt hàng
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'reports' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">Báo cáo & Thống kê</h2>

              <div className="ck-grid-1-md-2 ck-gap-6 ck-mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                <div className="ck-bg-blue-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6">
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div className="ck-w-12-h-12 ck-bg-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center"><ShoppingCart className="ck-text-white" size={24} /></div>
                    <div>
                      <p className="ck-text-sm ck-text-blue-400">Tổng đơn hàng</p>
                      <p className="ck-text-3xl ck-font-black ck-text-white">{orders.length}</p>
                    </div>
                  </div>
                </div>
                <div className="ck-bg-green-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div className="ck-w-12-h-12 ck-bg-green-600 ck-rounded-xl ck-flex ck-items-center ck-justify-center"><DollarSign className="ck-text-white" size={24} /></div>
                    <div>
                      <p className="ck-text-sm ck-text-green-400">Tổng giá trị</p>
                      <p className="ck-text-3xl ck-font-black ck-text-white ck-mono">{(orders.reduce((sum, o) => sum + o.total, 0) / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                </div>
                <div className="ck-bg-purple-500-20 ck-border ck-border-blue-500-30 ck-rounded-2xl ck-p-6" style={{ background: 'rgba(168,85,247,0.2)', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <div className="ck-flex ck-items-center ck-gap-3 ck-mb-4">
                    <div className="ck-w-12-h-12 ck-bg-gray-700 ck-rounded-xl ck-flex ck-items-center ck-justify-center" style={{ background: '#a855f7' }}><TrendingUp className="ck-text-white" size={24} /></div>
                    <div>
                      <p className="ck-text-sm ck-text-purple-400">TB đơn hàng</p>
                      <p className="ck-text-3xl ck-font-black ck-text-white ck-mono">{orders.length > 0 ? (orders.reduce((sum, o) => sum + o.total, 0) / orders.length / 1000).toFixed(0) : 0}K</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6">
                <h3 className="ck-text-2xl ck-font-bold ck-text-white ck-mb-6">Lịch sử đặt hàng gần đây</h3>
                <div className="ck-space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order.id} className="ck-flex ck-items-center ck-justify-between ck-p-4 ck-bg-gray-900-50 ck-border ck-border-gray-700 ck-rounded-xl">
                      <div>
                        <p className="ck-font-bold ck-text-white ck-mono">{order.id}</p>
                        <p className="ck-text-sm ck-text-gray-400">{order.date}</p>
                      </div>
                      <div className="ck-text-center" style={{ textAlign: 'right' }}>
                        <p className="ck-font-black ck-text-orange-400 ck-mono">{order.total.toLocaleString()}₫</p>
                        <p className="ck-text-sm ck-text-gray-400">{order.items.length} sản phẩm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {selectedOrder && (
        <div className="ck-modal-overlay" onClick={() => setSelectedOrder(null)} role="presentation">
          <div className="ck-modal-box ck-max-w-2xl ck-w-full ck-p-8" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-3xl ck-font-black ck-text-white">Chi tiết đơn hàng</h3>
              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none' }}>
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>

            <div className="ck-grid-2 ck-gap-4 ck-mb-6">
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Mã đơn hàng</p>
                <p className="ck-font-bold ck-text-xl ck-text-white ck-mono">{selectedOrder.id}</p>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Trạng thái</p>
                <span className={`ck-badge ${selectedOrder.status === 'pending' ? 'ck-badge-yellow' : selectedOrder.status === 'processing' ? 'ck-badge-blue' : selectedOrder.status === 'completed' ? 'ck-badge-green' : 'ck-badge-red'}`}>
                  {selectedOrder.status === 'pending' ? 'Chờ xử lý' : selectedOrder.status === 'processing' ? 'Đang xử lý' : selectedOrder.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                </span>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Ngày đặt</p>
                <p className="ck-font-semibold ck-text-white">{selectedOrder.date}</p>
              </div>
              <div className="ck-bg-gray-900-50 ck-rounded-xl ck-p-4">
                <p className="ck-text-sm ck-text-gray-400 ck-mb-1">Ngày giao dự kiến</p>
                <p className="ck-font-semibold ck-text-white">{selectedOrder.deliveryDate}</p>
              </div>
            </div>

            <div className="ck-border-t ck-border-gray-700 ck-pt-6 ck-mb-6">
              <h4 className="ck-font-bold ck-text-white ck-mb-4 ck-text-lg">Sản phẩm đặt hàng</h4>
              <div className="ck-space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="ck-flex ck-justify-between ck-items-center ck-bg-gray-900-50 ck-p-4 ck-rounded-xl">
                    <div>
                      <p className="ck-font-semibold ck-text-white">{item.name}</p>
                      <p className="ck-text-sm ck-text-gray-400 ck-mono">Số lượng: {item.quantity}</p>
                    </div>
                    <p className="ck-font-bold ck-text-orange-400 ck-mono">{(item.price * item.quantity).toLocaleString()}₫</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.note && (
              <div className="ck-bg-blue-500-10 ck-border ck-border-blue-500-30 ck-rounded-xl ck-p-4 ck-mb-6">
                <p className="ck-text-sm ck-font-semibold ck-text-blue-400 ck-mb-2">📝 Ghi chú:</p>
                <p className="ck-text-white">{selectedOrder.note}</p>
              </div>
            )}

            <div className="ck-border-t ck-border-gray-700 ck-pt-6 ck-flex ck-justify-between ck-items-center">
              <span className="ck-text-xl ck-font-bold ck-text-white">Tổng cộng</span>
              <span className="ck-text-3xl ck-font-black ck-text-orange-400 ck-mono">{selectedOrder.total.toLocaleString()}₫</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN PAGE ====================
const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'franchise', label: 'Cửa hàng franchise', icon: Store },
  { id: 'kitchen', label: 'Bếp trung tâm', icon: Package },
];

const AdminPage = ({ onLogout, userData }) => {
  const [adminTab, setAdminTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [kitchenSubTab, setKitchenSubTab] = useState('categories'); // 'categories' | 'products'
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'franchise',
    storeName: '',
    status: 'active',
  });
  const [newStore, setNewStore] = useState({ username: '', password: '', name: '', storeName: '', status: 'active' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', min: '', emoji: '🥪' });

  useEffect(() => {
    loadUsers();
    loadCategories();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = () => {
    setUsers(StorageManager.getUsers());
  };
  const loadCategories = () => {
    setCategories(StorageManager.getCategories());
  };
  const loadProducts = () => {
    setProducts(StorageManager.getProducts());
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      window.alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (newUser.role === 'franchise' && !newUser.storeName) {
      window.alert('Vui lòng nhập tên cửa hàng!');
      return;
    }
    const existingUsers = StorageManager.getUsers();
    const userExists = existingUsers.find((u) => u.username === newUser.username);
    if (userExists) {
      window.alert('Tên đăng nhập đã tồn tại!');
      return;
    }
    const user = { id: Date.now(), ...newUser, createdAt: new Date().toLocaleDateString('vi-VN') };
    existingUsers.push(user);
    StorageManager.saveUsers(existingUsers);
    loadUsers();
    setShowAddUser(false);
    setNewUser({ username: '', password: '', name: '', role: 'franchise', storeName: '', status: 'active' });
    window.alert('✅ Thêm người dùng thành công!');
  };

  const handleToggleStatus = (userId) => {
    const existingUsers = StorageManager.getUsers();
    const updatedUsers = existingUsers.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    StorageManager.saveUsers(updatedUsers);
    loadUsers();
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    const existingUsers = StorageManager.getUsers();
    const updatedUsers = existingUsers.filter((u) => u.id !== userId);
    StorageManager.saveUsers(updatedUsers);
    loadUsers();
    window.alert('✅ Đã xóa người dùng!');
  };

  const handleChangeRole = (userId, newRole) => {
    const existingUsers = StorageManager.getUsers();
    const updatedUsers = existingUsers.map((u) => {
      if (u.id !== userId) return u;
      const updated = { ...u, role: newRole };
      if (newRole !== 'franchise') {
        updated.storeName = '';
      }
      return updated;
    });
    StorageManager.saveUsers(updatedUsers);
    loadUsers();
    window.alert('✅ Đã đổi vai trò!');
  };

  const handleAddStore = () => {
    if (!newStore.username || !newStore.password || !newStore.name || !newStore.storeName) {
      window.alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    const existingUsers = StorageManager.getUsers();
    if (existingUsers.find((u) => u.username === newStore.username)) {
      window.alert('Tên đăng nhập đã tồn tại!');
      return;
    }
    const user = { id: Date.now(), ...newStore, role: 'franchise', createdAt: new Date().toLocaleDateString('vi-VN') };
    existingUsers.push(user);
    StorageManager.saveUsers(existingUsers);
    loadUsers();
    setShowAddStore(false);
    setNewStore({ username: '', password: '', name: '', storeName: '', status: 'active' });
    window.alert('✅ Thêm cửa hàng thành công!');
  };

  const handleSaveCategory = () => {
    const name = (editingCategory ? editingCategory.name : newCategoryName).trim();
    if (!name) {
      window.alert('Vui lòng nhập tên danh mục!');
      return;
    }
    const list = StorageManager.getCategories();
    if (editingCategory) {
      const updated = list.map((c) => (c.id === editingCategory.id ? { ...c, name } : c));
      StorageManager.saveCategories(updated);
      const prods = StorageManager.getProducts().map((p) => (p.category === editingCategory.name ? { ...p, category: name } : p));
      StorageManager.saveProducts(prods);
      setEditingCategory(null);
      window.alert('✅ Đã cập nhật danh mục!');
    } else {
      if (list.some((c) => c.name === name)) {
        window.alert('Danh mục này đã tồn tại!');
        return;
      }
      list.push({ id: 'cat' + Date.now(), name });
      StorageManager.saveCategories(list);
      setNewCategoryName('');
      setShowAddCategory(false);
      window.alert('✅ Thêm danh mục thành công!');
    }
    loadCategories();
    loadProducts();
  };

  const handleDeleteCategory = (cat) => {
    const prods = StorageManager.getProducts().filter((p) => p.category === cat.name);
    if (prods.length > 0) {
      window.alert(`Không thể xóa. Còn ${prods.length} sản phẩm thuộc danh mục "${cat.name}". Hãy đổi danh mục sản phẩm trước.`);
      return;
    }
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    const list = StorageManager.getCategories().filter((c) => c.id !== cat.id);
    StorageManager.saveCategories(list);
    loadCategories();
    window.alert('✅ Đã xóa danh mục!');
  };

  const handleSaveProduct = () => {
    const p = editingProduct || newProduct;
    const name = (p.name || '').trim();
    const category = (p.category || '').trim();
    const price = parseInt(p.price, 10);
    const stock = parseInt(p.stock, 10);
    const min = parseInt(p.min, 10);
    if (!name || !category || Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0 || Number.isNaN(min) || min < 0) {
      window.alert('Vui lòng điền đầy đủ thông tin hợp lệ (tên, danh mục, giá, tồn kho, min).');
      return;
    }
    const list = StorageManager.getProducts();
    if (editingProduct) {
      const updated = list.map((x) => (x.id === editingProduct.id ? { ...editingProduct, name, category, price, stock, min, emoji: p.emoji || '🥪' } : x));
      StorageManager.saveProducts(updated);
      setEditingProduct(null);
      window.alert('✅ Đã cập nhật sản phẩm!');
    } else {
      const maxNum = list.reduce((acc, x) => {
        const n = parseInt(String(x.id).replace(/\D/g, ''), 10);
        return Number.isNaN(n) ? acc : Math.max(acc, n);
      }, 0);
      const id = 'P' + String(maxNum + 1).padStart(3, '0');
      list.push({ id, name, category, price, stock, min, emoji: p.emoji || '🥪' });
      StorageManager.saveProducts(list);
      setShowAddProduct(false);
      setNewProduct({ name: '', category: '', price: '', stock: '', min: '', emoji: '🥪' });
      window.alert('✅ Thêm sản phẩm thành công!');
    }
    loadProducts();
  };

  const handleDeleteProduct = (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    const list = StorageManager.getProducts().filter((p) => p.id !== product.id);
    StorageManager.saveProducts(list);
    loadProducts();
    window.alert('✅ Đã xóa sản phẩm!');
  };

  const franchiseStores = users.filter((u) => u.role === 'franchise');

  const adminStats = [
    { label: 'Tổng người dùng', value: users.length.toString(), change: '', icon: Users, color: 'ck-icon-box-blue' },
    { label: 'Đang hoạt động', value: users.filter((u) => u.status === 'active').length.toString(), change: '', icon: CheckCircle, color: 'ck-icon-box-green' },
    { label: 'Nhân viên CH', value: users.filter((u) => u.role === 'franchise').length.toString(), change: '', icon: Store, color: 'ck-icon-box-purple' },
    { label: 'Quản trị viên', value: users.filter((u) => u.role === 'admin').length.toString(), change: '', icon: Shield, color: 'ck-icon-box-red' },
  ];

  const roleLabels = { admin: 'Quản trị viên', franchise: 'Nhân viên cửa hàng', kitchen: 'Nhân viên bếp', coordinator: 'Điều phối viên', manager: 'Quản lý' };

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black">
      <div className="ck-grain" />

      <header className="ck-header ck-px-6 ck-py-4 ck-flex ck-items-center ck-justify-between">
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-12-h-12 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg">
            <Shield className="ck-text-white" size={24} />
          </div>
          <div>
            <h1 className="ck-text-lg ck-font-bold ck-text-white">Quản trị hệ thống</h1>
            <p className="ck-text-xs ck-text-gray-400 ck-mono">{userData.name} - Admin</p>
          </div>
        </div>
        <button type="button" className="ck-btn ck-flex ck-items-center ck-gap-2 ck-px-4 ck-py-2 ck-bg-red-500-20 ck-text-red-400 ck-rounded-xl ck-font-semibold" style={{ border: 'none' }} onClick={onLogout}>
          <LogOut size={18} />
          Đăng xuất
        </button>
      </header>

      <main className="ck-p-8">
        <div className="ck-max-w-7xl" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="ck-flex ck-gap-2 ck-mb-8 ck-flex-wrap">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`ck-btn ck-px-5 ck-py-3 ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2 ${adminTab === tab.id ? 'ck-bg-gradient-btn-admin ck-text-white' : 'ck-bg-gray-800 ck-text-gray-400'}`}
                  style={adminTab !== tab.id ? { border: '1px solid var(--ck-border)' } : {}}
                  onClick={() => setAdminTab(tab.id)}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {adminTab === 'dashboard' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-8">Dashboard Admin</h2>
              <div className="ck-grid-4 ck-gap-6 ck-mb-10">
                {adminStats.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">Quản lý người dùng</h3>
                  <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2" onClick={() => setShowAddUser(true)}>
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
                            <p className="ck-font-bold ck-text-white ck-mono">{user.username}</p>
                            <p className="ck-text-xs ck-text-gray-500">ID: {user.id}</p>
                          </td>
                          <td>
                            <div className="ck-flex ck-items-center ck-gap-3">
                              <div className="ck-avatar">{user.name.charAt(0)}</div>
                              <span className="ck-font-semibold ck-text-white">{user.name}</span>
                            </div>
                          </td>
                          <td>
                            {user.id === userData.id ? (
                              <span className="ck-text-gray-400">{roleLabels[user.role]}</span>
                            ) : (
                              <select
                                className="ck-select ck-px-3 ck-py-2 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-lg ck-text-sm"
                                value={user.role}
                                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                              >
                                <option value="admin">Quản trị viên</option>
                                <option value="franchise">Nhân viên cửa hàng</option>
                                <option value="kitchen">Nhân viên bếp</option>
                                <option value="coordinator">Điều phối viên</option>
                                <option value="manager">Quản lý</option>
                              </select>
                            )}
                          </td>
                          <td className="ck-text-gray-400">{user.storeName || '-'}</td>
                          <td className="ck-text-center">
                            <button
                              type="button"
                              className={`ck-btn ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${user.status === 'active' ? 'ck-bg-green-500-20 ck-text-green-400' : 'ck-bg-gray-500-20 ck-text-gray-400'}`}
                              style={{ border: 'none' }}
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.status === 'active' ? '✓ Hoạt động' : '✗ Vô hiệu'}
                            </button>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" style={{ background: 'none', border: 'none' }} onClick={() => handleToggleStatus(user.id)} title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                                {user.status === 'active' ? <XCircle size={18} className="ck-text-yellow-400" /> : <CheckCircle size={18} className="ck-text-green-400" />}
                              </button>
                              {user.role !== 'admin' && (
                                <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20" style={{ border: 'none' }} onClick={() => handleDeleteUser(user.id)} title="Xóa">
                                  <Trash2 size={18} className="ck-text-red-400" />
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

          {adminTab === 'franchise' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">Quản lý danh mục cửa hàng franchise</h2>
              <p className="ck-text-gray-400 ck-mb-6">Danh sách cửa hàng franchise và tài khoản nhân viên cửa hàng.</p>
              <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                  <h3 className="ck-text-2xl ck-font-bold ck-text-white">Danh sách cửa hàng</h3>
                  <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2" onClick={() => setShowAddStore(true)}>
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
                          <td className="ck-font-semibold ck-text-white">{user.storeName || '-'}</td>
                          <td className="ck-text-gray-400">{user.name}</td>
                          <td className="ck-mono ck-text-gray-400">{user.username}</td>
                          <td className="ck-text-center">
                            <span className={`ck-px-3 ck-py-1 ck-rounded-full ck-text-xs ck-font-bold ${user.status === 'active' ? 'ck-bg-green-500-20 ck-text-green-400' : 'ck-bg-gray-500-20 ck-text-gray-400'}`}>
                              {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                            </span>
                          </td>
                          <td className="ck-text-center">
                            <div className="ck-flex ck-gap-2 ck-justify-center">
                              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white" style={{ border: 'none' }} onClick={() => handleToggleStatus(user.id)} title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                                {user.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                              </button>
                              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20" style={{ border: 'none' }} onClick={() => handleDeleteUser(user.id)} title="Xóa">
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
                  <div className="ck-p-8 ck-text-center ck-text-gray-400">Chưa có cửa hàng franchise. Bấm &quot;Thêm cửa hàng&quot; để tạo.</div>
                )}
              </div>
            </>
          )}

          {adminTab === 'kitchen' && (
            <>
              <h2 className="ck-text-4xl ck-font-black ck-text-white ck-mb-6">Quản lý danh mục bếp trung tâm</h2>
              <p className="ck-text-gray-400 ck-mb-6">Danh mục sản phẩm và sản phẩm do bếp trung tâm cung cấp.</p>
              <div className="ck-flex ck-gap-2 ck-mb-6">
                <button type="button" className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === 'categories' ? 'ck-bg-orange-500-20 ck-text-orange-400' : 'ck-bg-gray-800 ck-text-gray-400'}`} style={kitchenSubTab !== 'categories' ? { border: '1px solid var(--ck-border)' } : { border: 'none' }} onClick={() => setKitchenSubTab('categories')}>
                  Danh mục sản phẩm
                </button>
                <button type="button" className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === 'products' ? 'ck-bg-orange-500-20 ck-text-orange-400' : 'ck-bg-gray-800 ck-text-gray-400'}`} style={kitchenSubTab !== 'products' ? { border: '1px solid var(--ck-border)' } : { border: 'none' }} onClick={() => setKitchenSubTab('products')}>
                  Sản phẩm bếp trung tâm
                </button>
              </div>

              {kitchenSubTab === 'categories' && (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">Danh mục sản phẩm</h3>
                    <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2" onClick={() => { setShowAddCategory(true); setEditingCategory(null); setNewCategoryName(''); }}>
                      <Plus size={18} />
                      Thêm danh mục
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
                            <td className="ck-text-gray-400">{products.filter((p) => p.category === cat.name).length}</td>
                            <td className="ck-text-center">
                              <div className="ck-flex ck-gap-2 ck-justify-center">
                                <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white" style={{ border: 'none' }} onClick={() => { setEditingCategory(cat); setShowAddCategory(true); setNewCategoryName(cat.name); }} title="Sửa">
                                  <Eye size={18} />
                                </button>
                                <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20" style={{ border: 'none' }} onClick={() => handleDeleteCategory(cat)} title="Xóa">
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
                    <div className="ck-p-8 ck-text-center ck-text-gray-400">Chưa có danh mục. Bấm &quot;Thêm danh mục&quot; để tạo.</div>
                  )}
                </div>
              )}

              {kitchenSubTab === 'products' && (
                <div className="ck-bg-gradient-card-solid ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden">
                  <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                    <h3 className="ck-text-2xl ck-font-bold ck-text-white">Sản phẩm bếp trung tâm</h3>
                    <button type="button" className="ck-btn ck-px-4 ck-py-2 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold ck-flex ck-items-center ck-gap-2" onClick={() => { setShowAddProduct(true); setEditingProduct(null); setNewProduct({ name: '', category: categories[0]?.name || '', price: '', stock: '', min: '', emoji: '🥪' }); }}>
                      <Plus size={18} />
                      Thêm sản phẩm
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
                                <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-gray-700 ck-text-white" style={{ border: 'none' }} onClick={() => { setEditingProduct(p); setShowAddProduct(true); setNewProduct({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), min: String(p.min), emoji: p.emoji || '🥪' }); }} title="Sửa">
                                  <Eye size={18} />
                                </button>
                                <button type="button" className="ck-btn ck-p-2 ck-rounded-lg ck-bg-red-500-20" style={{ border: 'none' }} onClick={() => handleDeleteProduct(p)} title="Xóa">
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
                    <div className="ck-p-8 ck-text-center ck-text-gray-400">Chưa có sản phẩm. Bấm &quot;Thêm sản phẩm&quot; để tạo.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showAddUser && (
        <div className="ck-modal-overlay" onClick={() => setShowAddUser(false)} role="presentation">
          <div className="ck-modal-box ck-max-w-md ck-w-full ck-p-8" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">Thêm người dùng mới</h3>
              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" onClick={() => setShowAddUser(false)} style={{ background: 'none', border: 'none' }}>
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>

            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên đăng nhập *</label>
                <input type="text" className="ck-input ck-w-full" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="username" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mật khẩu *</label>
                <input type="password" className="ck-input ck-w-full" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="********" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Họ tên *</label>
                <input type="text" className="ck-input ck-w-full" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Vai trò *</label>
                <select className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="franchise">Nhân viên cửa hàng</option>
                  <option value="kitchen">Nhân viên bếp</option>
                  <option value="coordinator">Điều phối viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              {newUser.role === 'franchise' && (
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên cửa hàng *</label>
                  <input type="text" className="ck-input ck-w-full" value={newUser.storeName} onChange={(e) => setNewUser({ ...newUser, storeName: e.target.value })} placeholder="Cửa hàng Quận 1" />
                </div>
              )}
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold" style={{ border: 'none' }} onClick={() => setShowAddUser(false)}>Hủy</button>
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold" style={{ border: 'none' }} onClick={handleAddUser}>Thêm người dùng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStore && (
        <div className="ck-modal-overlay" onClick={() => setShowAddStore(false)} role="presentation">
          <div className="ck-modal-box ck-max-w-md ck-w-full ck-p-8" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">Thêm cửa hàng franchise</h3>
              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" onClick={() => setShowAddStore(false)} style={{ background: 'none', border: 'none' }}>
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên cửa hàng *</label>
                <input type="text" className="ck-input ck-w-full" value={newStore.storeName} onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })} placeholder="Cửa hàng Quận 1" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Người phụ trách (họ tên) *</label>
                <input type="text" className="ck-input ck-w-full" value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên đăng nhập *</label>
                <input type="text" className="ck-input ck-w-full" value={newStore.username} onChange={(e) => setNewStore({ ...newStore, username: e.target.value })} placeholder="username" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mật khẩu *</label>
                <input type="password" className="ck-input ck-w-full" value={newStore.password} onChange={(e) => setNewStore({ ...newStore, password: e.target.value })} placeholder="********" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Trạng thái</label>
                <select className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={newStore.status} onChange={(e) => setNewStore({ ...newStore, status: e.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                </select>
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold" style={{ border: 'none' }} onClick={() => setShowAddStore(false)}>Hủy</button>
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold" style={{ border: 'none' }} onClick={handleAddStore}>Thêm cửa hàng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddCategory || editingCategory) && (
        <div className="ck-modal-overlay" onClick={() => { setShowAddCategory(false); setEditingCategory(null); setNewCategoryName(''); }} role="presentation">
          <div className="ck-modal-box ck-max-w-md ck-w-full ck-p-8" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục sản phẩm'}</h3>
              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" onClick={() => { setShowAddCategory(false); setEditingCategory(null); setNewCategoryName(''); }} style={{ background: 'none', border: 'none' }}>
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên danh mục *</label>
                <input type="text" className="ck-input ck-w-full" value={editingCategory ? editingCategory.name : newCategoryName} onChange={(e) => (editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCategoryName(e.target.value))} placeholder="Ví dụ: Bánh mì" />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold" style={{ border: 'none' }} onClick={() => { setShowAddCategory(false); setEditingCategory(null); setNewCategoryName(''); }}>Hủy</button>
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold" style={{ border: 'none' }} onClick={handleSaveCategory}>{editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddProduct || editingProduct) && (
        <div className="ck-modal-overlay" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} role="presentation">
          <div className="ck-modal-box ck-max-w-md ck-w-full ck-p-8" onClick={(e) => e.stopPropagation()} role="presentation">
            <div className="ck-flex ck-items-center ck-justify-between ck-mb-6">
              <h3 className="ck-text-2xl ck-font-black ck-text-white">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm bếp trung tâm'}</h3>
              <button type="button" className="ck-btn ck-p-2 ck-rounded-lg" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} style={{ background: 'none', border: 'none' }}>
                <X size={24} className="ck-text-gray-400" />
              </button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tên sản phẩm *</label>
                <input type="text" className="ck-input ck-w-full" value={(editingProduct ? editingProduct : newProduct).name} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, name: e.target.value }) : setNewProduct({ ...newProduct, name: e.target.value }))} placeholder="Bánh mì sandwich" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Danh mục *</label>
                <select className="ck-select ck-w-full ck-px-4 ck-py-3 ck-bg-gray-900 ck-border ck-border-gray-700 ck-text-white ck-rounded-xl" value={(editingProduct ? editingProduct : newProduct).category} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, category: e.target.value }) : setNewProduct({ ...newProduct, category: e.target.value }))}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="ck-grid-2 ck-gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Giá (₫) *</label>
                  <input type="number" min="0" className="ck-input ck-w-full" value={(editingProduct ? editingProduct : newProduct).price} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, price: e.target.value }) : setNewProduct({ ...newProduct, price: e.target.value }))} placeholder="25000" />
                </div>
                <div>
                  <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Tồn kho *</label>
                  <input type="number" min="0" className="ck-input ck-w-full" value={(editingProduct ? editingProduct : newProduct).stock} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, stock: e.target.value }) : setNewProduct({ ...newProduct, stock: e.target.value }))} placeholder="150" />
                </div>
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Mức tồn tối thiểu *</label>
                <input type="number" min="0" className="ck-input ck-w-full" value={(editingProduct ? editingProduct : newProduct).min} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, min: e.target.value }) : setNewProduct({ ...newProduct, min: e.target.value }))} placeholder="50" />
              </div>
              <div>
                <label className="ck-block ck-text-sm ck-font-semibold ck-text-gray-300 ck-mb-2">Emoji (hiển thị)</label>
                <input type="text" className="ck-input ck-w-full" value={(editingProduct ? editingProduct.emoji : newProduct.emoji) || ''} onChange={(e) => (editingProduct ? setEditingProduct({ ...editingProduct, emoji: e.target.value }) : setNewProduct({ ...newProduct, emoji: e.target.value }))} placeholder="🥪" maxLength={2} />
              </div>
              <div className="ck-flex ck-gap-3 ck-pt-4">
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-semibold" style={{ border: 'none' }} onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}>Hủy</button>
                <button type="button" className="ck-btn ck-flex-1 ck-px-4 ck-py-3 ck-bg-gradient-btn-admin ck-text-white ck-rounded-xl ck-font-bold" style={{ border: 'none' }} onClick={handleSaveProduct}>{editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN APP ====================
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    StorageManager.init();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.role === 'franchise') {
    return <FranchiseStorePage onLogout={handleLogout} userData={currentUser} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminPage onLogout={handleLogout} userData={currentUser} />;
  }

  return (
    <div className="ck-root ck-min-h-screen ck-bg-black ck-flex ck-items-center ck-justify-center">
      <div className="ck-grain" />
      <div className="ck-text-center">
        <h1 className="ck-text-4xl ck-font-black ck-text-white ck-mb-4">Chức năng đang phát triển</h1>
        <p className="ck-text-gray-400 ck-mb-8">Vai trò này chưa được hoàn thiện</p>
        <button type="button" className="ck-btn ck-px-6 ck-py-3 ck-bg-red-500 ck-text-white ck-rounded-xl ck-font-bold" style={{ border: 'none' }} onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default App;
