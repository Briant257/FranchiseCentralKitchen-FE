import {
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  Plus,
  FileText,
  Package,
  BarChart3,
  Store,
  Users,
} from "../components/icons/Icons";

/** Cấu hình hiển thị trạng thái đơn hàng */
export const ORDER_STATUS = {
  pending: { bg: "ck-badge-yellow", label: "Chờ xử lý", icon: Clock },
  processing: { bg: "ck-badge-blue", label: "Đang xử lý", icon: Activity },
  completed: { bg: "ck-badge-green", label: "Hoàn thành", icon: CheckCircle },
  cancelled: { bg: "ck-badge-red", label: "Đã hủy", icon: XCircle },
};

/** Menu sidebar trang cửa hàng franchise */
export const FRANCHISE_MENU = [
  { id: "dashboard", name: "Tổng quan", icon: LayoutDashboard },
  { id: "create-order", name: "Tạo đơn hàng", icon: Plus },
  { id: "orders", name: "Đơn hàng của tôi", icon: FileText },
  { id: "inventory", name: "Tồn kho", icon: Package },
  { id: "reports", name: "Báo cáo", icon: BarChart3 },
];

/** Tab trang Admin — theo cấu trúc API */
export const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "accounts", label: "Tài khoản", icon: Users },
  { id: "stores", label: "Cửa hàng", icon: Store },
  { id: "kitchen", label: "Danh mục & Sản phẩm", icon: Package },
  { id: "inventory", label: "Nhập kho", icon: FileText },
];
/** Nhãn vai trò người dùng (khớp API: ADMIN, STORE_MANAGER, KITCHEN_STAFF, KITCHEN_MANAGER, ...) */
export const ROLE_LABELS = {
  admin: "Quản trị viên",
  franchise: "Nhân viên cửa hàng",
  store_manager: "Quản lý cửa hàng",
  kitchen: "Nhân viên bếp",
  kitchen_manager: "Quản lý bếp",
  coordinator: "Điều phối viên",
  manager: "Quản lý",
};
