// frontend/src/EquipmentCreate.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchBrands, fetchTypes, createEquipment } from "../services/api";

export default function EquipmentCreate(){
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setErr] = useState("");
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    asset_code: "",
    equipment_name: "",
    brand_id: "",
    type_id: "",
    tag: "",
    qty: 1,
    status: "พร้อมใช้",
    purchase_date: "",
    start_date: "",
    warranty_expire: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [b, t] = await Promise.all([fetchBrands(), fetchTypes()]);
        setBrands(b || []);
        setTypes(t || []);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (name, value) => {
    // รหัสครุภัณฑ์เป็นตัวพิมพ์ใหญ่อัตโนมัติ
    const v = name === "asset_code" ? value.toUpperCase() : value;
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const hasError = (name) => {
    if (name === "equipment_name") return touched[name] && !form.equipment_name.trim();
    if (name === "qty") return touched[name] && Number(form.qty) < 1;
    return false;
  };

  async function onSubmit(e){
    e.preventDefault();
    setErr("");

    // ตรวจง่ายๆ ก่อนส่ง
    if (!form.equipment_name.trim()) {
      setTouched(t => ({...t, equipment_name: true}));
      return setErr("กรุณากรอกชื่ออุปกรณ์");
    }
    if (Number(form.qty) < 1) {
      setTouched(t => ({...t, qty: true}));
      return setErr("จำนวนต้องมากกว่าหรือเท่ากับ 1");
    }

    const payload = {
      ...form,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      type_id:  form.type_id  ? Number(form.type_id)  : null,
      qty: form.qty ? Number(form.qty) : 1,
    };

    try {
      setSubmitting(true);
      await createEquipment(payload);
      navigate("/equipments", { replace: true });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>
        <div className="placeholder-glow w-75">
          <span className="placeholder col-12" style={{display:"block", height: 220, borderRadius: 16}} />
        </div>
      </div>
    );

  return (
    <div className="min-vh-100 d-flex flex-column"
      style={{background:"linear-gradient(135deg,#f7f8ff 0%,#fff9f4 50%,#f5f2ff 100%)"}}>
      <div className="container-xxl py-4 flex-grow-1">
        {/* Header + Breadcrumb */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
    <nav aria-label="breadcrumb" className="breadcrumb-wrap">
      <ol className="breadcrumb m-0">
        <li className="breadcrumb-item">
          <Link to="/equipments" className="crumb-link">อุปกรณ์</Link>
        </li>
        <li className="breadcrumb-item active text-muted" aria-current="page">เพิ่มข้อมูล</li>
      </ol>
    </nav>

    <Link to="/" className="btn btn-outline-secondary btn-sm">กลับหน้าหลัก</Link>
  </div>

  <h1 className="page-title mt-1">เพิ่มข้อมูลอุปกรณ์</h1>
  <p className="page-subtitle">
    บันทึกรายละเอียดอุปกรณ์และข้อมูลประกัน เพื่อใช้ติดตามสถานะ
  </p>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Card */}
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Card Header */}
          <div className="px-4 py-3 text-white"
            style={{background:"linear-gradient(90deg,#6a5acd,#8b5cf6,#a78bfa)"}}>
            <div className="d-flex align-items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4" width="18" height="14" rx="2" stroke="white"/><path d="M7 8h10M7 12h6" stroke="white" strokeLinecap="round"/>
              </svg>
              <span className="fw-semibold">ฟอร์มเพิ่มอุปกรณ์</span>
            </div>
          </div>

          <div className="card-body p-4">
            <form onSubmit={onSubmit} noValidate>
              {/* Section: ข้อมูลหลัก */}
              <div className="mb-4">
                <div className="section-title d-flex align-items-center gap-2 mb-2">
                  <span className="bullet" />
                  <span className="fw-semibold">ข้อมูลหลัก</span>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">หมายเลขครุภัณฑ์</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text bg-light border-end-0">ID</span>
                      <input
                        name="asset_code"
                        className="form-control border-start-0"
                        value={form.asset_code}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="เช่น CSIT-IT-000123"
                      />
                    </div>
                    <div className="form-text">ใช้รูปแบบมาตรฐานของหน่วยงานเพื่อค้นหาง่าย</div>
                  </div>

                  <div className="col-md-4">
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

                  <div className="col-md-4">
                    <label className="form-label">Service Tag</label>
                    <input
                      name="tag"
                      className="form-control"
                      value={form.tag}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder="เช่น ABCD123"
                    />
                  </div>
                </div>
              </div>

              {/* Section: รายละเอียด */}
              <div className="mb-4">
                <div className="section-title d-flex align-items-center gap-2 mb-2">
                  <span className="bullet" />
                  <span className="fw-semibold">รายละเอียด</span>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">ยี่ห้อ</label>
                    <select
                      name="brand_id"
                      className="form-select"
                      value={form.brand_id}
                      onChange={onChange}
                      onBlur={onBlur}
                    >
                      <option value="">— เลือกยี่ห้อ —</option>
                      {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">ประเภท</label>
                    <select
                      name="type_id"
                      className="form-select"
                      value={form.type_id}
                      onChange={onChange}
                      onBlur={onBlur}
                    >
                      <option value="">— เลือกประเภท —</option>
                      {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">จำนวน</label>
                    <div className="input-group has-validation">
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setForm(p => ({...p, qty: Math.max(1, Number(p.qty||1)-1)}))}
                        aria-label="ลดจำนวน"
                      >−</button>
                      <input
                        type="number"
                        name="qty"
                        className={`form-control text-center ${hasError("qty") ? "is-invalid" : ""}`}
                        min="1"
                        value={form.qty}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setForm(p => ({...p, qty: Number(p.qty||1)+1}))}
                        aria-label="เพิ่มจำนวน"
                      >＋</button>
                      {hasError("qty") && <div className="invalid-feedback d-block">จำนวนต้อง ≥ 1</div>}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">สถานะ</label>
                    <select name="status" className="form-select" value={form.status} onChange={onChange}>
                      <option>พร้อมใช้</option>
                      <option>ส่งซ่อม</option>
                      <option>ปลดระวาง</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: การรับประกัน */}
              <div className="mb-2">
                <div className="section-title d-flex align-items-center gap-2 mb-2">
                  <span className="bullet" />
                  <span className="fw-semibold">การรับประกัน</span>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">วันที่ซื้อ</label>
                    <input type="date" name="purchase_date" className="form-control"
                      value={form.purchase_date} onChange={onChange} onBlur={onBlur}/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">เริ่มใช้งาน</label>
                    <input type="date" name="start_date" className="form-control"
                      value={form.start_date} onChange={onChange} onBlur={onBlur}/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">วันสิ้นประกัน</label>
                    <input type="date" name="warranty_expire" className="form-control"
                      value={form.warranty_expire} onChange={onChange} onBlur={onBlur}/>
                  </div>
                </div>
                <div className="form-text mt-2">
                  ระบุวันสิ้นประกันเพื่อให้แสดงเตือนในหน้า “ใกล้หมดประกัน”
                </div>
              </div>

              {/* Sticky Actions */}
              <div className="mt-4 d-flex gap-2 justify-content-end sticky-actions">
                <Link to="/" className="btn btn-outline-secondary">ยกเลิก</Link>
                <button className="btn btn-primary px-4" disabled={submitting}>
                  {submitting ? (
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

        {/* Tips Box (เสริมประสบการณ์ผู้ใช้) */}
        <div className="mt-3 small text-muted">
          แนะนำ: กำหนดรูปแบบรหัสครุภัณฑ์ให้สอดคล้องกัน เช่น <code>CSIT-IT-000123</code> เพื่อให้ง่ายต่อการค้นหาและรายงาน
        </div>
      </div>
    </div>
  );
}
