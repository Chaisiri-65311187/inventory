// frontend/src/EquipmentEdit.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchBrands, fetchTypes,
  fetchEquipmentFull, updateEquipment
} from "../services/api";


export default function EquipmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    equipment_name: "",
    brand_id: "",
    type_id: "",
    asset_code: "",
    service_code: "",
    price: "",
    description: "",
    start_date: "",
    status: "",
    warranty_expire: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [b, t, item] = await Promise.all([
          fetchBrands(),
          fetchTypes(),
          fetchEquipmentFull(id)
        ]);
        setBrands(b || []);
        setTypes(t || []);
        setForm({
          equipment_name: item.equipment_name || "",
          brand_id: item.brand_id || "",
          type_id: item.type_id || "",
          asset_code: item.asset_code || "",
          service_code: item.service_code || "",
          price: item.price ?? "",
          description: item.description || "",
          start_date: item.start_date ? item.start_date.substring(0,10) : "",
          status: item.status || "",
          warranty_expire: item.warranty_expire ? item.warranty_expire.substring(0,10) : "",
        });
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (name, value) => {
    const v = name === "asset_code" ? value.toUpperCase() : value; // รหัสครุภัณฑ์เป็นตัวพิมพ์ใหญ่
    setForm(f => ({ ...f, [name]: v }));
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const onBlur = (e) => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  };

  const hasError = (name) => {
    if (name === "equipment_name") return touched[name] && !form.equipment_name.trim();
    if (name === "price") return touched[name] && form.price !== "" && Number(form.price) < 0;
    return false;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.equipment_name.trim()) {
      setTouched(t => ({...t, equipment_name: true}));
      return setErr("กรุณากรอกชื่ออุปกรณ์");
    }
    if (form.price !== "" && Number(form.price) < 0) {
      setTouched(t => ({...t, price: true}));
      return setErr("ราคาต้องไม่ติดลบ");
    }

    try {
      setSaving(true);
      await updateEquipment(id, {
        ...form,
        brand_id: form.brand_id || null,
        type_id: form.type_id || null,
        price: form.price === "" ? null : Number(form.price),
      });
      navigate("/equipments", { replace: true });
    } catch (e2) {
      setErr("บันทึกไม่สำเร็จ: " + (e2?.message || e2));
    } finally {
      setSaving(false);
    }
  };

  const Skeleton = ({ h=220 }) => (
    <div className="placeholder-glow">
      <span className="placeholder col-12" style={{display:"block", height:h, borderRadius:16}} />
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column"
         style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>

      <main className="container-xxl my-4 flex-grow-1">
        {/* Page Header */}
        <header className="page-header mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <nav aria-label="breadcrumb" className="breadcrumb-wrap">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/equipments" className="crumb-link">อุปกรณ์</Link>
                </li>
                <li className="breadcrumb-item active text-muted" aria-current="page">แก้ไข #{id}</li>
              </ol>
            </nav>
            <Link to="/equipments" className="btn btn-outline-secondary btn-sm">กลับรายการ</Link>
          </div>
          <h1 className="page-title mt-1">แก้ไขอุปกรณ์ #{id}</h1>
          <p className="page-subtitle">ปรับปรุงรายละเอียดและข้อมูลประกันของอุปกรณ์ให้เป็นปัจจุบัน</p>
        </header>

        {err && <div className="alert alert-danger">{err}</div>}
        {loading ? (
          <Skeleton />
        ) : (
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            {/* Card Header */}
            <div className="px-4 py-3 text-white"
                 style={{background:"linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)"}}>
              <div className="d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="4" width="18" height="14" rx="2" stroke="white"/><path d="M7 8h10M7 12h6" stroke="white" strokeLinecap="round"/>
                </svg>
                <span className="fw-semibold">ฟอร์มแก้ไขอุปกรณ์</span>
              </div>
            </div>

            <div className="card-body p-4">
              <form onSubmit={onSubmit} noValidate>
                {/* กลุ่ม: ข้อมูลหลัก */}
                <div className="mb-4">
                  <div className="section-title d-flex align-items-center gap-2 mb-2">
                    <span className="bullet" />
                    <span className="fw-semibold">ข้อมูลหลัก</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">ชื่ออุปกรณ์ <span className="text-danger">*</span></label>
                      <input
                        name="equipment_name"
                        className={`form-control ${hasError("equipment_name") ? "is-invalid" : ""}`}
                        value={form.equipment_name}
                        onChange={onChange}
                        onBlur={onBlur}
                        required
                        placeholder="เช่น Laptop Dell 15”"
                        autoFocus
                      />
                      {hasError("equipment_name") && (
                        <div className="invalid-feedback">กรุณากรอกชื่ออุปกรณ์</div>
                      )}
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">ยี่ห้อ</label>
                      <select name="brand_id" className="form-select"
                              value={form.brand_id || ""} onChange={onChange} onBlur={onBlur}>
                        <option value="">— ไม่ระบุ —</option>
                        {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
                      </select>
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">ประเภท</label>
                      <select name="type_id" className="form-select"
                              value={form.type_id || ""} onChange={onChange} onBlur={onBlur}>
                        <option value="">— ไม่ระบุ —</option>
                        {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* กลุ่ม: รายละเอียดอุปกรณ์ */}
                <div className="mb-4">
                  <div className="section-title d-flex align-items-center gap-2 mb-2">
                    <span className="bullet" />
                    <span className="fw-semibold">รายละเอียดอุปกรณ์</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label">หมายเลขครุภัณฑ์</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">ID</span>
                        <input name="asset_code" className="form-control border-start-0"
                               value={form.asset_code} onChange={onChange} onBlur={onBlur}
                               placeholder="เช่น CSIT-IT-000123" />
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Service Code</label>
                      <input name="service_code" className="form-control"
                             value={form.service_code} onChange={onChange} onBlur={onBlur}
                             placeholder="เช่น ABCD123" />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">ราคา</label>
                      <div className="input-group has-validation">
                        <span className="input-group-text">฿</span>
                        <input name="price" type="number" step="0.01"
                               className={`form-control ${hasError("price") ? "is-invalid" : ""}`}
                               value={form.price} onChange={onChange} onBlur={onBlur}
                               placeholder="เช่น 35000.00" />
                        {hasError("price") && <div className="invalid-feedback d-block">ราคาต้องไม่ติดลบ</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* กลุ่ม: การใช้งาน/ประกัน */}
                <div className="mb-4">
                  <div className="section-title d-flex align-items-center gap-2 mb-2">
                    <span className="bullet" />
                    <span className="fw-semibold">การใช้งาน & การรับประกัน</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label">เริ่มใช้งาน</label>
                      <input name="start_date" type="date" className="form-control"
                             value={form.start_date} onChange={onChange} onBlur={onBlur}/>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">วันสิ้นประกัน</label>
                      <input name="warranty_expire" type="date" className="form-control"
                             value={form.warranty_expire} onChange={onChange} onBlur={onBlur}/>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">สถานะ</label>
                      <select name="status" className="form-select"
                              value={form.status || ""} onChange={onChange} onBlur={onBlur}>
                        <option value="">— ไม่ระบุ —</option>
                        <option value="พร้อมใช้">พร้อมใช้</option>
                        <option value="ส่งซ่อม">ส่งซ่อม</option>
                        <option value="ปลดระวาง">ปลดระวาง</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-text mt-2">กรอกวันสิ้นประกันเพื่อให้ระบบแจ้งเตือนในหน้า “ใกล้หมดประกัน”</div>
                </div>

                {/* กลุ่ม: อื่น ๆ */}
                <div className="mb-2">
                  <div className="section-title d-flex align-items-center gap-2 mb-2">
                    <span className="bullet" />
                    <span className="fw-semibold">อื่น ๆ</span>
                  </div>
                  <label className="form-label">รายละเอียดเพิ่มเติม</label>
                  <textarea name="description" rows="3" className="form-control"
                            value={form.description} onChange={onChange} onBlur={onBlur}
                            placeholder="โน้ต/สภาพ/อุปกรณ์เสริม ฯลฯ" />
                </div>

                {/* Sticky actions */}
                <div className="mt-4 d-flex gap-2 justify-content-end sticky-actions">
                  <Link to="/equipments" className="btn btn-outline-secondary">ยกเลิก</Link>
                  <button className="btn btn-primary px-4" disabled={saving}>
                    {saving ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"/>
                        กำลังบันทึก...
                      </span>
                    ) : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <footer className="py-3 text-center text-muted small">
        © {new Date().getFullYear()} Equipment Manager
      </footer>
    </div>
  );
}
