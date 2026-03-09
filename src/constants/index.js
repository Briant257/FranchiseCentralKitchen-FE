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
/** Vai trò hệ thống — trùng tên enum SystemRole bên BE */
export const SYSTEM_ROLES = [
  { value: "ADMIN", label: "Quản trị hệ thống" },
  { value: "MANAGER", label: "Quản lý vận hành" },
  { value: "COORDINATOR", label: "Điều phối cung ứng" },
  { value: "KITCHEN_MANAGER", label: "Nhân viên quản lý bếp trung tâm" },
  { value: "STORE_MANAGER", label: "Nhân viên quản lý cửa hàng (Franchise)" },
];

/** Nhãn hiển thị theo enum (ADMIN, MANAGER, COORDINATOR, KITCHEN_MANAGER, STORE_MANAGER) */
export const ROLE_LABELS = Object.fromEntries(
  SYSTEM_ROLES.map((r) => [r.value, r.label]),
);
