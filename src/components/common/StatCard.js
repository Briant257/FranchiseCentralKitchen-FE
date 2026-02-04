import React from "react";

/**
 * Thẻ thống kê dùng cho Dashboard
 */
function StatCard({ label, value, change, icon: Icon, color }) {
  return (
    <div className="ck-stat-card ck-rounded-2xl ck-p-6 ck-card-hover">
      <div className="ck-flex ck-items-center ck-justify-between ck-mb-4">
        <div
          className={`ck-icon-box ck-w-14-h-14 ck-rounded-xl ck-shadow-lg ${color}`}
        >
          <Icon className="ck-text-white" size={28} />
        </div>
        {change ? (
          <span
            className={`ck-badge ${
              change.startsWith("+") ? "ck-badge-green" : "ck-badge-red"
            }`}
          >
            {change}
          </span>
        ) : null}
      </div>
      <p className="ck-text-gray-400 ck-text-sm ck-mb-2 ck-font-medium">
        {label}
      </p>
      <p className="ck-text-4xl ck-font-black ck-text-white">{value}</p>
    </div>
  );
}

export default StatCard;
