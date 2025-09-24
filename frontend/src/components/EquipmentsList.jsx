import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listEquipments, removeEquipment } from "../services/api";

export default function EquipmentsList() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => { if (!localStorage.getItem("auth_user")) navigate("/login", {replace:true}); }, [navigate]);

  const load = async () => {
    const res = await listEquipments({ q, page, pageSize });
    setItems(res.data); setTotal(res.total);
  };
  useEffect(() => { load(); }, [page]); // โหลดเมื่อเปลี่ยนหน้า
  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await removeEquipment(id);
    load();
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background:"#6a5acd" }}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/home">Equipment Manager</Link>
          <div className="d-flex">
            <Link className="btn btn-outline-light btn-sm" to="/equipments/new">+ เพิ่มอุปกรณ์</Link>
          </div>
        </div>
      </nav>

      <main className="container my-4 flex-grow-1">
        <form className="row g-2 mb-3" onSubmit={onSearch}>
          <div className="col-auto">
            <input className="form-control" placeholder="ค้นหา..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="col-auto">
            <button className="btn btn-primary">ค้นหา</button>
          </div>
        </form>

        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>รหัส</th><th>ชื่ออุปกรณ์</th><th>ยี่ห้อ</th><th>ประเภท</th>
                  <th className="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.equipment_id}>
                    <td>{it.equipment_id}</td>
                    <td>{it.equipment_name}</td>
                    <td>{it.brand_name || "-"}</td>
                    <td>{it.type_name || "-"}</td>
                    <td className="text-end">
                      <Link className="btn btn-sm btn-outline-primary me-2" to={`/equipments/${it.equipment_id}/edit`}>แก้ไข</Link>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>del(it.equipment_id)}>ลบ</button>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan="5" className="text-center py-4 text-muted">ไม่พบข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* pagination */}
        <nav className="mt-3">
          <ul className="pagination">
            <li className={`page-item ${page===1?'disabled':''}`}>
              <button className="page-link" onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>
            </li>
            <li className="page-item disabled"><span className="page-link">{page}/{pages}</span></li>
            <li className={`page-item ${page===pages?'disabled':''}`}>
              <button className="page-link" onClick={()=>setPage(p=>Math.min(pages,p+1))}>›</button>
            </li>
          </ul>
        </nav>
      </main>
    </div>
  );
}
