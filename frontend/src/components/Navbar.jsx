import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: "#6a5acd" }}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-semibold" to="/">
          Equipment Manager
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#topnav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="topnav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">หน้าแรก</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/equipments">อุปกรณ์</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/reports">รายงาน</Link>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                ตรวจสอบประกัน
              </a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/warranty/soon">ใกล้หมดประกัน</Link></li>
                <li><Link className="dropdown-item" to="/warranty/expired">สิ้นสุดประกัน</Link></li>
                <li><Link className="dropdown-item" to="/warranty/active">ยังมีประกัน</Link></li>
              </ul>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {user && (
              <span className="text-white-50 small">
                สวัสดี, <b className="text-white">{user.name || user.username}</b>
              </span>
            )}
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
