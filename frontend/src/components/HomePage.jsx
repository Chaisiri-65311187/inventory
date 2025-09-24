import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return navigate("/login", { replace: true });
    setUser(JSON.parse(raw));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("auth_user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: "#6a5acd" }}>
        <div className="container-fluid">
          <span className="navbar-brand fw-semibold">Equipment Manager</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topnav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="topnav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><a className="nav-link active">Home</a></li>
              {/* ลิงก์อื่นๆ เพิ่มภายหลังได้ */}
            </ul>
            <div className="d-flex align-items-center gap-3">
              <span className="text-white-50 small">
                สวัสดี, <b className="text-white">{user?.name || user?.username}</b>
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={logout}>ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container my-4 flex-grow-1">
        {/* Quick Actions */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <Link to="/equipments" className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="fw-semibold">อุปกรณ์ทั้งหมด</div>
                  <div className="display-6">—</div>
                  <div className="text-muted small">ดูรายการอุปกรณ์</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-6 col-md-3">
            <Link to="/equipments/new" className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="fw-semibold">เพิ่มอุปกรณ์</div>
                  <div className="display-6">+</div>
                  <div className="text-muted small">บันทึกเข้าระบบ</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-6 col-md-3">
            <Link to="/brands" className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="fw-semibold">ยี่ห้อ</div>
                  <div className="display-6">—</div>
                  <div className="text-muted small">จัดการยี่ห้อ</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-6 col-md-3">
            <Link to="/types" className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="fw-semibold">ประเภท</div>
                  <div className="display-6">—</div>
                  <div className="text-muted small">จัดการประเภท</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent / Expiring */}
        <div className="row g-3">
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white fw-semibold">อุปกรณ์ที่เพิ่มล่าสุด</div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>รหัส</th>
                        <th>ชื่ออุปกรณ์</th>
                        <th>ยี่ห้อ</th>
                        <th>ประเภท</th>
                        <th className="text-end">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                    
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-semibold">ใกล้หมดประกัน</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Printer HP</span><span className="badge bg-warning text-dark">เหลือ 12 วัน</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Notebook Lenovo</span><span className="badge bg-danger">เหลือ 3 วัน</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Router TP-Link</span><span className="badge bg-secondary">หมดอายุแล้ว</span>
                  </li>
                </ul>
                <div className="text-end mt-3">
                  <Link to="/reports/expiring" className="btn btn-outline-secondary btn-sm">ดูทั้งหมด</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-muted small">
        © {new Date().getFullYear()} Equipment Manager
      </footer>
    </div>
  );
}
