import React, { useState } from "react";
import ProductCard from "./ProductCard";
import "./CategorySection.css";

const CategorySection = ({ title, products, onAddToCart, onShowDetail }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubCategory, setActiveSubCategory] = useState("Trang chủ");

  const subCategories = ["Trang chủ", "Món ăn", "Thức uống"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesCategory = false;
    if (activeSubCategory === "Trang chủ") {
      matchesCategory = true;
    } else if (activeSubCategory === "Món ăn") {
      matchesCategory = product.subCategory !== "THỨC UỐNG & TRÁNG MIỆNG";
    } else if (activeSubCategory === "Thức uống") {
      matchesCategory = product.subCategory === "THỨC UỐNG & TRÁNG MIỆNG";
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="category-section">
      <div className="category-section-search-wrapper">
        <div className="category-section-search-container">
          <span className="category-section-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="category-section-search"
          />
        </div>
      </div>

      <div className="category-section-tabs-wrapper">
        <div className="category-section-tabs">
          {subCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveSubCategory(category)}
              className={`category-section-tab ${activeSubCategory === category ? "active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="category-section-grid">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onShowDetail={onShowDetail}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="category-section-empty">
          <p className="category-section-empty-text">
            Không tìm thấy món ăn phù hợp
          </p>
        </div>
      )}
    </section>
  );
};

export default CategorySection;
