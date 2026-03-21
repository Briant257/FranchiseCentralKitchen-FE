import React, { useState, useCallback, useEffect } from "react";
import { Eye, ChefHat } from "../../components/icons/Icons";
import api from "../../services/api";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import UpdateProfileModal from "../../components/common/UpdateProfileModal";
import HeaderSettingsMenu from "../../components/common/HeaderSettingsMenu";

const CentralKitchenPage = ({ onLogout, userData, onProfileUpdated }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);

  // 1. STATE CHUNG
  const [activeKitchenTab, setActiveKitchenTab] = useState("Tổng Quan");
  const [aggregationData, setAggregationData] = useState(null);
  const [showAggModal, setShowAggModal] = useState(false);
  const [kitchenSubTab, setKitchenSubTab] = useState("categories");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [selectedRecipeRun, setSelectedRecipeRun] = useState(null);

  const [productionRuns, setProductionRuns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // STATE: TẠO MẺ CHỦ ĐỘNG
  const [showManualCookModal, setShowManualCookModal] = useState(false);
  const [manualCookData, setManualCookData] = useState({ productId: "", quantity: "", note: "" });

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

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [runsData, catsData, prodsData, ingsData] =
        await Promise.all([
          api.getProductionRuns().catch(() => []),
          api.getCategories().catch(() => []),
          api.getProducts().catch(() => []),
          api.getIngredients().catch(() => [])
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

  // ==========================================
  // FORMS CRUD (CATEGORY, PRODUCT & INGREDIENT)
  // ==========================================
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    id: "", name: "", category: "", price: "", stock: "", min: "", emoji: "🥪", baseUnit: "PHAN"
  });

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [newIngredient, setNewIngredient] = useState({
    id: "", name: "", unit: "KG", unitCost: "", minThreshold: ""
  });

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return alert("Vui lòng nhập tên danh mục!");
    try {
      if (editingCategory) await api.updateCategory(editingCategory.id, { name: newCategoryName });
      else await api.createCategory({ name: newCategoryName });
      setShowAddCategory(false);
      setNewCategoryName("");
      loadData();
    } catch (err) {
      alert("Lỗi lưu danh mục!");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (window.confirm("Xóa danh mục này?")) {
      try {
        await api.deleteCategory(catId);
        loadData();
      } catch (e) {
        alert("Lỗi xóa danh mục!");
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert("Vui lòng điền Tên và Giá!");
    try {
      const selectedCategory = categories.find((c) => c.name === newProduct.category);
      const catId = selectedCategory ? selectedCategory.id : 1;
      const apiPayload = {
        productId: newProduct.id || `PRD_${Date.now().toString().slice(-6)}`,
        productName: newProduct.name,
        categoryId: catId,
        sellingPrice: Number(newProduct.price),
        baseUnit: newProduct.baseUnit || "PHAN", 
        isActive: true,
        emoji: newProduct.emoji,
        ingredients: [],
      };

      if (editingProduct) {
        const editId = editingProduct.productId || editingProduct.id;
        await api.updateProduct(editId, apiPayload);
        alert("✅ Sửa sản phẩm thành công!");
      } else {
        await api.createProduct(apiPayload);
        alert("✅ Thêm sản phẩm thành công!");
      }
      setShowAddProduct(false);
      loadData();
    } catch (err) {
      alert("Lỗi lưu sản phẩm!");
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (window.confirm("Xóa sản phẩm này (Xóa mềm)?")) {
      try {
        if(api.updateProductStatus) {
            await api.updateProductStatus(prodId, false);
        } else {
            await api.deleteProduct(prodId);
        }
        loadData();
      } catch (e) {
        alert("Lỗi xóa sản phẩm!");
      }
    }
  };

  const handleSaveIngredient = async () => {
    if (!newIngredient.name || !newIngredient.unit) return alert("Vui lòng điền Tên và Đơn vị!");
    try {
      const payload = {
        name: newIngredient.name,
        unit: newIngredient.unit,
        unitCost: Number(newIngredient.unitCost) || 0,
        minThreshold: Number(newIngredient.minThreshold) || 0,
      };

      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, payload);
        alert("✅ Sửa nguyên liệu thành công!");
      } else {
        await api.createIngredient(payload);
        alert("✅ Thêm nguyên liệu mới thành công!");
      }
      setShowAddIngredient(false);
      loadData();
    } catch (err) {
      alert("Lỗi lưu nguyên liệu!");
    }
  };

  const handleDeleteIngredient = async (ingId) => {
    if (window.confirm("Xóa nguyên liệu này khỏi hệ thống?")) {
      try {
        await api.deleteIngredient(ingId);
        loadData();
      } catch (e) {
        alert("Lỗi xóa nguyên liệu!");
      }
    }
  };

  const handleTabChange = (tab) => {
    setKitchenSubTab(tab);
    setShowAddCategory(false);
    setShowAddProduct(false);
    setShowAddIngredient(false);
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
    <div className="ck-root ck-min-h-screen ck-bg-black ck-text-white ck-p-6">
      <div className="ck-grain" />

      {/* HEADER */}
      <header className="ck-flex ck-justify-between ck-items-center ck-mb-8 ck-relative ck-pb-4 ck-border-b ck-border-gray-800" style={{ zIndex: 50 }}>
        <div className="ck-flex ck-items-center ck-gap-4">
          <div className="ck-w-14 ck-h-14 ck-bg-gradient-btn-admin ck-rounded-xl ck-flex ck-items-center ck-justify-center ck-shadow-lg ck-shadow-red-500/20">
            <ChefHat className="ck-text-white" size={32} />
          </div>
          <div>
            <h1 className="ck-text-2xl ck-font-black ck-text-white ck-leading-tight ck-mb-1">
              Hệ thống Bếp Trung Tâm
            </h1>
            <p className="ck-text-xs ck-text-gray-400 ck-font-medium ck-tracking-wider ck-uppercase">
              Điều phối & Sản xuất
            </p>
          </div>
        </div>

        <div className="ck-flex ck-items-center ck-gap-5">
          <div className="ck-text-right ck-hidden sm:ck-block">
            <p className="ck-text-sm ck-font-bold ck-text-white">
              {userData?.name || "Bếp Trưởng"}
            </p>
            <p className="ck-text-xs ck-text-red-400">Trưởng ca điều phối</p>
          </div>
          <HeaderSettingsMenu
            userData={userData}
            showProfile={true}
            onOpenProfile={() => setShowUpdateProfileModal(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onLogout={onLogout}
          />
        </div>
      </header>

      <ChangePasswordModal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
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

      <div className="ck-flex ck-gap-6 ck-w-full ck-relative ck-z-10" style={{ minHeight: "800px" }}>
        {/* LEFT SIDEBAR */}
        <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col ck-justify-between" style={{ width: "20%", flexShrink: 0 }}>
          <ul className="ck-space-y-2 ck-flex-1 ck-mt-2" style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {["Tổng Quan", "Đơn"].map((item, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => setActiveKitchenTab(item)}
                  className={`ck-w-full ck-text-left ck-px-4 ck-py-3 ck-rounded-xl ck-font-bold ck-transition-all ${
                    activeKitchenTab === item
                      ? "ck-bg-gradient-btn-admin ck-text-white ck-shadow-lg"
                      : "ck-text-gray-400 hover:ck-bg-gray-800 hover:ck-text-white"
                  }`}
                  style={activeKitchenTab !== item ? { border: "none", background: "transparent" } : { border: "none" }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT CONTENT */}
        <div className="ck-flex-1 ck-flex ck-flex-col ck-gap-6 ck-min-w-0" style={{ width: "80%" }}>
          
          {/* ======================= TAB TỔNG QUAN ======================= */}
          {activeKitchenTab === "Tổng Quan" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-animate-fade-in">
              <div className="ck-grid ck-grid-cols-3 ck-gap-4">
                {[
                  { label: "Tổng suất ăn yêu cầu", value: stats.totalRequested, color: "ck-text-blue-400" },
                  { label: "Mẻ đang nấu", value: stats.cooking, color: "ck-text-orange-400" },
                  { label: "Mẻ đã hoàn thành", value: stats.completed, color: "ck-text-green-400" }
                ].map((stat, idx) => (
                  <div key={idx} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-p-5 ck-rounded-2xl ck-text-center ck-flex ck-flex-col ck-items-center ck-justify-center">
                    <h4 className="ck-text-sm ck-font-semibold ck-text-gray-400 ck-mb-2">{stat.label}</h4>
                    <p className={`ck-text-3xl ck-font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* QUẢN LÝ KHO CHI TIẾT */}
              <div className="ck-mt-4 ck-pt-6 ck-border-t ck-border-gray-700">
                <h2 className="ck-text-2xl ck-font-black ck-text-white ck-mb-2 ck-text-left">
                  Cài đặt & Quản lý Kho
                </h2>
                <div className="ck-flex ck-justify-start ck-gap-2 ck-mb-6 mt-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange("categories")}
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "categories" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`}
                    style={kitchenSubTab !== "categories" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}
                  >
                    Danh mục sản phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("products")}
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "products" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`}
                    style={kitchenSubTab !== "products" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}
                  >
                    Sản phẩm bếp TT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("ingredients")}
                    className={`ck-btn ck-px-4 ck-py-2 ck-rounded-xl ck-font-semibold ${kitchenSubTab === "ingredients" ? "ck-bg-gradient-btn-admin ck-text-white" : "ck-bg-gray-800 ck-text-gray-400 hover:ck-text-white"}`}
                    style={kitchenSubTab !== "ingredients" ? { border: "1px solid var(--ck-border)" } : { border: "none" }}
                  >
                    Nguyên liệu & Tồn Kho
                  </button>
                </div>

                <div className="ck-flex ck-gap-6 ck-items-start">
                  <div className={`ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-overflow-hidden ck-transition-all ${(showAddCategory || showAddProduct || showAddIngredient) ? "ck-w-2/3" : "ck-w-full"}`}>
                    
                    {/* BẢNG DANH MỤC */}
                    {kitchenSubTab === "categories" && (
                      <>
                        <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                          <h3 className="ck-text-xl ck-font-bold ck-text-white">Danh mục sản phẩm</h3>
                          <button
                            type="button"
                            className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600"
                            onClick={() => {
                              setShowAddCategory(true);
                              setEditingCategory(null);
                              setNewCategoryName("");
                            }}
                          >
                            + Thêm mới
                          </button>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr>
                              <th className="ck-py-4 ck-px-6">STT</th>
                              <th className="ck-py-4 ck-px-6">Tên danh mục</th>
                              <th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {categories.map((cat, idx) => (
                              <tr key={cat.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-text-gray-400">{idx + 1}</td>
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">{cat.name}</td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button
                                      onClick={() => {
                                        setEditingCategory(cat); setShowAddCategory(true); setNewCategoryName(cat.name);
                                      }}
                                      className="ck-text-gray-400 hover:ck-text-white bg-transparent border-none cursor-pointer"
                                    >✏️</button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      className="ck-text-red-500 hover:ck-text-red-400 bg-transparent border-none cursor-pointer"
                                    >🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* BẢNG SẢN PHẨM */}
                    {kitchenSubTab === "products" && (
                      <>
                        <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                          <h3 className="ck-text-xl ck-font-bold ck-text-white">Sản phẩm bếp trung tâm</h3>
                          <button
                            type="button"
                            className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600"
                            onClick={() => {
                              setShowAddProduct(true);
                              setEditingProduct(null);
                              setNewProduct({ id: "", name: "", category: "", price: "", stock: "", min: "", emoji: "🥪", baseUnit: "PHAN" });
                            }}
                          >
                            + Thêm mới
                          </button>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr>
                              <th className="ck-py-4 ck-px-6">Mã</th>
                              <th className="ck-py-4 ck-px-6">Sản phẩm</th>
                              <th className="ck-py-4 ck-px-6">Giá</th>
                              <th className="ck-py-4 ck-px-6">Tồn</th>
                              <th className="ck-py-4 ck-px-6">Trạng thái</th>
                              <th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {products.map((p) => (
                              <tr key={p.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-text-gray-400">{p.id}</td>
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">
                                  {p.emoji} {p.name} <span className="ck-block ck-text-xs ck-text-gray-500">{p.category}</span>
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-text-blue-400">{Number(p.price).toLocaleString()}₫</td>
                                <td className="ck-py-4 ck-px-6">{p.stock}</td>
                                <td className="ck-py-4 ck-px-6">
                                  <span
                                    className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ck-border ${
                                      p.isActive 
                                        ? "ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50" 
                                        : "ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50"
                                    }`}
                                  >
                                    {p.isActive ? "Còn hàng" : "Hết hàng"}
                                  </span>
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button
                                      onClick={() => { setEditingProduct(p); setShowAddProduct(true); setNewProduct({...p, baseUnit: p.baseUnit || "PHAN"}); }}
                                      className="ck-text-gray-400 hover:ck-text-white bg-transparent border-none cursor-pointer"
                                    >✏️</button>
                                    <button
                                      onClick={() => handleDeleteProduct(p.id)}
                                      className="ck-text-red-500 hover:ck-text-red-400 bg-transparent border-none cursor-pointer"
                                    >🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* BẢNG NGUYÊN LIỆU (ĐÃ BỎ NÚT NHẬP KHO) */}
                    {kitchenSubTab === "ingredients" && (
                      <>
                        <div className="ck-p-6 ck-border-b ck-border-gray-700 ck-flex ck-items-center ck-justify-between">
                          <h3 className="ck-text-xl ck-font-bold ck-text-white">Danh sách Nguyên liệu</h3>
                          <div className="ck-flex ck-gap-3">
                            <button
                              type="button"
                              className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600"
                              onClick={() => {
                                setShowAddIngredient(true);
                                setEditingIngredient(null);
                                setNewIngredient({ id: "", name: "", unit: "KG", unitCost: "", minThreshold: "" });
                              }}
                            >
                              + Thêm mới
                            </button>
                            {/* NÚT NHẬP KHO ĐÃ BỊ XOÁ TẠI ĐÂY */}
                          </div>
                        </div>
                        <table className="ck-w-full ck-text-left ck-border-collapse">
                          <thead className="ck-bg-gray-800 ck-text-gray-400 ck-text-sm ck-uppercase">
                            <tr>
                              <th className="ck-py-4 ck-px-6">Tên NL</th>
                              <th className="ck-py-4 ck-px-6">Giá nhập</th>
                              <th className="ck-py-4 ck-px-6">Định mức Min</th>
                              <th className="ck-py-4 ck-px-6">Tồn kho thực tế</th>
                              <th className="ck-py-4 ck-px-6">Trạng thái</th>
                              <th className="ck-py-4 ck-px-6 ck-text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="ck-text-white ck-text-sm">
                            {ingredients.map((ing) => (
                              <tr key={ing.id} className="ck-border-t ck-border-gray-700 hover:ck-bg-gray-800">
                                <td className="ck-py-4 ck-px-6 ck-font-semibold">{ing.name}</td>
                                <td className="ck-py-4 ck-px-6 ck-text-blue-400">{ing.unitCost.toLocaleString()}₫</td>
                                <td className="ck-py-4 ck-px-6 ck-text-gray-400">
                                  {ing.minThreshold} <span className="lowercase">{ing.unit}</span>
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-font-bold">
                                  {ing.stock} <span className="lowercase">{ing.unit}</span>
                                </td>
                                <td className="ck-py-4 ck-px-6">
                                  <span
                                    className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-xs ck-font-bold ck-border ${
                                      ing.status === "Đủ hàng"
                                        ? "ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50"
                                        : ing.status === "Cần nhập gấp"
                                        ? "ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50"
                                        : "ck-bg-red-500-20 ck-text-red-400 ck-border-red-500-50"
                                    }`}
                                  >
                                    {ing.status}
                                  </span>
                                </td>
                                <td className="ck-py-4 ck-px-6 ck-text-center">
                                  <div className="ck-flex ck-justify-center ck-gap-3">
                                    <button
                                      onClick={() => { setEditingIngredient(ing); setShowAddIngredient(true); setNewIngredient(ing); }}
                                      className="ck-text-gray-400 hover:ck-text-white bg-transparent border-none cursor-pointer"
                                    >✏️</button>
                                    <button
                                      onClick={() => handleDeleteIngredient(ing.id)}
                                      className="ck-text-red-500 hover:ck-text-red-400 bg-transparent border-none cursor-pointer"
                                    >🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>

                  {/* FORM CRUD BÊN PHẢI CHO CATEGORY, PRODUCT & INGREDIENT */}
                  {(showAddCategory || showAddProduct || showAddIngredient) && (
                    <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-6 ck-animate-fade-in ck-w-1/3">
                      <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
                        <h3 className="ck-text-xl ck-font-bold ck-text-white">
                          {showAddCategory ? (editingCategory ? "Sửa Danh Mục" : "Thêm Danh Mục")
                            : showAddProduct ? (editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm")
                            : showAddIngredient ? (editingIngredient ? "Sửa Nguyên Liệu" : "Thêm Nguyên Liệu")
                            : ""}
                        </h3>
                        <button
                          onClick={() => { setShowAddCategory(false); setShowAddProduct(false); setShowAddIngredient(false); }}
                          className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer"
                        >✕</button>
                      </div>

                      {/* FORM CATEGORY */}
                      {showAddCategory && (
                        <div className="ck-space-y-4">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên danh mục</label>
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" />
                          </div>
                          <button onClick={handleSaveCategory} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu thay đổi</button>
                        </div>
                      )}

                      {/* FORM PRODUCT */}
                      {showAddProduct && (
                        <div className="ck-space-y-4">
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/4">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Icon</label>
                              <input type="text" value={newProduct.emoji} onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-3 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-text-center ck-outline-none" />
                            </div>
                            <div className="ck-w-3/4">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên sản phẩm *</label>
                              <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Danh mục</label>
                            <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none">
                              <option value="">Chọn danh mục...</option>
                              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Giá bán (VNĐ) *</label>
                              <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn vị (VD: TÔ, PHAN)</label>
                              <input type="text" value={newProduct.baseUnit} onChange={(e) => setNewProduct({ ...newProduct, baseUnit: e.target.value.toUpperCase() })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="PHAN" />
                            </div>
                          </div>
                          <button onClick={handleSaveProduct} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu sản phẩm</button>
                        </div>
                      )}

                      {/* FORM INGREDIENT */}
                      {showAddIngredient && (
                        <div className="ck-space-y-4">
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Tên nguyên liệu *</label>
                            <input type="text" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="VD: Gà nguyên con" />
                          </div>
                          <div className="ck-flex ck-gap-3">
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Đơn vị *</label>
                              <input type="text" value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value.toUpperCase() })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="KG" />
                            </div>
                            <div className="ck-w-1/2">
                              <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Mức tối thiểu</label>
                              <input type="number" value={newIngredient.minThreshold} onChange={(e) => setNewIngredient({ ...newIngredient, minThreshold: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                            </div>
                          </div>
                          <div>
                            <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Giá vốn dự kiến (VNĐ)</label>
                            <input type="number" value={newIngredient.unitCost} onChange={(e) => setNewIngredient({ ...newIngredient, unitCost: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-blue-400 ck-font-bold ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 focus:ck-border-orange-500 ck-outline-none" placeholder="0" />
                          </div>
                          <button onClick={handleSaveIngredient} className="ck-w-full ck-mt-2 ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none">Lưu nguyên liệu</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB ĐƠN - XEM CÔNG THỨC & NẤU ======================= */}
          {activeKitchenTab === "Đơn" && (
            <div className="ck-flex ck-flex-col ck-gap-6 ck-h-full ck-animate-fade-in">
              <div className="ck-flex ck-justify-between ck-items-center">
                <div className="ck-flex ck-gap-4 ck-items-center">
                  <h2 className="ck-text-2xl ck-font-black ck-text-white">Phiếu yêu cầu nấu</h2>
                  <span className="ck-text-xs ck-text-gray-500 ck-bg-gray-800 ck-px-3 ck-py-1 ck-rounded-full">
                    Cập nhật: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="ck-flex ck-gap-3">
                  <button
                    onClick={handleOpenAggregation}
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-rounded-xl ck-font-bold ck-border-none shadow-lg shadow-orange-500/30 ck-flex ck-items-center ck-gap-2"
                  >
                    📦 Gom Đơn
                  </button>
                  <button
                    onClick={handleBulkComplete}
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-rounded-xl ck-font-bold ck-border-none shadow-lg shadow-green-500/30 ck-flex ck-items-center ck-gap-2"
                  >
                    ✅ Chốt Tất Cả Mẻ Đang Nấu
                  </button>
                  <button
                    onClick={loadData} disabled={isRefreshing}
                    className="ck-btn ck-px-4 ck-py-2 ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-flex ck-items-center ck-gap-2"
                  >
                    {isRefreshing ? "⏳ Đang tải..." : "🔄"}
                  </button>
                </div>
              </div>

              <div className="ck-grid ck-grid-cols-3 ck-gap-6">
                {productionRuns.length === 0 ? (
                  <p className="ck-text-gray-400">Không có đơn cần nấu.</p>
                ) : (
                  productionRuns.map((run) => {
                    const progressPercent = Math.round((run.cookedQty / run.totalQty) * 100) || 0;
                    return (
                      <div key={run.id} className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-5 ck-flex ck-flex-col ck-justify-between ck-card-hover">
                        <div>
                          <div className="ck-flex ck-justify-between ck-items-start ck-mb-4">
                            <div className="ck-flex ck-items-center ck-gap-2">
                              <h3 className="ck-text-lg ck-font-bold ck-text-white">{run.name}</h3>
                              <button onClick={() => handleViewRecipe(run)} className="ck-p-1.5 ck-bg-gray-800 ck-text-gray-400 hover:ck-text-blue-400 ck-rounded-lg ck-transition-colors ck-border-none ck-cursor-pointer" title="Xem công thức">
                                <Eye size={16} />
                              </button>

                              {run.status === "COOKING" && (
                                <button 
                                  onClick={() => {
                                    setWastageData({ runId: run.id, runName: run.name, wasteQty: "", reason: "" });
                                    setShowWastageModal(true);
                                  }} 
                                  className="ck-p-1.5 ck-bg-red-500/20 ck-text-red-400 hover:ck-bg-red-500 hover:ck-text-white ck-rounded-lg ck-transition-colors ck-border-none ck-cursor-pointer ck-ml-2" 
                                  title="Báo cáo hao hụt (Hỏng/Cháy)"
                                >
                                  ⚠️
                                </button>
                              )}
                            </div>
                            <span className={`ck-px-2 ck-py-1 ck-rounded-md ck-text-[10px] ck-font-bold ck-border ${run.status === "PENDING" ? "ck-bg-gray-800 ck-text-gray-400 ck-border-gray-600" : run.status === "COOKING" ? "ck-bg-orange-500-20 ck-text-orange-400 ck-border-orange-500-50 ck-animate-pulse" : "ck-bg-green-500-20 ck-text-green-400 ck-border-green-500-50"}`}>
                              {run.status === "PENDING" ? "CHỜ NẤU" : run.status === "COOKING" ? "ĐANG NẤU" : "XONG"}
                            </span>
                          </div>

                          <div className="ck-flex ck-items-end ck-gap-2 ck-mb-4">
                            <span className="ck-text-4xl ck-font-black ck-text-blue-400">{run.totalQty}</span>
                            <span className="ck-text-sm ck-text-gray-400 ck-pb-1">phần ăn</span>
                          </div>

                          <div className="ck-mb-5">
                            <div className="ck-flex ck-justify-between ck-text-[11px] ck-mb-1.5">
                              <span className="ck-text-gray-400 uppercase tracking-wider">Tiến độ nấu</span>
                              <span className="ck-text-white ck-font-bold">{run.cookedQty}/{run.totalQty}</span>
                            </div>
                            <div className="ck-w-full ck-bg-gray-800 ck-rounded-full ck-h-2">
                              <div className={`ck-h-2 ck-rounded-full ck-transition-all ck-duration-700 ${progressPercent === 100 ? "ck-bg-green-500" : "ck-bg-orange-500"}`} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="ck-mt-2">
                          {run.status === "PENDING" && (
                            <button onClick={() => handleUpdateRunStatus(run.id, "COOKING")} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors">
                              🔥 Bắt đầu nấu
                            </button>
                          )}
                          {run.status === "COOKING" && (
                            <button onClick={() => handleUpdateRunStatus(run.id, "COMPLETED")} className="ck-w-full ck-bg-gradient-btn-admin ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors">
                              ✅ Hoàn thành mẻ
                            </button>
                          )}
                          {run.status === "COMPLETED" && (
                            <button disabled className="ck-w-full ck-bg-gray-800 ck-text-gray-600 ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-opacity-50">
                              Đã xong
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ====================================================================== */}
      {/* CÁC MODALS TRỢ NĂNG XUẤT HIỆN KHI CẦN                                  */}
      {/* ====================================================================== */}
      
      {/* MODAL NHẬP KHO ĐÃ ĐƯỢC XÓA Ở ĐÂY */}

      {/* 2. MODAL XÁC NHẬN GOM ĐƠN NẤU */}
      {showAggModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-blue-500 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <h2 className="ck-text-xl ck-font-black ck-text-white ck-mb-2">Gom đơn chi nhánh</h2>
            <p className="ck-text-gray-300 ck-mb-4">
              Hệ thống đã quét các đơn hàng mới. Bạn có muốn chốt tổng hợp thành mẻ nấu không?
            </p>
            {aggregationData && (
              <div className="ck-bg-gray-800 ck-border ck-border-gray-700 ck-p-3 ck-rounded-lg ck-mb-6 ck-text-sm ck-text-gray-400">
                Có <strong className="ck-text-blue-400">{Array.isArray(aggregationData) ? aggregationData.length : Object.keys(aggregationData).length}</strong> loại sản phẩm cần nấu.
              </div>
            )}
            <div className="ck-flex ck-gap-4">
              <button onClick={() => setShowAggModal(false)} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors ck-cursor-pointer">
                Hủy
              </button>
              <button 
                onClick={handleConfirmAggregation} 
                className="ck-w-full ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer shadow-lg shadow-orange-500/30"
              >
                Chốt Gom Đơn & Xuất Kho
              </button>
  
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL HIỂN THỊ CÔNG THỨC & ĐỊNH MỨC */}
      {selectedRecipeRun && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/90 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-blue-500/30 ck-rounded-2xl ck-flex ck-flex-col ck-w-full ck-max-w-md ck-shadow-2xl">
            <div className="ck-p-6 ck-border-b ck-border-gray-800 ck-flex ck-justify-between ck-items-center">
              <div className="ck-flex ck-items-center ck-gap-3">
                <div className="ck-p-2 ck-bg-blue-500/20 ck-rounded-lg ck-text-blue-400">
                  <ChefHat size={24} />
                </div>
                <div>
                  <h3 className="ck-text-lg ck-font-bold ck-text-white">Định mức sản xuất (BOM)</h3>
                  <p className="ck-text-xs ck-text-gray-500 uppercase">{selectedRecipeRun.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecipeRun(null)} className="ck-text-gray-500 hover:ck-text-white ck-bg-transparent ck-border-none ck-text-xl ck-cursor-pointer">✕</button>
            </div>
            <div className="ck-p-6 ck-flex-1 ck-overflow-y-auto ck-scrollbar" style={{ maxHeight: "60vh" }}>
              <div className="ck-bg-blue-500/10 ck-border ck-border-blue-500/20 ck-p-4 ck-rounded-xl ck-mb-6">
                <p className="ck-text-[11px] ck-text-blue-400 ck-font-bold ck-uppercase ck-mb-1">Tổng sản lượng cần nấu:</p>
                <p className="ck-text-2xl ck-font-black ck-text-white">{selectedRecipeRun.totalQty} <span className="ck-text-sm ck-font-normal ck-text-gray-500">phần ăn</span></p>
              </div>
              <div className="ck-mb-6">
                <p className="ck-text-[11px] ck-text-gray-500 ck-font-bold ck-uppercase ck-mb-3">Nguyên liệu cần xuất kho:</p>
                <div className="ck-space-y-3">
                  {selectedRecipeRun.bom ? (
                    selectedRecipeRun.bom.map((ing, i) => {
                      const totalNeeded = (ing.qtyPerItem * selectedRecipeRun.totalQty).toFixed(2);
                      return (
                        <div key={i} className="ck-bg-gray-800/50 ck-border ck-border-gray-800 ck-p-3 ck-rounded-xl ck-flex ck-items-center ck-justify-between">
                          <span className="ck-text-sm ck-text-gray-300">{ing.name}</span>
                          <div className="ck-text-right">
                            <span className="ck-text-lg ck-font-black ck-text-blue-400 ck-font-mono">{totalNeeded}</span>
                            <span className="ck-text-[10px] ck-text-gray-500 ck-ml-1 uppercase">{ing.unit}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="ck-text-xs ck-text-gray-500 italic">Dữ liệu công thức đang được cập nhật...</p>
                  )}
                </div>
              </div>
            </div>
            <div className="ck-p-6 ck-bg-gray-800/30 ck-rounded-b-2xl">
              <button 
                onClick={() => setSelectedRecipeRun(null)} 
                className="ck-w-full ck-bg-green-600 hover:ck-bg-green-500 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border-none ck-transition-colors ck-cursor-pointer"
              >
                Xác nhận & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL BÁO LỖI CHUNG */}
      {errorModal.show && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-red-500 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <div className="ck-flex ck-flex-col ck-items-center ck-text-center">
              <div className="ck-w-16 ck-h-16 ck-bg-red-500/20 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-mb-4">
                <span className="ck-text-3xl">❌</span>
              </div>
              <h2 className="ck-text-xl ck-font-black ck-text-white ck-mb-2">Thao tác thất bại!</h2>
              <p className="ck-text-gray-300 ck-mb-6">{errorModal.message}</p>
              <button onClick={() => setErrorModal({ show: false, message: "" })} className="ck-w-full ck-bg-gray-800 hover:ck-bg-gray-700 ck-text-white ck-py-3 ck-rounded-xl ck-font-bold ck-border ck-border-gray-600 ck-transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL TẠO MẺ NẤU CHỦ ĐỘNG */}
      {showManualCookModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-gray-700 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
              <h2 className="ck-text-xl ck-font-black ck-text-white">Tạo Mẻ Nấu Chủ Động</h2>
              <button onClick={() => setShowManualCookModal(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer">✕</button>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Chọn Món Ăn *</label>
                <select value={manualCookData.productId} onChange={(e) => setManualCookData({ ...manualCookData, productId: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Số lượng (phần) *</label>
                <input type="number" value={manualCookData.quantity} onChange={(e) => setManualCookData({ ...manualCookData, quantity: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none" placeholder="0" />
              </div>
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Ghi chú (nếu có)</label>
                <input type="text" value={manualCookData.note} onChange={(e) => setManualCookData({ ...manualCookData, note: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none" placeholder="Ví dụ: Nấu dự phòng trưa..." />
              </div>
              <button onClick={handleManualCook} className="ck-w-full ck-bg-gray-100 hover:ck-bg-white ck-text-black ck-py-3 ck-rounded-xl ck-font-black ck-border-none ck-mt-2">
                🚀 Bắt đầu nấu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL BÁO CÁO HAO HỤT */}
      {showWastageModal && (
        <div className="ck-fixed ck-inset-0 ck-bg-black/80 ck-flex ck-items-center ck-justify-center ck-z-50 ck-animate-fade-in">
          <div className="ck-bg-gray-900 ck-border ck-border-red-500/50 ck-rounded-2xl ck-p-8 ck-w-full ck-max-w-md ck-shadow-2xl">
            <div className="ck-flex ck-justify-between ck-items-center ck-mb-6">
              <h2 className="ck-text-xl ck-font-black ck-text-red-400">Báo cáo Hao hụt</h2>
              <button onClick={() => setShowWastageModal(false)} className="ck-text-gray-400 hover:ck-text-white ck-bg-transparent ck-border-none ck-cursor-pointer">✕</button>
            </div>
            <div className="ck-bg-red-500/10 ck-p-3 ck-rounded-lg ck-mb-4 ck-text-sm ck-text-red-200">
              Mẻ nấu: <strong>{wastageData.runName}</strong>
            </div>
            <div className="ck-space-y-4">
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Số lượng hỏng/cháy (phần) *</label>
                <input type="number" value={wastageData.wasteQty} onChange={(e) => setWastageData({ ...wastageData, wasteQty: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-red-900/50 focus:ck-border-red-500 ck-outline-none" placeholder="0" />
              </div>
              <div>
                <label className="ck-block ck-text-gray-400 ck-mb-1 ck-text-sm">Lý do</label>
                <select value={wastageData.reason} onChange={(e) => setWastageData({ ...wastageData, reason: e.target.value })} className="ck-w-full ck-bg-gray-800 ck-text-white ck-px-4 ck-py-3 ck-rounded-xl ck-border ck-border-gray-700 ck-outline-none">
                  <option value="">-- Chọn lý do --</option>
                  <option value="Cháy khét">Cháy khét</option>
                  <option value="Rơi vãi">Rơi vãi</option>
                  <option value="Nguyên liệu hỏng">Nguyên liệu hỏng</option>
                  <option value="Khác">Lý do khác...</option>
                </select>
              </div>
              <button onClick={handleReportWastage} className="ck-w-full ck-bg-orange-600 hover:ck-bg-orange-500 ck-text-white ck-py-3 ck-rounded-xl ck-font-black ck-border-none ck-mt-2 shadow-lg shadow-orange-500/30">
                Ghi nhận Hao hụt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralKitchenPage;