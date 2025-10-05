// frontend/src/WarrantyExpiringPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWarrantyList } from "../services/api";

function statusBadge(days){
  if (days == null) return <span className="badge bg-secondary">ไม่ทราบ</span>;
  if (days < 0)    return <span className="badge bg-secondary">หมดอายุแล้ว</span>;
  if (days <= 7)   return <span className="badge bg-danger">เหลือ {days} วัน</span>;
  if (days <= 30)  return <span className="badge bg-warning text-dark">เหลือ {days} วัน</span>;
  return <span className="badge bg-success">เหลือ {days} วัน</span>;
}

export default function WarrantyExpiringPage(){
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("soon");   // soon | expired | active | all
  const [days, setDays] = useState(30);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const canPrev = page > 1;
  const canNext = page < pages;

  const rowTone = (d) => {
    if (d == null) return "";
    if (d < 0)   return "table-secondary";
    if (d <= 7)  return "table-danger";
    if (d <= 30) return "table-warning align-middle";
    return "";
  };

  async function load(){
    setLoading(true); setErr("");
    try{
      const data = await fetchWarrantyList({ status, days, q, page, pageSize });
      setRows(data.data); setTotal(data.total);
    }catch(e){ setErr(String(e.message || e)); }
    finally{ setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, days, page, pageSize]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  const SkeletonRow = () => (
    <tr>
      {Array.from({length:8}).map((_,i)=>(
        <td key={i}><span className="placeholder col-12" /></td>
      ))}
    </tr>
  );

  // ✅ ตัวเลือกสถานะแบบ nav-pills
  const STATUS_OPTIONS = [
    {
      key: "soon",
      label: "ใกล้หมด (≤ N)",
      title: "แสดงอุปกรณ์ที่เหลือวันรับประกัน ≤ N วัน",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 7v5l3 3" stroke="currentColor" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" />
        </svg>
      ),
    },
    {
      key: "expired",
      label: "หมดอายุแล้ว",
      title: "แสดงอุปกรณ์ที่หมดประกันแล้ว",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "active",
      label: "ยังเหลือ > N",
      title: "แสดงอุปกรณ์ที่เหลือวันรับประกันมากกว่า N วัน",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "all",
      label: "ทั้งหมด",
      title: "แสดงทุกอุปกรณ์ที่มีวันหมดประกัน",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="6" height="6" stroke="currentColor" />
          <rect x="14" y="4" width="6" height="6" stroke="currentColor" />
          <rect x="4" y="14" width="6" height="6" stroke="currentColor" />
          <rect x="14" y="14" width="6" height="6" stroke="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-vh-100 d-flex flex-column"
         style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>
      <div className="container-xxl my-4 flex-grow-1">

        {/* Header */}
        <header className="page-header mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <nav aria-label="breadcrumb" className="breadcrumb-wrap">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/" className="crumb-link">หน้าหลัก</Link>
                </li>
                <li className="breadcrumb-item active text-muted" aria-current="page">
                  ใกล้หมดประกัน
                </li>
              </ol>
            </nav>
            <Link to="/" className="btn btn-outline-secondary btn-sm">กลับหน้าหลัก</Link>
          </div>
          <h1 className="page-title mt-1">รายการอุปกรณ์ (ระยะเวลาเหลือการรับประกัน)</h1>
          <p className="page-subtitle">ตรวจสอบสถานะการรับประกัน เพื่อวางแผนซ่อม/ต่อประกันได้ทันเวลา</p>
        </header>

        {/* Toolbar */}
        <div className="card shadow-sm mb-3 border-0 rounded-4 overflow-hidden">
          <div className="px-4 py-3 text-white" style={{background:"linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)"}}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <b>ตัวกรอง</b>
              <div className="d-flex align-items-center gap-2 small">
                <span className="badge bg-danger">≤ 7 วัน</span>
                <span className="badge bg-warning text-dark">≤ 30 วัน</span>
                <span className="badge bg-secondary">หมดอายุแล้ว</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-3 align-items-end">
              {/* 🔄 เปลี่ยนตัวกรองสถานะเป็น nav-pills */}
              <div className="col-12">
                <label className="form-label mb-2">สถานะ</label>
                <ul className="nav nav-pills gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <li className="nav-item" key={opt.key}>
                      <button
                        type="button"
                        className={`nav-link d-flex align-items-center gap-2 ${status===opt.key ? "active" : ""}`}
                        title={opt.title}
                        onClick={() => { setStatus(opt.key); setPage(1); }}
                        style={{ borderRadius: 9999 }}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-6 col-md-3 col-lg-2">
                <label className="form-label mb-1">N (วัน)</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={days}
                    onChange={e=>setDays(Math.max(1, Number(e.target.value||30)))}
                  />
                  <span className="input-group-text">วัน</span>
                </div>
              </div>

              <div className="col-12 col-md-5 col-lg-6">
                <label className="form-label mb-1">ค้นหา</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="currentColor"/>
                      <path d="M20 20l-3-3" stroke="currentColor" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    className="form-control"
                    placeholder="ชื่อ/ยี่ห้อ/ประเภท/ครุภัณฑ์/ServiceTag"
                    value={q}
                    onChange={e=>setQ(e.target.value)}
                  />
                  {q && (
                    <button className="btn btn-outline-secondary" type="button" onClick={()=>setQ("")}>
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <label className="form-label mb-1">แสดงต่อหน้า</label>
                <select className="form-select" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option>10</option><option>20</option><option>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}

            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{width:70}}>ลำดับ</th>
                    <th style={{width:200}}>หมายเลขอุปกรณ์</th>
                    <th>ชื่ออุปกรณ์</th>
                    <th style={{width:160}}>ยี่ห้อ</th>
                    <th style={{width:160}}>ประเภท</th>
                    <th style={{width:160}}>เริ่มใช้งาน</th>
                    <th style={{width:160}}>วันสิ้นประกัน</th>
                    <th style={{width:140}}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      <SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/>
                      <SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/>
                    </>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-5">
                        <div className="mb-2">ไม่พบข้อมูลตามเงื่อนไข</div>
                        <small>ลองเคลียร์การค้นหา หรือเพิ่มค่า N ให้มากขึ้น</small>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={`${r.equipment_id}-${i}`} className={rowTone(r.days_left)}>
                        <td className="text-center">{(page-1)*pageSize + i + 1}</td>
                        <td className="text-nowrap">{r.asset_code || '-'}</td>
                        <td className="fw-semibold">{r.equipment_name}</td>
                        <td>{r.brand_name || '-'}</td>
                        <td>{r.type_name || '-'}</td>
                        <td className="text-nowrap">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '-'}</td>
                        <td className="text-nowrap">{r.warranty_expire ? new Date(r.warranty_expire).toLocaleDateString() : '-'}</td>
                        <td>{statusBadge(r.days_left)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer: page info + pagination */}
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
            <small className="text-muted">
              แสดง {(rows.length ? (page-1)*pageSize+1 : 0)}–{(page-1)*pageSize + rows.length} จาก {total} รายการ
            </small>

            <nav aria-label="pagination">
              <ul className="pagination mb-0">
                <li className={`page-item ${!canPrev ? "disabled":""}`}>
                  <button className="page-link" onClick={()=> canPrev && setPage(p=>p-1)}>Prev</button>
                </li>
                {Array.from({ length: pages }, (_, idx) => idx+1).slice(
                  Math.max(0, page-3), Math.max(0, page-3)+5
                ).map(n => (
                  <li key={n} className={`page-item ${n===page ? 'active':''}`}>
                    <button className="page-link" onClick={()=>setPage(n)}>{n}</button>
                  </li>
                ))}
                <li className={`page-item ${!canNext ? "disabled":""}`}>
                  <button className="page-link" onClick={()=> canNext && setPage(p=>p+1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

      </div>
      <footer className="py-3 text-center text-muted small">
        © {new Date().getFullYear()} Equipment Manager
      </footer>
    </div>
  );
}
