// frontend/src/TypesPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTypes, createType, updateType, removeType } from "../services/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function TypesPage() {
  const [types, setTypes] = useState([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // helper: เรียงตาม id จากน้อยไปมาก
  const byIdAsc = (a, b) => Number(a?.type_id ?? Infinity) - Number(b?.type_id ?? Infinity);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchTypes();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setTypes([...list].sort(byIdAsc));
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

const onAdd = async (e) => {
  e.preventDefault();
  const name = newName.trim();
  if (!name) return;

  if (types.some(t => (t.type_name || "").trim().toLowerCase() === name.toLowerCase())) {
    return Swal.fire("พบชื่อซ้ำ", "มีชื่อประเภทนี้อยู่แล้ว", "warning");
  }

     try {
    setAdding(true);
    await createType({ type_name: name });
    setNewName("");
    await load();
    Toast.fire({ icon: "success", title: "เพิ่มประเภทแล้ว" });
  } catch (e) {
    Swal.fire("เพิ่มไม่สำเร็จ", String(e?.message || e), "error");
  } finally {
    setAdding(false);
  }
};

  const onEdit = (t) => {
    setEditId(t.type_id);
    setEditName(t.type_name || "");
  };
const onSave = async () => {
  const name = editName.trim();
  if (!name) return Swal.fire("ข้อมูลไม่ครบ", "กรุณากรอกชื่อประเภท", "info");
  if (types.some(t => t.type_id !== editId && (t.type_name || "").trim().toLowerCase() === name.toLowerCase())) {
    return Swal.fire("พบชื่อซ้ำ", "มีชื่อประเภทนี้อยู่แล้ว", "warning");
  }

  const confirm = await Swal.fire({
    title: "บันทึกการแก้ไข?",
    text: `ยืนยันบันทึกชื่อประเภทเป็น “${name}”`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
  });
  if (!confirm.isConfirmed) return;

  try {
    setSavingEdit(true);
    await updateType(editId, { type_name: name });
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

  const onDelete = async (id) => {
  const confirm = await Swal.fire({
    title: "ยืนยันลบประเภทนี้?",
    text: "รายการนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
  });
  if (!confirm.isConfirmed) return;

  try {
    await removeType(id);
    await load();
    Toast.fire({ icon: "success", title: "ลบแล้ว" });
  } catch (e) {
    Swal.fire("ลบไม่สำเร็จ", String(e?.message || e), "error");
  }
};

  const SkeletonRow = () => (
    <tr>
      <td><span className="placeholder col-6" /></td>
      <td><span className="placeholder col-10" /></td>
      <td className="text-end"><span className="placeholder col-4" /></td>
    </tr>
  );

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});


  return (
    <div className="min-vh-100 d-flex flex-column"
         style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>
      <div className="container-xxl my-4 flex-grow-1">

        {/* Page Header */}
        <header className="page-header mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <nav aria-label="breadcrumb" className="breadcrumb-wrap">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/" className="crumb-link">หน้าหลัก</Link>
                </li>
                <li className="breadcrumb-item active text-muted" aria-current="page">
                  ประเภทอุปกรณ์
                </li>
              </ol>
            </nav>
            <Link to="/" className="btn btn-outline-secondary btn-sm">กลับหน้าหลัก</Link>
          </div>
          <h1 className="page-title mt-1">จัดการประเภทอุปกรณ์</h1>
          <p className="page-subtitle">เพิ่ม/แก้ไข/ลบประเภท เพื่อใช้เลือกในฟอร์มอุปกรณ์</p>
        </header>

        {/* Add bar */}
        <div className="card shadow-sm mb-3 border-0 rounded-4 overflow-hidden">
          <div className="px-4 py-3 text-white" style={{background:"linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)"}}>
            <b>เพิ่มประเภทใหม่</b>
          </div>
          <div className="card-body">
            <form onSubmit={onAdd} className="row g-2 align-items-center">
              <div className="col-12 col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    className="form-control"
                    placeholder="เช่น Notebook, Printer, Monitor"
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
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"/>
                      กำลังเพิ่ม...
                    </span>
                  ) : "เพิ่ม"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-0">
            {err && <div className="alert alert-danger m-3">{err}</div>}

            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 110 }}>รหัส</th>
                    <th>ชื่อประเภท</th>
                    <th style={{ width: 240 }} className="text-end">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      <SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/><SkeletonRow/>
                    </>
                  ) : types.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">ไม่พบข้อมูล</td>
                    </tr>
                  ) : (
                    types.map((t) => (
                      <tr key={t.type_id}>
                        <td className="text-nowrap">#{t.type_id}</td>
                        <td>
                          {editId === t.type_id ? (
                            <input
                              className="form-control"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <span className="fw-semibold">{t.type_name}</span>
                          )}
                        </td>
                        <td className="text-end">
                          {editId === t.type_id ? (
                            <div className="btn-group">
                              <button className="btn btn-sm btn-success" onClick={onSave} disabled={savingEdit}>
                                {savingEdit ? "กำลังบันทึก..." : "บันทึก"}
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => { setEditId(null); setEditName(""); }}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(t)}>
                                แก้ไข
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(t.type_id)}>
                                ลบ
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-3 small text-muted">
          แนะนำ: ใช้ชื่อสั้น กระชับ และสม่ำเสมอ (เช่น “Notebook” แทน “โน้ตบุ๊ก/แล็ปท็อป” ปนกัน) เพื่อให้ค้นหาและรายงานง่ายขึ้น
        </div>
      </div>
    </div>
  );
}
