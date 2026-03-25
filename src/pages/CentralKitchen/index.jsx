import React, { useState, useCallback, useEffect } from "react";
import {
  Eye,
  ChefHat,
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle,
} from "../../components/icons/Icons";
import "../../styles/store-manager.css";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";
import NotificationBell from "../../components/common/NotificationBell";

/** Tiêu đề topbar theo tab — cùng kiểu meta như trang Cửa hàng */
const KITCHEN_PAGE_META = {
  "Tổng Quan": {
    title: "Tổng quan",
    crumb: "Tổng quan",
    iconBg: "#eef5f1",
    iconStroke: "#4a7c5f",
  },
  Đơn: {
    title: "Phiếu yêu cầu nấu",
    crumb: "Mẻ nấu",
    iconBg: "#fdf3e0",
    iconStroke: "#d4860a",
  },
  "Sự Cố": {
    title: "Sự cố & khiếu nại",
    crumb: "Sự cố",
    iconBg: "#fef2f2",
    iconStroke: "#dc2626",
  },
};

const CentralKitchenPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);

  // 1. STATE CHUNG
  const [activeKitchenTab, setActiveKitchenTab] = useState("Tổng Quan");
  const [aggregationData, setAggregationData] = useState(null);
  const [showAggModal, setShowAggModal] = useState(false);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [, setIsRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [selectedRecipeRun, setSelectedRecipeRun] = useState(null);

  const [productionRuns, setProductionRuns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // STATE: TẠO MẺ CHỦ ĐỘNG
  const [showManualCookModal, setShowManualCookModal] = useState(false);
  const [manualCookData, setManualCookData] = useState({ productId: "", quantity: "", note: "" });

  // STATE: SỰ CỐ & KHIẾU NẠI (GIAI ĐOẠN 4)
  const [reportedShipments, setReportedShipments] = useState([]);

  // STATE: BÁO CÁO HAO HỤT
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [wastageData, setWastageData] = useState({ runId: "", runName: "", wasteQty: "", reason: "" });

  // HÀM: TẠO MẺ CHỦ ĐỘNG
  const handleManualCook = async () => {
    if (!manualCookData.productId || !manualCookData.quantity) {
      return alert("Vui lòng chọn món và số lượng!");
    }
    try {
      const payload = {
        productId: manualCookData.productId,
        quantity: Number(manualCookData.quantity),
        note: manualCookData.note || "",
        status: "PENDING" // Ép trạng thái ban đầu
      };
      await api.cook(payload);
      setShowManualCookModal(false);
      setManualCookData({ productId: "", quantity: "", note: "" });
      loadData();
      alert("✅ Đã tạo mẻ nấu chủ động thành công!");
    } catch (err) {
      console.error("Lỗi 400 chi tiết:", err);
      alert("Thao tác thất bại: " + (err.message || "Kiểm tra lại kết nối"));
    }
  };

  // HÀM: BÁO CÁO HAO HỤT
  const handleReportWastage = async () => {
    if (!wastageData.wasteQty) return alert("Vui lòng nhập số lượng hao hụt!");
    try {
      await api.reportWastage(wastageData);
      setShowWastageModal(false);
      setWastageData({ runId: "", runName: "", wasteQty: "", reason: "" });
      loadData();
      alert("✅ Đã ghi nhận báo cáo hao hụt!");
    } catch (err) {
      alert("Lỗi báo cáo hao hụt!");
    }
  };

  // HÀM: DUYỆT ĐỀN BÙ VÀ TẠO ĐƠN BÙ (COMP-xxx)
  const handleResolveReplacement = async (shipId) => {
    if (window.confirm(`Xác nhận duyệt đền bù cho chuyến xe ${shipId} và tự động lên mẻ nấu bù?`)) {
      try {
        await api.resolveReplacement(shipId);
        alert("✅ Đã tạo đơn bù (COMP-xxx) thành công. Hãy qua Tab 'Đơn' để tiến hành nấu!");
        loadData(); // Tải lại toàn bộ dữ liệu để cập nhật mẻ nấu mới và xóa sự cố khỏi danh sách
      } catch (err) {
        alert("❌ Lỗi duyệt đền bù: " + (err.message || "Vui lòng thử lại"));
      }
    }
  };

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [runsData, catsData, prodsData, ingsData, reportedData] =
        await Promise.all([
          api.getProductionRuns().catch(() => []),
          api.getCategories().catch(() => []),
          api.getProducts().catch(() => []),
          api.getIngredients().catch(() => []),
          api.getReportedShipments().catch(() => [])
        ]);

      // --- MAP DỮ LIỆU MẺ NẤU TỪ BACKEND SANG FRONTEND ---
      const rawRuns = Array.isArray(runsData) ? runsData : (runsData?.data || []);
      const mappedRuns = rawRuns.map((run, idx) => {
        const rawBom = run.bom || run.ingredients || run.formula || [];

        // BƯỚC QUAN TRỌNG: CHUẨN HÓA TRẠNG THÁI (ÉP KIỂU)
        let currentStatus = String(run.status || "PENDING").toUpperCase();
        if (["PLANNED", "NEW", "CREATED", "WAITING", "TODO"].includes(currentStatus)) {
            currentStatus = "PENDING";
        }
        else if (["IN_PROGRESS", "PROCESSING", "DOING", "COOKING"].includes(currentStatus)) {
            currentStatus = "COOKING";
        }
        else if (["DONE", "FINISHED", "SUCCESS", "COMPLETED"].includes(currentStatus)) {
            currentStatus = "COMPLETED";
        }

        return {
          id: run.runId || run.id || `RUN_TEMP_${idx}`,
          productId: run.productId || run.product_id || "",
          name: run.productName || run.name || "Đang tải tên món...",
          status: currentStatus,
          totalQty: Number(run.plannedQty || run.totalQty || 0),
          cookedQty: Number(run.cookedQty || 0),
          details: run.details || [],
          bom: rawBom.length > 0 ? rawBom.map(ing => ({
            name: ing.ingredientName || ing.name || "Nguyên liệu",
            qtyPerItem: Number(ing.amountNeeded || ing.qtyPerItem || ing.amount || 0),
            unit: ing.unit || "KG"
          })) : null
        };
      });
      setProductionRuns(mappedRuns);

      setCategories(Array.isArray(catsData) ? catsData : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      // SET STATE CHO DANH SÁCH SỰ CỐ
      setReportedShipments(Array.isArray(reportedData) ? reportedData : []);

      // Map dữ liệu thực tế từ Database cho Nguyên liệu
      const mappedIngredients = (Array.isArray(ingsData) ? ingsData : []).map(
        (ing) => {
          const currentStock = parseFloat(ing.kitchenStock ?? ing.kitchen_stock ?? 0);
          const minThreshold = parseFloat(ing.minThreshold ?? ing.min_threshold ?? 0);
          let currentStatus = "Đủ hàng";
          if (currentStock <= 0) {
            currentStatus = "Hết hàng";
          } else if (currentStock <= minThreshold) {
            currentStatus = "Cần nhập gấp";
          }
          return {
            id: ing.ingredientId || ing.ingredient_id || ing.id,
            name: ing.name || ing.ingredientName || "Chưa có tên",
            stock: currentStock,
            minThreshold: minThreshold,
            unit: ing.unit || "KG",
            unitCost: parseFloat(ing.unitCost ?? ing.unit_cost ?? 0),
            status: currentStatus,
          };
        }
      );
      setIngredients(mappedIngredients);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const stats = {
    totalRequested: productionRuns.reduce((sum, run) => sum + (run.totalQty || 0), 0),
    cooking: productionRuns.filter((r) => r.status === "COOKING").length,
    completed: productionRuns.filter((r) => r.status === "COMPLETED").length,
  };

  const meta =
    KITCHEN_PAGE_META[activeKitchenTab] || KITCHEN_PAGE_META["Tổng Quan"];

  const handleUpdateRunStatus = async (id, newStatus) => {
    try {
      await api.updateProductionRunStatus(id, newStatus);
      await loadData();
    } catch (err) {
      setErrorModal({ show: true, message: err.message || "Lỗi hệ thống khi cập nhật trạng thái!" });
    }
  };

  const handleBulkComplete = async () => {
    const activeRuns = productionRuns.filter(r => r.status === "COOKING").map(r => r.id);
    if (activeRuns.length === 0) return alert("Không có mẻ nào đang nấu để chốt!");

    if (window.confirm(`Bạn có chắc chắn muốn chốt hoàn thành ${activeRuns.length} mẻ nấu này không?`)) {
      try {
        await api.updateBulkProductionStatus(activeRuns, "COMPLETED");
        alert(`✅ Đã hoàn thành ${activeRuns.length} mẻ nấu và trừ kho!`);
        loadData();
      } catch (err) {
        alert("Lỗi chốt mẻ hàng loạt!");
      }
    }
  };

  const handleOpenAggregation = async () => {
    try {
      const data = await api.getKitchenAggregation();
      setAggregationData(data);
      setShowAggModal(true);
    } catch (error) {
      setErrorModal({ show: true, message: "Lỗi tải dữ liệu gom đơn hoặc không có đơn mới!" });
    }
  };

  const handleConfirmAggregation = async () => {
    try {
      await api.confirmAggregation({});
      setShowAggModal(false);
      loadData();
      alert("✅ Đã chốt gom đơn, xuất kho và chuyển trạng thái sẵn sàng giao thành công!");
    } catch (err) {
      alert("❌ Lỗi chốt gom đơn, vui lòng thử lại sau!");
      setShowAggModal(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setKitchenSubTab(tab);
  };

  const handleViewRecipe = async (run) => {
    setSelectedRecipeRun(run);

    if (!run.bom || run.bom.length === 0) {
      let pId = run.productId || run.product_id;

      if (!pId) {
        const matchedProduct = products.find(p => p.name === run.name || p.productName === run.name);
        if (matchedProduct) {
            pId = matchedProduct.id || matchedProduct.productId;
        }
      }

      if (!pId) {
        alert("⚠️ Hệ thống không thể xác định mã món ăn của mẻ nấu này (Dò tên cũng không ra)!");
        setSelectedRecipeRun(null);
        return;
      }

      try {
        const recipeData = await api.getRecipeOfProduct(pId);
        const rawBom = recipeData.ingredients || recipeData.items || recipeData.formulaItems || recipeData.bom || [];

        const mappedBom = rawBom.map(ing => ({
          name: ing.ingredientName || ing.name || "Nguyên liệu",
          qtyPerItem: Number(ing.amountNeeded || ing.qtyPerItem || ing.amount || ing.quantity || 0),
          unit: ing.unit || "KG"
        }));

        setSelectedRecipeRun(prev => prev ? { ...prev, bom: mappedBom } : prev);

      } catch (err) {
        console.error("Lỗi tải công thức mẻ nấu:", err);

        if (err.message.includes("quyền") || err.message.includes("403") || err.message.includes("Forbidden")) {
          console.warn("Backend đang cấm Bếp lấy công thức. Đổ dữ liệu giả lập để test UI...");
          const mockBom = [
            { name: "Thịt / Gà (Nguyên liệu chính)", qtyPerItem: 0.25, unit: "KG" },
            { name: "Bột chiên / Gia vị", qtyPerItem: 0.05, unit: "KG" },
            { name: "Bao bì / Hộp giấy", qtyPerItem: 1, unit: "CÁI" }
          ];
          setSelectedRecipeRun(prev => prev ? { ...prev, bom: mockBom } : prev);
        } else {
          alert("❌ Không thể tải công thức: " + err.message);
          setSelectedRecipeRun(null);
        }
      }
    }
  };

  return (
    <div className="sm-page">
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <UpdateProfileModal
        open={showUpdateProfileModal}
        onClose={() => setShowUpdateProfileModal(false)}
        initialFullName={userData?.name ?? ""}
        initialEmail={userData?.email ?? ""}
        onSuccess={() => {
          onProfileUpdated?.();
          setShowUpdateProfileModal(false);
        }}
      />

      <div className="layout">
        <aside className="sb">
          <div className="sb-header">
            <div className="sb-logo">
              <div className="sb-logo-icon">🍳</div>
              <span className="sb-logo-text">Bếp trung tâm</span>
            </div>
            <div className="sb-store-card">
              <div className="sb-store-name">Điều phối &amp; sản xuất</div>
              <div className="sb-store-role">
                {userData?.name ?? userData?.fullName ?? "—"}
              </div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="nav-group-label">Vận hành bếp</div>
            <button
              type="button"
              className={`ni ${activeKitchenTab === "Tổng Quan" ? "on" : ""}`}
              onClick={() => setActiveKitchenTab("Tổng Quan")}
            >
              <LayoutDashboard size={15} />
              Tổng quan
            </button>
            <button
              type="button"
              className={`ni ${activeKitchenTab === "Đơn" ? "on" : ""}`}
              onClick={() => setActiveKitchenTab("Đơn")}
            >
              <ChefHat size={15} />
              Đơn &amp; mẻ nấu
              {productionRuns.length > 0 && (
                <span className="ni-badge">{productionRuns.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`ni ${activeKitchenTab === "Sự Cố" ? "on" : ""}`}
              onClick={() => setActiveKitchenTab("Sự Cố")}
            >
              <AlertTriangle size={15} />
              Sự cố
              {reportedShipments.length > 0 && (
                <span className="ni-badge">{reportedShipments.length}</span>
              )}
            </button>
          </nav>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="tb-page">
              <div
                className="tb-page-icon"
                style={{ background: meta.iconBg }}
              >
                {activeKitchenTab === "Tổng Quan" && (
                  <LayoutDashboard
                    size={16}
                    style={{ color: meta.iconStroke }}
                  />
                )}
                {activeKitchenTab === "Đơn" && (
                  <ChefHat size={16} style={{ color: meta.iconStroke }} />
                )}
                {activeKitchenTab === "Sự Cố" && (
                  <AlertTriangle
                    size={16}
                    style={{ color: meta.iconStroke }}
                  />
                )}
              </div>
              <div className="tb-title">{meta.title}</div>
            </div>
            <div className="tb-actions">
              <NotificationBell variant="light" />
              <HeaderSettingsMenu
                userData={userData}
                showProfile={true}
                onOpenProfile={() => setShowUpdateProfileModal(true)}
                onChangePassword={() => setShowChangePasswordModal(true)}
                onLogout={onLogout}
              />
            </div>
          </div>

          <div className="content">
            <div className="stats">
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--slate)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Tổng suất yêu cầu</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--slate-bg)" }}
                  >
                    <TrendingUp size={14} style={{ color: "var(--slate)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--slate)" }}>
                  {stats.totalRequested}
                </div>
              </div>
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--amber)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Mẻ đang nấu</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--amber-bg)" }}
                  >
                    <Activity size={14} style={{ color: "var(--amber)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--amber)" }}>
                  {stats.cooking}
                </div>
              </div>
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "var(--sage)" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Mẻ hoàn thành</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "var(--sage-bg)" }}
                  >
                    <CheckCircle size={14} style={{ color: "var(--sage)" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "var(--sage)" }}>
                  {stats.completed}
                </div>
              </div>
              <div className="sc">
                <div
                  className="sc-stripe"
                  style={{ background: "#8b5cf6" }}
                />
                <div className="sc-top">
                  <div>
                    <div className="sc-label">Sự cố mở</div>
                  </div>
                  <div
                    className="sc-icon"
                    style={{ background: "#f5f3ff" }}
                  >
                    <AlertTriangle size={14} style={{ color: "#8b5cf6" }} />
                  </div>
                </div>
                <div className="sc-val" style={{ color: "#8b5cf6" }}>
                  {reportedShipments.length}
                </div>
              </div>
            </div>

            <div
              className={`kitchen-inner page ${activeKitchenTab === "Tổng Quan" ? "on" : ""}`}
              id="page-kitchen-overview"
            >
          {activeKitchenTab === "Tổng Quan" && (
            <div className="kitchen-tab-body">
              <h2 className="kitchen-page-h2">Cài đặt &amp; quản lý kho</h2>
              <div className="kitchen-subtabs" role="tablist">
                <button
                  type="button"
                  onClick={() => handleTabChange("categories")}
                  className={`kitchen-subtab ${kitchenSubTab === "categories" ? "on" : ""}`}
                >
                  Danh mục sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("products")}
                  className={`kitchen-subtab ${kitchenSubTab === "products" ? "on" : ""}`}
                >
                  Sản phẩm bếp TT
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("ingredients")}
                  className={`kitchen-subtab ${kitchenSubTab === "ingredients" ? "on" : ""}`}
                >
                  Nguyên liệu &amp; Tồn kho
                </button>
              </div>

              <div className="kitchen-crud-layout">
                <div className="card kitchen-table-card">

                    {/* BẢNG DANH MỤC */}
                    {kitchenSubTab === "categories" && (
                      <>
                        <div className="card-hd">
                          <div className="card-title">Danh mục sản phẩm</div>
                        </div>
                        <div className="tbl-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>STT</th>
                                <th>Tên danh mục</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categories.map((cat, idx) => (
                                <tr key={cat.id}>
                                  <td style={{ color: "var(--ink3)" }}>{idx + 1}</td>
                                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* BẢNG SẢN PHẨM */}
                    {kitchenSubTab === "products" && (
                      <>
                        <div className="card-hd">
                          <div className="card-title">Sản phẩm bếp trung tâm</div>
                        </div>
                        <div className="tbl-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Mã</th>
                                <th>Sản phẩm</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((p) => (
                                <tr key={p.id}>
                                  <td className="mono" style={{ color: "var(--ink3)" }}>{p.id}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    {p.name}{" "}
                                    <span style={{ display: "block", fontSize: 11, color: "var(--ink4)", fontWeight: 500 }}>{p.category}</span>
                                  </td>
                                  <td style={{ fontWeight: 700, color: "var(--slate)" }}>{Number(p.price).toLocaleString()}₫</td>
                                  <td>
                                    <span
                                      className="tag"
                                      style={
                                        p.isActive
                                          ? { background: "var(--sage-bg)", color: "var(--sage)" }
                                          : { background: "var(--rust-bg)", color: "var(--rust)" }
                                      }
                                    >
                                      {p.isActive ? "Còn hàng" : "Hết hàng"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* BẢNG NGUYÊN LIỆU (ĐÃ BỎ NÚT NHẬP KHO) */}
                    {kitchenSubTab === "ingredients" && (
                      <>
                        <div className="card-hd">
                          <div className="card-title">Danh sách nguyên liệu</div>
                        </div>
                        <div className="tbl-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Tên NL</th>
                                <th>Giá nhập</th>
                                <th>Định mức min</th>
                                <th>Tồn kho thực tế</th>
                                <th>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ingredients.map((ing) => (
                                <tr key={ing.id}>
                                  <td style={{ fontWeight: 600 }}>{ing.name}</td>
                                  <td style={{ fontWeight: 700, color: "var(--slate)" }}>{ing.unitCost.toLocaleString()}₫</td>
                                  <td style={{ color: "var(--ink3)" }}>
                                    {ing.minThreshold} <span className="lowercase">{ing.unit}</span>
                                  </td>
                                  <td style={{ fontWeight: 700 }}>
                                    {ing.stock} <span className="lowercase">{ing.unit}</span>
                                  </td>
                                  <td>
                                    <span
                                      className="tag"
                                      style={
                                        ing.status === "Đủ hàng"
                                          ? { background: "var(--sage-bg)", color: "var(--sage)" }
                                          : ing.status === "Cần nhập gấp"
                                          ? { background: "var(--amber-bg)", color: "var(--amber)" }
                                          : { background: "var(--rust-bg)", color: "var(--rust)" }
                                      }
                                    >
                                      {ing.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
          )}
            </div>

            <div
              className={`kitchen-inner page ${activeKitchenTab === "Đơn" ? "on" : ""}`}
              id="page-kitchen-runs"
            >
          {/* ======================= TAB ĐƠN - XEM CÔNG THỨC & NẤU ======================= */}
          {activeKitchenTab === "Đơn" && (
            <div className="kitchen-tab-body">
              <div className="toolbar" style={{ justifyContent: "space-between", width: "100%", marginBottom: 0, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className="kitchen-inline-h2">Phiếu yêu cầu nấu</span>
                  <span className="tag tag-s">Cập nhật: {lastUpdated.toLocaleTimeString()}</span>
                </div>
                <div className="toolbar" style={{ marginBottom: 0 }}>
                  <button type="button" onClick={handleOpenAggregation} className="btn btn-amber btn-sm">
                    📦 Gom đơn
                  </button>
                  <button type="button" onClick={handleBulkComplete} className="btn btn-sage btn-sm">
                    ✅ Chốt tất cả mẻ đang nấu
                  </button>
                </div>
              </div>

              {productionRuns.length === 0 ? (
                <div className="card">
                  <div className="empty">
                    <ChefHat size={40} style={{ opacity: 0.25, margin: "0 auto 12px", display: "block" }} />
                    <p>Không có đơn cần nấu.</p>
                  </div>
                </div>
              ) : (
                <div className="kitchen-runs-grid">
                  {productionRuns.map((run) => {
                    const progressPercent = Math.round((run.cookedQty / run.totalQty) * 100) || 0;
                    const statusStyle =
                      run.status === "PENDING"
                        ? { background: "var(--slate-bg)", color: "var(--slate)", border: "1px solid var(--border)" }
                        : run.status === "COOKING"
                        ? { background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" }
                        : { background: "var(--sage-bg)", color: "var(--sage)", border: "1px solid var(--sage)" };
                    return (
                      <div key={run.id} className="kitchen-run-card">
                        <div>
                          <div className="kitchen-run-head">
                            <div className="kitchen-run-title-row">
                              <h3>{run.name}</h3>
                              <button type="button" onClick={() => handleViewRecipe(run)} className="btn btn-ghost btn-xs" title="Xem công thức">
                                <Eye size={16} />
                              </button>
                              {run.status === "COOKING" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWastageData({ runId: run.id, runName: run.name, wasteQty: "", reason: "" });
                                    setShowWastageModal(true);
                                  }}
                                  className="btn btn-ghost btn-xs"
                                  style={{ color: "var(--rust)" }}
                                  title="Báo cáo hao hụt (Hỏng/Cháy)"
                                >
                                  ⚠️
                                </button>
                              )}
                            </div>
                            <span className="kitchen-status-pill" style={statusStyle}>
                              {run.status === "PENDING" ? "Chờ nấu" : run.status === "COOKING" ? "Đang nấu" : "Xong"}
                            </span>
                          </div>

                          <div className="kitchen-run-qty">
                            {run.totalQty}
                            <span>phần ăn</span>
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              <span>Tiến độ nấu</span>
                              <span style={{ fontWeight: 700, color: "var(--ink)" }}>{run.cookedQty}/{run.totalQty}</span>
                            </div>
                            <div className="kitchen-run-progress-track">
                              <div
                                className="kitchen-run-progress-fill"
                                style={{
                                  width: `${progressPercent}%`,
                                  background: progressPercent === 100 ? "var(--sage)" : "var(--amber)",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          {run.status === "PENDING" && (
                            <button type="button" onClick={() => handleUpdateRunStatus(run.id, "COOKING")} className="btn btn-ghost" style={{ width: "100%" }}>
                              🔥 Bắt đầu nấu
                            </button>
                          )}
                          {run.status === "COOKING" && (
                            <button type="button" onClick={() => handleUpdateRunStatus(run.id, "COMPLETED")} className="btn btn-amber" style={{ width: "100%" }}>
                              ✅ Hoàn thành mẻ
                            </button>
                          )}
                          {run.status === "COMPLETED" && (
                            <button type="button" disabled className="btn btn-ghost" style={{ width: "100%", opacity: 0.55 }}>
                              Đã xong
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </div>

            <div
              className={`kitchen-inner page ${activeKitchenTab === "Sự Cố" ? "on" : ""}`}
              id="page-kitchen-incidents"
            >
          {/* ======================= TAB SỰ CỐ - XỬ LÝ KHIẾU NẠI ======================= */}
          {activeKitchenTab === "Sự Cố" && (
            <div className="kitchen-tab-body">
              <div className="toolbar" style={{ justifyContent: "space-between", width: "100%", marginBottom: 0, flexWrap: "wrap" }}>
                <div>
                  <h2 className="kitchen-page-h2">Xử lý sự cố &amp; khiếu nại</h2>
                  <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 4, maxWidth: 520 }}>
                    Duyệt thiếu hàng từ cửa hàng báo về để lên đơn bù (COMP)
                  </p>
                </div>
              </div>

              {reportedShipments.length === 0 ? (
                <div className="card">
                  <div className="empty" style={{ padding: "40px 24px" }}>
                    <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🎉</span>
                    <p style={{ color: "var(--sage)", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Mọi thứ đang hoàn hảo!</p>
                    <p style={{ fontSize: 13, color: "var(--ink4)" }}>Không có cửa hàng nào báo thiếu hàng hay sự cố giao nhận.</p>
                  </div>
                </div>
              ) : (
                <div className="kitchen-runs-grid">
                  {reportedShipments.map((issue, idx) => (
                    <div key={issue.shipmentId || idx} className="kitchen-issue-card">
                      <div className="kitchen-run-head">
                        <div>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{issue.storeName}</h3>
                          <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 4 }}>
                            Mã chuyến:{" "}
                            <span className="mono" style={{ color: "var(--slate)", fontWeight: 700 }}>{issue.shipmentId}</span>
                          </p>
                        </div>
                        <span className="tag" style={{ background: "var(--rust-bg)", color: "var(--rust)" }}>
                          {issue.status === "ISSUE_REPORTED" ? "⚠️ Thiếu hàng" : issue.status}
                        </span>
                      </div>

                      <div className="kitchen-issue-list">
                        <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Chi tiết hàng thiếu</p>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                          {(issue.missingItems || []).map((item, i) => (
                            <li
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                fontSize: 13,
                                padding: "10px 0",
                                borderBottom: i < (issue.missingItems || []).length - 1 ? "1px solid var(--border)" : "none",
                              }}
                            >
                              <span style={{ color: "var(--ink2)" }}>
                                {item.productName}
                                {item.issueNote && (
                                  <span style={{ display: "block", fontSize: 11, color: "var(--rust)", fontStyle: "italic", marginTop: 4 }}>
                                    💬 &ldquo;{item.issueNote}&rdquo;
                                  </span>
                                )}
                              </span>
                              <span className="tag" style={{ background: "var(--rust-bg)", color: "var(--rust)", flexShrink: 0 }}>
                                -{item.missingQuantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button type="button" onClick={() => handleResolveReplacement(issue.shipmentId)} className="btn btn-rust" style={{ width: "100%" }}>
                        🚀 Duyệt đền bù &amp; lên mẻ nấu
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </main>
      </div>

      {/* ====================================================================== */}
      {/* CÁC MODALS TRỢ NĂNG XUẤT HIỆN KHI CẦN                                  */}
      {/* ====================================================================== */}

      {/* 2. MODAL XÁC NHẬN GOM ĐƠN NẤU — layout sáng giống Store */}
      {showAggModal && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="agg-modal-title">
          <div className="sm-modal-box">
            <div className="sm-modal-hd">
              <h2 id="agg-modal-title" className="sm-modal-title">Gom đơn chi nhánh</h2>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowAggModal(false)} aria-label="Đóng">✕</button>
            </div>
            <div className="sm-modal-bd">
              <p style={{ margin: 0 }}>
                Hệ thống đã quét các đơn hàng mới. Bạn có muốn chốt tổng hợp thành mẻ nấu không?
              </p>
              {aggregationData && (
                <div className="sm-agg-stat">
                  Có{" "}
                  <strong>
                    {Array.isArray(aggregationData) ? aggregationData.length : Object.keys(aggregationData).length}
                  </strong>{" "}
                  loại sản phẩm cần nấu.
                </div>
              )}
            </div>
            <div className="sm-modal-ft">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAggModal(false)}>Hủy</button>
              <button type="button" className="btn btn-amber" onClick={handleConfirmAggregation}>
                Chốt gom đơn &amp; xuất kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL CÔNG THỨC / BOM — layout sáng */}
      {selectedRecipeRun && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="bom-modal-title">
          <div className="sm-modal-box sm-modal-lg">
            <div className="sm-modal-hd">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className="card-icon"
                  style={{ background: "var(--amber-bg)", color: "var(--amber)" }}
                >
                  <ChefHat size={18} />
                </div>
                <div>
                  <h3 id="bom-modal-title" className="sm-modal-title">Định mức sản xuất (BOM)</h3>
                  <p className="sm-modal-sub">{selectedRecipeRun.name}</p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSelectedRecipeRun(null)} aria-label="Đóng">✕</button>
            </div>
            <div className="sm-modal-bd">
              <div className="sm-highlight-box">
                <div className="sm-hl-label">Tổng sản lượng cần nấu</div>
                <div className="sm-hl-val">
                  {selectedRecipeRun.totalQty}{" "}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink3)" }}>phần ăn</span>
                </div>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink3)", margin: "0 0 10px" }}>
                Nguyên liệu cần xuất kho
              </p>
              {selectedRecipeRun.bom ? (
                selectedRecipeRun.bom.map((ing, i) => {
                  const totalNeeded = (ing.qtyPerItem * selectedRecipeRun.totalQty).toFixed(2);
                  return (
                    <div key={i} className="sm-bom-row">
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{ing.name}</span>
                      <div style={{ textAlign: "right" }}>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: "var(--slate)" }}>{totalNeeded}</span>
                        <span style={{ fontSize: 10, color: "var(--ink4)", marginLeft: 4, textTransform: "uppercase" }}>{ing.unit}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic", margin: 0 }}>Dữ liệu công thức đang được cập nhật...</p>
              )}
            </div>
            <div className="sm-modal-ft">
              <button type="button" className="btn btn-sage" style={{ flex: 1 }} onClick={() => setSelectedRecipeRun(null)}>
                Xác nhận &amp; đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL BÁO LỖI */}
      {errorModal.show && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="err-modal-title">
          <div className="sm-modal-box">
            <div className="sm-modal-hd">
              <h2 id="err-modal-title" className="sm-modal-title" style={{ color: "var(--rust)" }}>Thao tác thất bại</h2>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setErrorModal({ show: false, message: "" })} aria-label="Đóng">✕</button>
            </div>
            <div className="sm-modal-bd" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
              <p style={{ margin: 0, color: "var(--ink2)" }}>{errorModal.message}</p>
            </div>
            <div className="sm-modal-ft">
              <button type="button" className="btn btn-amber" style={{ flex: 1 }} onClick={() => setErrorModal({ show: false, message: "" })}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL TẠO MẺ NẤU CHỦ ĐỘNG */}
      {showManualCookModal && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="manual-cook-title">
          <div className="sm-modal-box">
            <div className="sm-modal-hd">
              <h2 id="manual-cook-title" className="sm-modal-title">Tạo mẻ nấu chủ động</h2>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowManualCookModal(false)} aria-label="Đóng">✕</button>
            </div>
            <div className="sm-modal-bd">
              <div className="fg">
                <label htmlFor="manual-cook-product">Chọn món ăn *</label>
                <select id="manual-cook-product" value={manualCookData.productId} onChange={(e) => setManualCookData({ ...manualCookData, productId: e.target.value })}>
                  <option value="">— Chọn sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label htmlFor="manual-cook-qty">Số lượng (phần) *</label>
                <input id="manual-cook-qty" type="number" value={manualCookData.quantity} onChange={(e) => setManualCookData({ ...manualCookData, quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="fg">
                <label htmlFor="manual-cook-note">Ghi chú (nếu có)</label>
                <input id="manual-cook-note" type="text" value={manualCookData.note} onChange={(e) => setManualCookData({ ...manualCookData, note: e.target.value })} placeholder="Ví dụ: Nấu dự phòng trưa…" />
              </div>
            </div>
            <div className="sm-modal-ft">
              <button type="button" className="btn btn-ghost" onClick={() => setShowManualCookModal(false)}>Hủy</button>
              <button type="button" className="btn btn-amber" onClick={handleManualCook}>🚀 Bắt đầu nấu</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL BÁO CÁO HAO HỤT */}
      {showWastageModal && (
        <div className="sm-dim" role="dialog" aria-modal="true" aria-labelledby="wastage-modal-title">
          <div className="sm-modal-box">
            <div className="sm-modal-hd">
              <h2 id="wastage-modal-title" className="sm-modal-title" style={{ color: "var(--rust)" }}>Báo cáo hao hụt</h2>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowWastageModal(false)} aria-label="Đóng">✕</button>
            </div>
            <div className="sm-modal-bd">
              <div className="ibox danger" style={{ marginTop: 0 }}>
                <span aria-hidden>⚠️</span>
                <span>
                  Mẻ nấu: <strong>{wastageData.runName}</strong>
                </span>
              </div>
              <div className="fg">
                <label htmlFor="wastage-qty">Số lượng hỏng/cháy (phần) *</label>
                <input id="wastage-qty" type="number" value={wastageData.wasteQty} onChange={(e) => setWastageData({ ...wastageData, wasteQty: e.target.value })} placeholder="0" />
              </div>
              <div className="fg">
                <label htmlFor="wastage-reason">Lý do</label>
                <select id="wastage-reason" value={wastageData.reason} onChange={(e) => setWastageData({ ...wastageData, reason: e.target.value })}>
                  <option value="">— Chọn lý do —</option>
                  <option value="Cháy khét">Cháy khét</option>
                  <option value="Rơi vãi">Rơi vãi</option>
                  <option value="Nguyên liệu hỏng">Nguyên liệu hỏng</option>
                  <option value="Khác">Lý do khác…</option>
                </select>
              </div>
            </div>
            <div className="sm-modal-ft">
              <button type="button" className="btn btn-ghost" onClick={() => setShowWastageModal(false)}>Hủy</button>
              <button type="button" className="btn btn-amber" onClick={handleReportWastage}>Ghi nhận hao hụt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralKitchenPage;
