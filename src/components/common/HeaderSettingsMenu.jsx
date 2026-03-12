import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Settings,
  User,
  KeyRound,
  LogOut,
  ChevronRight,
} from "../../components/icons/Icons";

/**
 * Menu dropdown Cài đặt (layout kiểu profile + danh sách mục có icon).
 * @param {object} [userData] - { name } để hiện ở block profile trên cùng
 * @param {boolean} [showProfile=true] - Hiện mục "Hồ sơ"
 * @param {function} onOpenProfile - Bấm "Hồ sơ"
 * @param {function} onChangePassword - Bấm "Đổi mật khẩu"
 * @param {function} onLogout - Bấm "Đăng xuất"
 * @param {string} [buttonClassName] - Class cho nút Settings
 */
const DROPDOWN_WIDTH = 280;

function HeaderSettingsMenu({
  userData,
  showProfile = true,
  onOpenProfile,
  onChangePassword,
  onLogout,
  buttonClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        left: Math.max(8, rect.right - DROPDOWN_WIDTH),
        top: rect.bottom + 8,
        width: DROPDOWN_WIDTH,
        zIndex: 9999,
      });
    }
  }, [open]);

  const openMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        left: Math.max(8, rect.right - DROPDOWN_WIDTH),
        top: rect.bottom + 8,
        width: DROPDOWN_WIDTH,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  const handle = (fn) => {
    setOpen(false);
    fn?.();
  };

  const iconWrap = "ck-w-10 ck-h-10 ck-rounded-full ck-flex ck-items-center ck-justify-center ck-flex-shrink-0";

  return (
    <div
      className="ck-relative ck-shrink-0"
      style={{ width: "fit-content", display: "inline-block", flexShrink: 0 }}
      ref={ref}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`ck-btn ck-flex ck-items-center ck-justify-center ck-p-2.5 ck-rounded-xl ck-bg-gray-700 ck-text-gray-300 hover:ck-bg-gray-600 hover:ck-text-white ck-transition-all ${buttonClassName}`}
        style={{ border: "none" }}
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Cài đặt"
        aria-expanded={open}
      >
        <Settings size={22} />
      </button>

      {open && (
        <div
          className="ck-rounded-2xl ck-overflow-hidden"
          style={{
            ...dropdownStyle,
            background: "rgb(55 65 81)",
            border: "1px solid rgba(148, 163, 184, 0.4)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
          role="menu"
        >
          <div className="ck-py-2 ck-px-2">
            {showProfile && (
              <button
                type="button"
                className="ck-w-full ck-flex ck-items-center ck-gap-3 ck-px-4 ck-py-3 ck-rounded-xl ck-text-left ck-text-gray-100 hover:ck-bg-gray-600 ck-font-medium ck-transition-colors"
                onClick={() => handle(onOpenProfile)}
                role="menuitem"
              >
                <div
                  className={iconWrap}
                  style={{ background: "rgba(255,255,255,0.12)", color: "#e2e8f0" }}
                >
                  <User size={20} />
                </div>
                <span className="ck-flex-1">Hồ sơ</span>
                <ChevronRight size={18} style={{ color: "#94a3b8" }} />
              </button>
            )}
            <button
              type="button"
              className="ck-w-full ck-flex ck-items-center ck-gap-3 ck-px-4 ck-py-3 ck-rounded-xl ck-text-left ck-text-gray-100 hover:ck-bg-gray-600 ck-font-medium ck-transition-colors"
              onClick={() => handle(onChangePassword)}
              role="menuitem"
            >
              <div
                className={iconWrap}
                style={{ background: "rgba(255,255,255,0.12)", color: "#e2e8f0" }}
              >
                <KeyRound size={20} />
              </div>
              <span className="ck-flex-1">Đổi mật khẩu</span>
              <ChevronRight size={18} style={{ color: "#94a3b8" }} />
            </button>
            <div className="ck-my-1 ck-border-t ck-border-gray-500" style={{ borderColor: "rgba(148,163,184,0.3)" }} />
            <button
              type="button"
              className="ck-w-full ck-flex ck-items-center ck-gap-3 ck-px-4 ck-py-3 ck-rounded-xl ck-text-left ck-text-red-400 hover:ck-bg-red-500-20 ck-font-semibold ck-transition-colors"
              onClick={() => handle(onLogout)}
              role="menuitem"
            >
              <div
                className={iconWrap}
                style={{ background: "rgba(248,113,113,0.2)", color: "#f87171" }}
              >
                <LogOut size={20} />
              </div>
              <span className="ck-flex-1">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeaderSettingsMenu;
