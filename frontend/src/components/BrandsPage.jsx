// frontend/src/BrandsPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  fetchBrands, createBrand, updateBrand, removeBrand
} from "../services/api";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // client-side paging
  const pageSizeOptions = [10, 20, 50];
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const total = brands.length;
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const view = useMemo(() => {
    const start = (page - 1) * pageSize;
    return brands.slice(start, start + pageSize);
  }, [brands, page, pageSize]);

  const byIdAsc = (a, b) => Number(a?.brand_id ?? Infinity) - Number(b?.brand_id ?? Infinity);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchBrands();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setBrands([...list].sort(byIdAsc));
      setPage(1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  useEffect(() => { load(); }, [load]);

  // == เพิ่มยี่ห้อ ==
  const onAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    if (brands.some(b => (b.brand_name || "").trim().toLowerCase() === name.toLowerCase())) {
      return Swal.fire("พบชื่อซ้ำ", "มียี่ห้อนี้อยู่แล้ว", "warning");
    }

    try {
      setAdding(true);
      await createBrand({ brand_name: name });
      setNewName("");
      await load();
      Toast.fire({ icon: "success", title: "เพิ่มยี่ห้อแล้ว" });
    } catch (e) {
      Swal.fire("เพิ่มไม่สำเร็จ", String(e?.message || e), "error");
    } finally {
      setAdding(false);
    }
  };

  // == เข้าโหมดแก้ไข (ตัวที่ขาดหายไปก่อนหน้า) ==
  const onEdit = (brand) => {
    setEditId(brand.brand_id);
    setEditName(brand.brand_name || "");
  };

  // == บันทึกแก้ไข ==
  const onSave = async () => {
    const name = editName.trim();
    if (!name) return Swal.fire("ข้อมูลไม่ครบ", "กรุณากรอกชื่อยี่ห้อ", "info");
    if (brands.some(b =>
      b.brand_id !== editId &&
      (b.brand_name || "").trim().toLowerCase() === name.toLowerCase()
    )) {
      return Swal.fire("พบชื่อซ้ำ", "มียี่ห้อนี้อยู่แล้ว", "warning");
    }

    const confirm = await Swal.fire({
      title: "บันทึกการแก้ไข?",
      text: `ยืนยันบันทึกชื่อยี่ห้อเป็น “${name}”`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    try {
      setSavingEdit(true);
      await updateBrand(editId, { brand_name: name });
      setEditId(null);
      setEditName("");
      await load();
      Toast.fire({ icon: "success", title: "บันทึกแล้ว" });
    } catch (e) {
      Swal.fire("บันทึกไม่สำเร็จ", String(e?.message || e), "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // == ยกเลิกแก้ไข ==
  const onCancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  // == ลบ ==
  const onDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "ยืนยันลบยี่ห้อนี้?",
      text: "รายการนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    try {
      await removeBrand(id);
      await load();
      Toast.fire({ icon: "success", title: "ลบแล้ว" });
    } catch (e) {
      Swal.fire("ลบไม่สำเร็จ", String(e?.message || e), "error");
    }
  };

  // กด Enter เพื่อบันทึก, ESC เพื่อยกเลิก ระหว่างแก้ไข
  const onEditKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onSave(); }
    if (e.key === "Escape") { e.preventDefault(); onCancelEdit(); }
  };

  const SkeletonRow = () => (
    <tr>
      <td><span className="placeholder col-6" /></td>
      <td><span className="placeholder col-10" /></td>
      <td className="text-end"><span className="placeholder col-4" /></td>
    </tr>
  );

  return (
    <div className="min-vh-100 d-flex flex-column"
         style={{ background: "linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)" }}>
      <div className="container-xxl my-4 flex-grow-1">
        {/* Page Header */}
        <header className="page-header mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <nav aria-label="breadcrumb" className="breadcrumb-wrap">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/" className="crumb-link">หน้าหลัก</Link>
                </li>
                <li className="breadcrumb-item active text-muted" aria-current="page">ยี่ห้อ</li>
              </ol>
            </nav>
            <Link to="/" className="btn btn-outline-secondary btn-sm">กลับหน้าหลัก</Link>
          </div>

          <h1 className="page-title mt-1">จัดการยี่ห้อ</h1>
          <p className="page-subtitle">เพิ่ม/แก้ไข/ลบยี่ห้อ เพื่อใช้เลือกในฟอร์มอุปกรณ์</p>
        </header>

        {/* Add bar */}
        <div className="card shadow-sm mb-3 border-0 rounded-4 overflow-hidden">
          <div className="px-4 py-3 text-white" style={{ background: "linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)" }}>
            <b>เพิ่มยี่ห้อใหม่</b>
          </div>
          <div className="card-body">
            <form onSubmit={onAdd} className="row g-2 align-items-center">
              <div className="col-12 col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    className="form-control"
                    placeholder="เช่น Dell, HP, Lenovo, Epson"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="form-text">ตั้งชื่อให้สอดคล้องกันเพื่อค้นหาได้ง่าย</div>
              </div>
              <div className="col-12 col-md-4 text-md-end">
                <button className="btn btn-primary px-4" type="submit" disabled={adding}>
                  {adding ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      กำลังเพิ่ม...
                    </span>
                  ) : "เพิ่ม"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-0">
            {err && <div className="alert alert-danger m-3">{err}</div>}

            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 110 }}>รหัส</th>
                    <th>ชื่อยี่ห้อ</th>
                    <th style={{ width: 240 }} className="text-end">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                    </>
                  ) : view.length === 0 ? (
                    <tr><td colSpan="3" className="text-center text-muted py-4">ไม่พบข้อมูล</td></tr>
                  ) : view.map((b) => (
                    <tr key={b.brand_id}>
                      <td className="text-nowrap">#{b.brand_id}</td>
                      <td>
                        {editId === b.brand_id ? (
                          <input
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={onEditKeyDown}
                            autoFocus
                          />
                        ) : (
                          <span className="fw-semibold">{b.brand_name}</span>
                        )}
                      </td>
                      <td className="text-end">
                        {editId === b.brand_id ? (
                          <div className="btn-group">
                            <button className="btn btn-sm btn-success" onClick={onSave} disabled={savingEdit}>
                              {savingEdit ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={onCancelEdit}>
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => onEdit(b)}
                              disabled={savingEdit}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(b.brand_id)}
                              disabled={savingEdit}
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer: paging */}
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
            <small className="text-muted">
              แสดง {view.length ? (page - 1) * pageSize + 1 : 0}–{(page - 1) * pageSize + view.length} จาก {total} รายการ
            </small>

            <div className="d-flex align-items-center gap-2">
              <select className="form-select form-select-sm" style={{ width: 92 }}
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {pageSizeOptions.map(n => <option key={n} value={n}>{n}/หน้า</option>)}
              </select>

              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {Array.from({ length: pages }, (_, idx) => idx + 1).slice(
                  Math.max(0, page - 3), Math.max(0, page - 3) + 5
                ).map(n => (
                  <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                  </li>
                ))}
                <li className={`page-item ${page === pages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 small text-muted">
          แนะนำ: ใช้ชื่อสั้น กระชับ และสะกดให้สม่ำเสมอ เช่น “HP” ไม่ใช่ “H.P.” เพื่อความคงเส้นคงวาในการค้นหา/รายงาน
        </div>
      </div>
    </div>
  );
}
