import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function readJSONSafe(key, fallback = null) {
  try { const raw = localStorage.getItem(key); return (!raw || raw==="undefined")?fallback:JSON.parse(raw); }
  catch { return fallback; }
}

export default function AppNavbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => { setUser(readJSONSafe("auth_user")); }, []);

  const logout = () => {
    localStorage.removeItem("auth_user");
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active fw-semibold" : "");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm" style={{ background: "#6a5acd" }}>
      <div className="container-xxl">
        <Link className="navbar-brand fw-semibold d-flex align-items-center gap-2" to="/">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="white" strokeWidth="1.6"/><circle cx="12" cy="12" r="2.2" fill="white"/></svg>
          Equipment Manager
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink to="/" className={linkClass} end>หน้าหลัก</NavLink></li>
            <li className="nav-item"><NavLink to="/equipments" className={linkClass}>อุปกรณ์</NavLink></li>
            <li className="nav-item"><NavLink to="/brands" className={linkClass}>ยี่ห้อ</NavLink></li>
            <li className="nav-item"><NavLink to="/types" className={linkClass}>ประเภท</NavLink></li>
            <li className="nav-item"><NavLink to="/reports/expiring" className={linkClass}>ใกล้หมดประกัน</NavLink></li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 small">
              สวัสดี, <b className="text-white">{user?.name || user?.username || "ผู้ใช้"}</b>
            </span>
            <Link to="/equipments/new" className="btn btn-light btn-sm">+ เพิ่มอุปกรณ์</Link>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>ออกจากระบบ</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
