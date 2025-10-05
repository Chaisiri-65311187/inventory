// frontend/src/EquipmentsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchEquipments,
  fetchEquipmentFull,
  removeEquipment,
} from "../services/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
})

const API_BASE = "http://localhost:3000";

export default function EquipmentsList() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  // modal state
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );
  const canPrev = page > 1;
  const canNext = page < pages;

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchEquipments({ q, page, pageSize });
      setRows(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function onView(id) {
    setViewLoading(true);
    setViewItem(null);
    try {
      const it = await fetchEquipmentFull(id);
      const image_path = it?.image_path
        ? it.image_path.startsWith("http")
          ? it.image_path
          : `${API_BASE}${it.image_path}`
        : "";
      setViewItem({ ...it, image_path });

      // โหลด Bootstrap Modal แบบไดนามิก (ไม่ต้องพึ่ง window.bootstrap)
      const { Modal } = await import('bootstrap');
      const el = document.getElementById('viewModal');
      const modal = Modal.getOrCreateInstance(el);
      modal.show();
    } catch (e) {
      alert("โหลดข้อมูลไม่สำเร็จ: " + (e?.message || e));
    } finally {
      setViewLoading(false);
    }
  }

  async function onDelete(id) {
    const confirm = await Swal.fire({
      title: "ยืนยันลบอุปกรณ์นี้?",
      text: "รายการนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    try {
      await removeEquipment(id);
      await load();
      Toast.fire({ icon: "success", title: "ลบแล้ว" });
    } catch (e) {
      // ถ้าลบแล้วแต่ฝั่งเซิร์ฟเวอร์รายงาน not found ให้รีเฟรชแล้วถือว่าสำเร็จ
      if (String(e?.message || e).toLowerCase().includes("not found")) {
        await load();
        Toast.fire({ icon: "success", title: "ลบแล้ว" });
      } else {
        Swal.fire("ลบไม่สำเร็จ", String(e?.message || e), "error");
      }
    }
  }
  const SkeletonRow = () => (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i}>
          <span className="placeholder col-12" />
        </td>
      ))}
    </tr>
  );

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        background:
          "linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)",
      }}
    >
      <div className="container-xxl my-4 flex-grow-1">
        {/* Page Header */}
        <header className="page-header mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <nav aria-label="breadcrumb" className="breadcrumb-wrap">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/" className="crumb-link">
                    หน้าหลัก
                  </Link>
                </li>
                <li className="breadcrumb-item active text-muted" aria-current="page">
                  รายการอุปกรณ์
                </li>
              </ol>
            </nav>
            <div className="d-flex gap-2">
              <Link to="/" className="btn btn-outline-secondary btn-sm">
                กลับหน้าหลัก
              </Link>
              <Link to="/equipments/new" className="btn btn-primary btn-sm">
                + เพิ่มอุปกรณ์
              </Link>
            </div>
          </div>
          <h1 className="page-title mt-1">รายการอุปกรณ์</h1>
          <p className="page-subtitle">ค้นหา แก้ไข หรือลบอุปกรณ์จากฐานข้อมูล</p>
        </header>

        {/* Toolbar */}
        <div className="card shadow-sm mb-3 border-0">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-8">
                <label className="form-label mb-1">ค้นหา</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" />
                      <path d="M20 20l-3-3" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    className="form-control"
                    placeholder="ชื่ออุปกรณ์ / ยี่ห้อ / ประเภท"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  {q && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setQ("")}
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-lg-4">
                <label className="form-label mb-1">แสดงต่อหน้า</label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}

            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>ลำดับ</th>
                    <th>ชื่ออุปกรณ์</th>
                    <th style={{ width: 180 }}>ยี่ห้อ</th>
                    <th style={{ width: 180 }}>ประเภท</th>
                    <th style={{ width: 240 }} className="text-end">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={r.equipment_id}>
                        <td className="text-center">
                          {(page - 1) * pageSize + i + 1}
                        </td>
                        <td className="fw-semibold">{r.equipment_name}</td>
                        <td>{r.brand_name || "-"}</td>
                        <td>{r.type_name || "-"}</td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => onView(r.equipment_id)}
                            >
                              รายละเอียด
                            </button>
                            <Link
                              to={`/equipments/${r.equipment_id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              แก้ไข
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(r.equipment_id)}
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
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
              แสดง {rows.length ? (page - 1) * pageSize + 1 : 0}–
              {(page - 1) * pageSize + rows.length} จาก {total} รายการ
            </small>

            <nav aria-label="pagination">
              <ul className="pagination mb-0">
                <li className={`page-item ${!canPrev ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => canPrev && setPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                </li>
                {Array.from({ length: pages }, (_, idx) => idx + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((n) => (
                    <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(n)}>
                        {n}
                      </button>
                    </li>
                  ))}
                <li className={`page-item ${!canNext ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => canNext && setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* View Modal */}
        <div className="modal fade" id="viewModal" tabIndex="-1" aria-hidden="true">
          <div
            className="modal-dialog modal-dialog-scrollable modal-xl modal-fullscreen-lg-down"
            style={{ maxWidth: "min(1280px,95vw)", width: "95vw" }}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ background: "linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)" }}
              >
                <h5 className="modal-title">รายละเอียดอุปกรณ์</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="close"></button>
              </div>

              {/* ---- Modal Body ---- */}
              <div className="modal-body p-4">
                {viewLoading ? (
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 mb-2" />
                    <span className="placeholder col-10 mb-2" />
                    <span className="placeholder col-8 mb-2" />
                  </div>
                ) : viewItem ? (
                  <div className="row g-4">
                    <div className="col-md-4">
                      {viewItem.image_path ? (
                        <img
                          src={viewItem.image_path}
                          alt={viewItem.equipment_name}
                          className="img-fluid rounded-3 w-100"
                          style={{ objectFit: "cover", maxHeight: 360 }}
                        />
                      ) : (
                        <div className="border rounded-3 p-5 text-center text-muted">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                    </div>

                    <div className="col-md-8">
                      <h4 className="mb-1 fw-bold">{viewItem.equipment_name}</h4>
                      <div className="text-muted small mb-3">
                        รหัสระบบ: #{viewItem.equipment_id}
                        {viewItem.asset_code ? <> · หมายเลขอุปกรณ์: {viewItem.asset_code}</> : null}
                      </div>

                      <div className="row g-3">
                        <div className="col-6"><div className="small text-muted">ยี่ห้อ</div><div className="fw-semibold">{viewItem.brand_name || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">ประเภท</div><div className="fw-semibold">{viewItem.type_name || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">อุปกรณ์</div><div className="fw-semibold">{viewItem.asset_code || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">Service Code</div><div className="fw-semibold">{viewItem.service_code || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">ราคา</div><div className="fw-semibold">{(viewItem.price ?? "-")}</div></div>
                        <div className="col-6"><div className="small text-muted">สถานะ</div><div className="fw-semibold">{viewItem.status || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">เริ่มใช้งาน</div><div className="fw-semibold">{viewItem.start_date?.slice(0, 10) || "-"}</div></div>
                        <div className="col-6"><div className="small text-muted">สิ้นประกัน</div><div className="fw-semibold">{viewItem.warranty_expire?.slice(0, 10) || "-"}</div></div>
                      </div>

                      {viewItem.description && (
                        <>
                          <hr className="my-3" />
                          <div className="small text-muted mb-1">รายละเอียดเพิ่มเติม</div>
                          <div className="p-3 rounded-3 bg-light">{viewItem.description}</div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted">ไม่มีข้อมูล</div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 d-flex justify-content-between align-items-center bg-white">
                <div className="text-muted small">
                  {viewItem?.equipment_name ? viewItem.equipment_name : "อุปกรณ์"} · #{viewItem?.equipment_id}
                </div>
                <div className="d-flex gap-2">
                  {/* ปุ่มไปหน้าแก้ไข: ปิดโมดอลก่อนแล้วค่อย navigate */}
                  <button className="btn btn-outline-secondary" data-bs-dismiss="modal">
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Modal */}
      </div>

      <footer className="py-3 text-center text-muted small">
        © {new Date().getFullYear()} Equipment Manager
      </footer>
    </div>
  );
}
