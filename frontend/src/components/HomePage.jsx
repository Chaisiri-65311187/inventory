// frontend/src/HomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats, fetchLatestEquipments, fetchExpiring } from "../services/api";

function readJSONSafe(key, fallback = null) {
  try { const raw = localStorage.getItem(key); return (!raw || raw==="undefined")?fallback:JSON.parse(raw); }
  catch { return fallback; }
}

function StatCard({ to, title, value, subtitle, icon }) {
  const body = (
    <div className="card shadow-sm border-0 h-100 kpi-card">
      <div className="card-body d-flex align-items-center gap-3">
        <div className="kpi-icon d-flex align-items-center justify-content-center rounded-3" aria-hidden>
          {icon}
        </div>
        <div className="flex-grow-1">
          <div className="text-muted small fw-semibold">{title}</div>
          <div className="fs-2 fw-bold lh-1">{value}</div>
          <div className="text-muted small">{subtitle}</div>
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="text-decoration-none text-reset">{body}</Link> : body;
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [latest, setLatest] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  useEffect(() => {
    setUser(readJSONSafe("auth_user"));
    (async () => {
      try{
        const [s, l, ex] = await Promise.all([
          fetchStats(),
          fetchLatestEquipments(6),
          fetchExpiring()
        ]);
        setStats(s); setLatest(l); setExpiring(ex);
      }catch(e){ setErr(String(e.message||e)); }
      finally{ setLoading(false); }
    })();
  }, []);

  const logout = () => { localStorage.removeItem("auth_user"); window.location.assign("/login"); };

  const Skeleton = ({ height=56 }) => (
    <div className="placeholder-glow">
      <span className="placeholder col-12" style={{display:"block", height}} />
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column" style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm" style={{ background: "#6a5acd" }}>
        <div className="container-xxl">
          <span className="navbar-brand fw-semibold d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="white" strokeWidth="1.6"/><circle cx="12" cy="12" r="2.4" fill="white"/></svg>
            Equipment Manager
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="text-white-50 small">
              สวัสดี, <b className="text-white">{user?.name || user?.username}</b>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <main className="container-xxl my-4 flex-grow-1">
        {/* Page header */}
        <div className="d-flex flex-wrap align-items-end justify-content-between mb-3 gap-2">
          <div>
            <h4 className="mb-1 fw-bold">แผงควบคุม</h4>
            <div className="text-muted small">ภาพรวมทรัพย์สินและสถานะประกัน</div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/reports/expiring" className="btn btn-outline-secondary btn-sm">รายงานประกัน</Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">โหลดข้อมูลล้มเหลว: {error}</div>}

        {/* KPI Row */}
        <div className="row g-3 mb-4">
          {loading ? (
            <>
              <div className="col-6 col-md-3"><Skeleton height={112} /></div>
              <div className="col-6 col-md-3"><Skeleton height={112} /></div>
              <div className="col-6 col-md-3"><Skeleton height={112} /></div>
              <div className="col-6 col-md-3"><Skeleton height={112} /></div>
            </>
          ) : stats && (
            <>
              <div className="col-6 col-md-3">
                <StatCard
                  to="/equipments"
                  title="อุปกรณ์ทั้งหมด"
                  value={(stats.totalEquip?.toLocaleString?.() ?? stats.totalEquip) ?? "-"}
                  subtitle="ดูรายการอุปกรณ์"
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor"/><path d="M7 8h10M7 12h6" stroke="currentColor" strokeLinecap="round"/></svg>}
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  to="/equipments/new"
                  title="เพิ่มอุปกรณ์"
                  value="＋"
                  subtitle="บันทึกเข้าระบบ"
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeLinecap="round"/></svg>}
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  to="/brands"
                  title="ยี่ห้อ"
                  value={stats.totalBrands ?? "-"}
                  subtitle="จัดการยี่ห้อ"
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4z" stroke="currentColor"/><path d="M8 7V5h8v2" stroke="currentColor"/></svg>}
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  to="/types"
                  title="ประเภท"
                  value={stats.totalTypes ?? "-"}
                  subtitle="จัดการประเภท"
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6h12l-2 6H8z" stroke="currentColor"/><rect x="9" y="14" width="6" height="4" stroke="currentColor"/></svg>}
                />
              </div>
            </>
          )}
        </div>

        {/* Content Row */}
        <div className="row g-3">
          {/* Latest */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white fw-semibold d-flex align-items-center justify-content-between">
                <span className="d-inline-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeLinecap="round"/></svg>
                  อุปกรณ์ที่เพิ่มล่าสุด
                </span>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="p-3"><Skeleton height={180} /></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>รหัส</th>
                          <th>ชื่ออุปกรณ์</th>
                          <th>ยี่ห้อ</th>
                          <th>ประเภท</th>                 
                        </tr>
                      </thead>
                      <tbody>
                        {latest.length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-muted py-4">ยังไม่มีข้อมูล</td></tr>
                        ) : latest.map(it => (
                          <tr key={it.equipment_id}>
                            <td className="text-nowrap">{it.equipment_id}</td>
                            <td>{it.equipment_name}</td>
                            <td>{it.brand_name || '-'}</td>
                            <td>{it.type_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expiring */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 2v3M17 2v3M3 9h18M5 7h14v13H5z" stroke="currentColor" strokeLinecap="round"/></svg>
                ใกล้หมดประกัน
              </div>
              <div className="card-body">
                {loading ? (
                  <Skeleton height={160} />
                ) : expiring.length === 0 ? (
                  <div className="text-muted">ไม่มีรายการใกล้หมดประกัน</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {expiring.map(row => {
                      const days = Number(row.days_left);
                      const badge =
                        days < 0 ? "badge bg-secondary"
                        : days <= 7 ? "badge bg-danger"
                        : days <= 30 ? "badge bg-warning text-dark"
                        : "badge bg-success";
                      const txt = days < 0 ? "หมดอายุแล้ว" : `เหลือ ${days} วัน`;
                      return (
                        <li key={row.equipment_id} className="list-group-item d-flex justify-content-between align-items-start">
                          <div className="me-2">
                            <div className="fw-semibold">{row.equipment_name}</div>
                            <div className="small text-muted">{row.brand_name ?? row.type_name ?? ""}</div>
                          </div>
                          <span className={badge}>{txt}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="text-end mt-3">
                  <Link to="/reports/expiring" className="btn btn-outline-secondary btn-sm">ดูทั้งหมด</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-3 text-center text-muted small">
        © {new Date().getFullYear()} Equipment Manager
      </footer>
    </div>
  );
}
