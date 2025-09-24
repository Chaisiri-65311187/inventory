// frontend/src/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!username.trim() || !password.trim()) {
      setErr("กรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    try {
      setLoading(true);
      const user = await login(username, password);
      localStorage.setItem("auth_user", JSON.stringify(user));
      navigate("/", { replace: true });
    } catch (err) {
      setErr(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background:
          "linear-gradient(135deg, #f6f8ff 0%, #fef6f0 50%, #f3f0ff 100%)",
        padding: "24px",
      }}
    >
      <div
        className="shadow-lg rounded-4"
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#ffffffcc",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Header แบรนด์ */}
        <div
          className="rounded-top-4 px-4 py-4"
          style={{
            background:
              "linear-gradient(90deg, #6a4cff 0%, #8b5cf6 50%, #a78bfa 100%)",
            color: "#fff",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* โลโก้เล็กแบบ SVG */}
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: 44,
                height: 44,
                background: "rgba(255,255,255,0.18)",
              }}
              aria-hidden
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
                  stroke="white"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="2.4" fill="white" />
              </svg>
            </div>
            <div>
              <div className="fw-semibold" style={{ opacity: 0.9 }}>
                Equipment Manager
              </div>
              <h4 className="m-0 fw-bold">เข้าสู่ระบบ</h4>
            </div>
          </div>
        </div>

        {/* Body ฟอร์ม */}
        <form onSubmit={onSubmit} className="px-4 py-4">
          {error && (
            <div className="alert alert-danger py-2 small mb-3">{error}</div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">ชื่อผู้ใช้</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                {/* ไอคอน user */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#6c757d" />
                  <path
                    d="M4 20c0-4 4-6 8-6s8 2 8 6"
                    stroke="#6c757d"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                className="form-control border-start-0"
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoFocus
                placeholder="username"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label fw-semibold">รหัสผ่าน</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                {/* ไอคอน lock */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                    stroke="#6c757d"
                  />
                  <path
                    d="M8 10V7a4 4 0 118 0v3"
                    stroke="#6c757d"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                className="form-control border-start-0"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setP(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPw((s) => !s)}
                tabIndex={-1}
              >
                {showPw ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label small text-muted" htmlFor="remember">
                จำฉันไว้ในเครื่องนี้
              </label>
            </div>
            <a className="small" href="#" onClick={(e) => e.preventDefault()}>
              ลืมรหัสผ่าน?
            </a>
          </div>

          <button
            className="btn btn-primary w-100 py-2 fw-semibold"
            disabled={loading}
            style={{ borderRadius: 12, maxWidth: "250px", margin: "0 auto", display: "block" }}
          >
            {loading ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>

          {/* เส้นคั่นและข้อความช่วยเหลือ */}
          <div className="text-center text-muted small mt-3">
            เข้าสู่ระบบเพื่อจัดการข้อมูลอุปกรณ์
          </div>
        </form>

        {/* Footer เล็กๆ */}
        <div className="px-4 pb-4">
          <div
            className="rounded-3 p-3 text-muted small"
            style={{ background: "#f8f9fa" }}
          >
            <div className="fw-semibold mb-1">คำแนะนำความปลอดภัย</div>
            ใช้งานบนอุปกรณ์ส่วนตัว และอย่าเผยแพร่รหัสผ่านให้ผู้อื่น
          </div>
        </div>
      </div>
    </div>
  );
}
